import json
import requests
from pathlib import Path

I18N_DIR = Path("frontend/V.T.Thanh-Home-Angular/src/assets/i18n")
SOURCE_FILE = I18N_DIR / "vi.json"
TARGET_LANGUAGES = {"en": "English", "ja": "Japanese", "zh": "Simplified Chinese"}
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:7b"


def translate_text(text: str, target_lang_name: str) -> str:
    prompt = (
        f"You are a professional software localization translator for a developer portfolio website.\n"
        f"Translate the following text from Vietnamese to {target_lang_name}.\n\n"
        f"STRICT RULES:\n"
        f"- Output ONLY the final translated text.\n"
        f"- Do NOT add explanations, notes, quotes, labels, markdown, or formatting.\n"
        f"- Preserve the original meaning exactly.\n"
        f"- Interpret the text according to software UI and developer portfolio context.\n"
        f"- Prefer standard terminology commonly used in native software interfaces.\n"
        f"- Do NOT translate ambiguous Vietnamese words using unrelated dictionary meanings.\n"
        f"- Keep terminology consistent across translations.\n"
        f"- Preserve numbers, version strings, placeholders, URLs, code identifiers, and proper nouns unless translation is clearly required.\n"
        f"- Keep the translated text concise and natural for UI usage.\n"
        f"- Do NOT summarize, expand, rewrite, or paraphrase unnecessarily.\n\n"
        f"CONTEXT EXAMPLES:\n"
        f'- "Cài đặt" in a navigation or application context means "Settings", not "Install".\n'
        f'- "Hồ sơ" in an account context means "Profile", not "CV", "Resume", or "Portfolio".\n'
        f'- "Bảng điều khiển" means "Dashboard" in a software UI.\n'
        f'- "Thao tác nhanh" means "Quick Actions".\n'
        f'- "Công việc" in a task-management context should normally mean "Tasks".\n\n'
        f'- "Công việc đang chờ" means "Pending tasks" (NOT "work in progress").\n'
        f'- "Quên mật khẩu?" in Japanese must be "パスワードをお忘れですか？".\n'
        f'- Metric card labels must be concise noun phrases, not full conversational sentences.\n'
        f"Vietnamese text:\n{text}\n\n"
        f"Translation:"
    )

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "top_p": 0.8,
            "repeat_penalty": 1.05,
        },
    }

    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json().get("response", "").strip()
        if result.startswith('"') and result.endswith('"') and len(result) > 1:
            result = result[1:-1]
        return result
    except requests.exceptions.RequestException as e:
        print(f"Error calling model: {e}")
        return text


def sync_and_translate_node(source_node, target_node, target_lang_name: str, path: str = "") -> tuple:
    updated = False
    if isinstance(source_node, dict):
        if not isinstance(target_node, dict):
            target_node = {}
            updated = True

        for k, v in source_node.items():
            current_path = f"{path}.{k}" if path else k
            child_target = target_node.get(k)
            child_result, child_updated = sync_and_translate_node(v, child_target, target_lang_name, current_path)
            target_node[k] = child_result
            if child_updated:
                updated = True
        return target_node, updated
    elif isinstance(source_node, str):
        if not target_node or not isinstance(target_node, str):
            print(f"Translating leaf [{path}]: '{source_node}'")
            translated = translate_text(source_node, target_lang_name)
            return translated, True
        return target_node, False
    else:
        return source_node, False


def run_translation():
    with open(SOURCE_FILE, "r", encoding="utf-8") as f:
        source_data = json.load(f)

    for lang_code, lang_name in TARGET_LANGUAGES.items():
        target_file = I18N_DIR / f"{lang_code}.json"
        target_data = {}

        if target_file.exists():
            with open(target_file, "r", encoding="utf-8") as f:
                try:
                    target_data = json.load(f)
                except json.JSONDecodeError:
                    target_data = {}

        print(f"\n Synchronizing locale: [{lang_code}] --- ({lang_name})")
        updated_data, has_changes = sync_and_translate_node(source_data, target_data, lang_name)
        if has_changes:
            with open(target_file, "w", encoding="utf-8") as f:
                json.dump(updated_data, f, ensure_ascii=False, indent=2)
            print(f"Successfully updated: {target_file}")
        else:
            print(f"Locale [{lang_code}] is already up to date.")

if __name__ == "__main__":
    run_translation()
