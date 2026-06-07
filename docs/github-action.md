# GitHub Action Usage

`oss-scout` can run as a read-only GitHub Action and write a Markdown issue scouting report to the workflow job summary.

The action does not comment on issues, create pull requests, edit files, or store tokens.

## Permissions

Use read-only permissions:

```yaml
permissions:
  contents: read
  issues: read
```

For cross-repository scans, the default `GITHUB_TOKEN` must have read access to the target repository. Public repositories work with the normal workflow token.

## Repository scan

```yaml
name: oss-scout repo scan

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
          repo: cli/cli
          limit: "25"
```

## Search query scan

```yaml
name: oss-scout issue search

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
          query: 'label:good-first-issue language:typescript'
          limit: "20"
```

## Scheduled scan

```yaml
name: weekly oss-scout

on:
  schedule:
    - cron: "0 9 * * 1"
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

## Output

The action writes the ranked Markdown report to the GitHub Actions job summary and sets one output:

| Output | Description |
| --- | --- |
| `issue-count` | Number of issues included in the report. |

The report includes each issue score, risk level, labels, link, and scoring signals.
