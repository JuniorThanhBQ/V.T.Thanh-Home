module.exports = async ({ github, context, core }) => {
  const repo = context.repo;
  const defaultBranch = context.payload.repository.default_branch;
  const authors = new Map([
    ['dependabot[bot]', 'patch'],
    ['JuniorThanhBQ', 'minor'],
  ]);
  const eligible = pr => pr.merged_at &&
    pr.base.ref === defaultBranch && authors.has(pr.user.login);
  const parseVersion = name => {
    const match = /^v4\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(name);
    return match ? [BigInt(match[1]), BigInt(match[2])] : null;
  };
  const compare = (left, right) => {
    for (let i = 0; i < 2; i++) {
      if (left[i] !== right[i]) return left[i] > right[i] ? 1 : -1;
    }
    return 0;
  };
  let pullRequests;
  if (context.eventName === 'pull_request_target') {
    pullRequests = [context.payload.pull_request].filter(eligible);
  } else {
    const { data: workflow } = await github.rest.actions.getWorkflow({
      ...repo,
      workflow_id: 'auto-release-workflows.yml',
    });
    const start = Date.parse(workflow.created_at);
    if (!Number.isFinite(start)) throw new Error('Missing workflow creation date');
    pullRequests = [];
    for await (const { data: page } of github.paginate.iterator(
      github.rest.pulls.list,
      { ...repo, state: 'closed', sort: 'updated', direction: 'desc', per_page: 100 },
    )) {
      pullRequests.push(...page.filter(pr => eligible(pr) && Date.parse(pr.merged_at) >= start));
      if (page.some(pr => Date.parse(pr.updated_at) < start)) break;
    }
    pullRequests.sort((a, b) => Date.parse(a.merged_at) - Date.parse(b.merged_at) || a.number - b.number);
  }
  if (pullRequests.length === 0) {
    core.info('No eligible merged pull requests');
    return;
  }
  const tags = (await github.paginate(github.rest.repos.listTags, {
    ...repo, per_page: 100,
  })).filter(tag => parseVersion(tag.name));
  const releases = new Map((await github.paginate(github.rest.repos.listReleases, {
    ...repo, per_page: 100,
  })).map(release => [release.tag_name, release]));
  let latest = tags.reduce((best, tag) => {
    const version = parseVersion(tag.name);
    return compare(version, best) > 0 ? version : best;
  }, [0n, 0n]);
  for (const pr of pullRequests) {
    const sha = pr.merge_commit_sha;
    if (!/^[0-9a-f]{40}$/.test(sha ?? '')) {
      throw new Error(`Missing merge commit for PR #${pr.number}`);
    }
    const matching = tags.filter(tag => tag.commit.sha === sha);
    if (matching.length > 1) throw new Error(`Multiple v4 tags for PR #${pr.number}`);
    const kind = authors.get(pr.user.login);
    let tagName = matching[0]?.name;
    if (!tagName) {
      const next = kind === 'minor' ? [latest[0] + 1n, 0n] : [latest[0], latest[1] + 1n];
      tagName = `v4.${next[0]}.${next[1]}`;
      await github.rest.git.createRef({ ...repo, ref: `refs/tags/${tagName}`, sha });
      tags.push({ name: tagName, commit: { sha } });
      latest = next;
    }
    const existing = releases.get(tagName);
    if (existing) {
      if (existing.draft || existing.prerelease) {
        throw new Error(`Expected a published stable release for ${tagName}`);
      }
      core.info(`Release ${tagName} already exists for PR #${pr.number}`);
      continue;
    }
    const { data: release } = await github.rest.repos.createRelease({
      ...repo,
      tag_name: tagName,
      target_commitish: sha,
      name: `${tagName} (${kind} release)`,
      body: [
        `${kind === 'minor' ? 'Developer update' : 'Automated dependency update'} by ${pr.user.login}`,
        `Pull request #${pr.number}: ${pr.title}`,
        pr.html_url,
        `Commit: ${sha}`,
      ].join('\n\n'),
      draft: false,
      prerelease: false,
      make_latest: compare(parseVersion(tagName), latest) === 0 ? 'true' : 'false',
    });
    releases.set(tagName, release);
    core.info(`Published ${release.html_url}`);
  }
};
