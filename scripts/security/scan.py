import argparse
import datetime
import json
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

TRIVY_IMAGE = "aquasec/trivy:latest@sha256:2416d1f74045b57274df1a340eee6b510cacd73c66a6ccb8da092b117eb7d222"
SEMGREP_IMAGE = "semgrep/semgrep:latest@sha256:529ee8a277ec8adc5b534d7c74eea0a47e9de21d62852b6ba7ac6ba9566845c3"
GITLEAKS_IMAGE = "zricethezav/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f"
DEFAULT_MODEL = "hf.co/mradermacher/Cyber-Ornith-1.5-9B-OBLITERATED-i1-GGUF:Q4_K_M"


def check_prerequisites(npm_cmd):
    missing = []
    for cmd in ["docker", "git", npm_cmd]:
        if shutil.which(cmd) is None:
            missing.append(cmd)
    if missing:
        raise SystemExit(f"Missing prerequisites: {', '.join(missing)}")

    res_version = subprocess.run(
        ["docker", "info", "--format", "{{.ServerVersion}}"],
        check=False,
        capture_output=True,
        text=True,
    )
    if res_version.returncode != 0:
        raise SystemExit("Start Docker Desktop in Linux-container mode and retry.")
    if res_version.stdout:
        print(res_version.stdout.strip())

    res_os = subprocess.run(
        ["docker", "info", "--format", "{{.OSType}}"],
        check=False,
        capture_output=True,
        text=True,
    )
    if res_os.returncode != 0 or res_os.stdout.strip() != "linux":
        raise SystemExit("Docker must use Linux containers.")


def invoke_scan_step(name, command, arguments, report_path, output_dir, steps_list):
    print(f"Running {name}...")
    log_path = output_dir / f"{name}.log"
    started = datetime.datetime.now(datetime.UTC).isoformat()
    try:
        with open(log_path, "w", encoding="utf-8") as log_file:
            process = subprocess.run(
                [command] + arguments,
                check=False,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                text=True,
            )
        code = process.returncode
        if code == 0:
            state = "passed"
        elif code == 1:
            state = "findings"
        else:
            state = "error"

        if not report_path.is_file():
            state = "error"
        if state != "error":
            try:
                with open(report_path, "r", encoding="utf-8") as rf:
                    data = json.load(rf)
                if (
                    not isinstance(data, dict)
                    or (name == "npm-audit" and "error" in data)
                    or name == "semgrep"
                    and data.get("errors")
                ):
                    state = "error"
            except OSError, ValueError:
                state = "error"
    except OSError as exc:
        with open(log_path, "a", encoding="utf-8") as log_file:
            log_file.write(f"\n{exc!s}\n")
        code = -1
        state = "error"

    steps_list.append(
        {
            "name": name,
            "status": state,
            "exitCode": code,
            "startedUtc": started,
            "report": str(report_path),
            "log": str(log_path),
        }
    )
    print(f"{name}: {state}")


