# CLI Query Examples

These examples are read-only and use public GitHub issue search syntax.

## Repository scan

```bash
oss-scout repo cli/cli --limit 25 --markdown
```

## Good-first issue search

```bash
oss-scout search "label:good-first-issue language:typescript" --limit 20 --json
```

## Help-wanted issues in an organization

```bash
oss-scout search "org:nodejs label:help-wanted" --limit 15 --markdown
```

## Save a report

```bash
oss-scout search "label:good-first-issue is:open" --limit 30 --markdown > oss-scout-report.md
```
