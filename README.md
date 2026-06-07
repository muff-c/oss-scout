# oss-scout

`oss-scout` is a read-only CLI and GitHub Action for ranking open GitHub issues by contribution viability.

It helps maintainers and contributors cut through issue triage noise by scoring freshness, contributor-friendly labels, discussion crowding, assignment status, stale risk, competing PRs, acceptance criteria, and visible bounty signals.

## Install

```bash
npm install -g oss-scout
```

For local development:

```bash
npm install
npm run build
npm run dev -- repo openai/openai-cookbook --limit 10 --markdown
```

## Usage

Scan a repository:

```bash
oss-scout repo owner/name --limit 30 --markdown
```

Run a GitHub issue search:

```bash
oss-scout search "label:good-first-issue language:typescript" --limit 20 --json
```

Authentication uses the normal GitHub environment variables supported by Octokit:

```bash
GITHUB_TOKEN=ghp_your_token_here oss-scout repo owner/name
```

No token is written to disk by `oss-scout`.

## GitHub Action

```yaml
name: oss-scout

on:
  workflow_dispatch:

jobs:
  scout:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: read
    steps:
      - uses: actions/checkout@v4
      - uses: muff-c/oss-scout@v0.1.0
        with:
          repo: owner/name
          limit: "30"
```

The action writes a Markdown report to the job summary. It does not comment on issues, open PRs, or mutate repository state.

## Scoring Model

Scores are transparent and signal-based:

| Signal | Effect |
| --- | ---: |
| Good-first/help-wanted labels | +18 |
| Fresh activity within 14 days | +12 |
| Clear acceptance criteria or reproduction detail | +12 |
| Bounty/reward text or labels | +10 |
| Low thread noise | +6 |
| Stale activity over 90 days | -24 |
| Open competing PR | -18 |
| Crowded discussion | -14 |
| Already assigned | -14 |

The score is clamped between 0 and 100 and mapped to a low, medium, or high risk level.

## Limitations

- Bounty detection is heuristic and only uses public labels/text.
- Linked PR detection is conservative in v0.1.0.
- Scoring is a triage aid, not a promise that an issue is accepted or paid.
- Private repository scans require normal GitHub token access.

## Roadmap

- Improve linked PR detection using issue timeline events.
- Add configurable scoring weights.
- Add maintained-project health summaries.
- Add optional local report files.

## Development

```bash
npm test
npm run lint
npm run build
```

## License

MIT