def main():
    parser = argparse.ArgumentParser(description="Static security audit runner")
    parser.add_argument("--check-only", action="store_true")
    parser.add_argument("--with-ai", action="store_true")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    args = parser.parse_args()

    root = Path(__file__).resolve().parent.parent.parent
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

    check_prerequisites(npm_cmd)

    if args.check_only:
        print(
            "Prerequisites available. Scanner images and rules are downloaded on the first scan."
        )
        sys.exit(0)

    run_id = (
        datetime.datetime.now().strftime("%Y%m%d-%H%M%S") + f"-{uuid.uuid4().hex[:8]}"
    )
    output = root / "reports" / "security" / run_id
    output.mkdir(parents=True, exist_ok=True)

    steps = []
    commit = None
    dirty = None
    versions = {}
    image_metadata = []
    images = [TRIVY_IMAGE, SEMGREP_IMAGE, GITLEAKS_IMAGE]

    container_args = [
        "run",
        "--rm",
        "--cpus=2",
        "--memory=4g",
        "--pids-limit=256",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "--mount",
        f"type=bind,source={root},target=/src,readonly",
        "--mount",
        f"type=bind,source={output},target=/reports",
        "--workdir",
        "/src",
    ]

    try:
        res_commit = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=root,
            check=False,
            capture_output=True,
            text=True,
        )
        if res_commit.returncode != 0:
            raise RuntimeError("Cannot identify the repository commit.")
        commit = res_commit.stdout.strip()

        res_dirty = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=root,
            check=False,
            capture_output=True,
            text=True,
        )
        dirty = len(res_dirty.stdout.strip().splitlines()) > 0

        git_v = subprocess.run(
            ["git", "--version"], check=False, capture_output=True, text=True
        ).stdout.strip()
        npm_v = subprocess.run(
            [npm_cmd, "--version"], check=False, capture_output=True, text=True
        ).stdout.strip()
        docker_v = subprocess.run(
            ["docker", "--version"], check=False, capture_output=True, text=True
        ).stdout.strip()
        versions = {"git": git_v, "npm": npm_v, "docker": docker_v}

        for image in images:
            print(f"Preparing {image}...")
            short_name = image.split("/")[1].split(":")[0]
            log_pull = output / f"image-{short_name}.log"
            with open(log_pull, "w", encoding="utf-8") as f:
                res_pull = subprocess.run(
                    ["docker", "pull", image],
                    check=False,
                    stdout=f,
                    stderr=subprocess.STDOUT,
                    text=True,
                )
            if res_pull.returncode != 0:
                steps.append(
                    {
                        "name": f"pull:{image}",
                        "status": "error",
                        "exitCode": res_pull.returncode,
                    }
                )
            else:
                res_inspect = subprocess.run(
                    [
                        "docker",
                        "image",
                        "inspect",
                        image,
                        "--format",
                        "{{json .RepoDigests}}",
                    ],
                    check=False,
                    capture_output=True,
                    text=True,
                )
                repo_digests = res_inspect.stdout.strip()
                try:
                    repo_digests = json.loads(repo_digests)
                except json.JSONDecodeError:
                    print(
                        f"Could not decode repository digests for {image}.",
                        file=sys.stderr,
                    )
                image_metadata.append({"image": image, "repoDigests": repo_digests})

        frontend_dir = root / "frontend" / "V.T.Thanh-Home-Angular"
        npm_report = output / "npm-audit.json"
        npm_log = output / "npm-audit.log"
        print("Running npm-audit...")
        with (
            open(npm_report, "w", encoding="utf-8") as rf,
            open(npm_log, "w", encoding="utf-8") as lf,
        ):
            res_npm = subprocess.run(
                [
                    npm_cmd,
                    "--prefix",
                    str(frontend_dir),
                    "audit",
                    "--package-lock-only",
                    "--ignore-scripts",
                    "--audit-level=high",
                    "--json",
                ],
                check=False,
                stdout=rf,
                stderr=lf,
                text=True,
            )
        npm_code = res_npm.returncode
        npm_state = (
            "passed" if npm_code == 0 else ("findings" if npm_code == 1 else "error")
        )
        try:
            with open(npm_report, "r", encoding="utf-8") as rf:
                audit_data = json.load(rf)
            if (
                not isinstance(audit_data, dict)
                or "error" in audit_data
                or "metadata" not in audit_data
            ):
                npm_state = "error"
        except OSError, ValueError:
            npm_state = "error"
        steps.append(
            {
                "name": "npm-audit",
                "status": npm_state,
                "exitCode": npm_code,
                "report": str(npm_report),
            }
        )

        invoke_scan_step(
            "trivy",
            "docker",
            container_args
            + [
                TRIVY_IMAGE,
                "fs",
                "--scanners",
                "vuln,misconfig",
                "--severity",
                "MEDIUM,HIGH,CRITICAL",
                "--exit-code",
                "1",
                "--timeout",
                "15m",
                "--format",
                "json",
                "--output",
                "/reports/trivy.json",
                "--skip-dirs",
                ".git,node_modules,.gradle,.angular,.venv,.agents,.codex,.codegraph,reports,dist,build",
                "/src",
            ],
            output / "trivy.json",
            output,
            steps,
        )

        invoke_scan_step(
            "semgrep",
            "docker",
            container_args
            + [
                SEMGREP_IMAGE,
                "semgrep",
                "scan",
                "--config",
                "p/security-audit",
                "--config",
                "p/owasp-top-ten",
                "--metrics=off",
                "--disable-version-check",
                "--error",
                "--strict",
                "--timeout",
                "30",
                "--exclude",
                "reports",
                "--exclude",
                "node_modules",
                "--exclude",
                ".agents",
                "--exclude",
                ".codex",
                "--exclude",
                ".codegraph",
                "--json",
                "--output",
                "/reports/semgrep.json",
                "/src/backend",
                "/src/frontend",
                "/src/scripts",
            ],
            output / "semgrep.json",
            output,
            steps,
        )

        invoke_scan_step(
            "gitleaks-worktree",
            "docker",
            container_args
            + [
                GITLEAKS_IMAGE,
                "dir",
                "/src",
                "--config",
                "/src/scripts/security/gitleaks.toml",
                "--redact=100",
                "--exit-code",
                "1",
                "--report-format",
                "json",
                "--report-path",
                "/reports/gitleaks-worktree.json",
                "--no-banner",
            ],
            output / "gitleaks-worktree.json",
            output,
            steps,
        )

        invoke_scan_step(
            "gitleaks-history",
            "docker",
            container_args
            + [
                GITLEAKS_IMAGE,
                "git",
                "/src",
                "--config",
                "/src/scripts/security/gitleaks.toml",
                "--log-opts=--all",
                "--redact=100",
                "--exit-code",
                "1",
                "--report-format",
                "json",
                "--report-path",
                "/reports/gitleaks-history.json",
                "--no-banner",
            ],
            output / "gitleaks-history.json",
            output,
            steps,
        )

        if args.with_ai:
            review_script = Path(__file__).resolve().parent / "review_local.py"
            res_ai = subprocess.run(
                [
                    sys.executable,
                    str(review_script),
                    "--output-directory",
                    str(output),
                    "--model",
                    args.model,
                ],
                check=False,
            )
            ai_code = res_ai.returncode
            steps.append(
                {
                    "name": "local-ai-review",
                    "status": "advisory" if ai_code == 0 else "error",
                    "exitCode": ai_code,
                }
            )
    except (OSError, RuntimeError, ValueError) as exc:
        steps.append({"name": "runner", "status": "error", "message": str(exc)})

    failed = any(s.get("status") == "error" for s in steps)
    findings = any(s.get("status") == "findings" for s in steps)
    result = "incomplete" if failed else ("findings" if findings else "passed")

    summary_data = {
        "status": result,
        "finishedUtc": datetime.datetime.now(datetime.UTC).isoformat(),
        "sourceCommit": commit,
        "dirtyWorktree": dirty,
        "versions": versions,
        "images": image_metadata,
        "threshold": "HIGH,CRITICAL for dependency/configuration checks; all Semgrep and Gitleaks findings",
        "scope": "Static source, lockfiles, configuration, worktree secrets, and locally available Git history",
        "exclusions": "Generated/vendor directories excluded by tools and ignore files; no runtime, container-image, or authenticated testing",
        "steps": steps,
    }

    with open(output / "summary.json", "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    print(f"Scan status: {result}. Reports: {output}")

    if failed:
        sys.exit(2)
    if findings:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
