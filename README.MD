Sample installation workflow

```yaml
name: 'Welcome New Contributors'

on:
  issues:
    types: [unlabeled]
  issue_comment:
    types: [created]

jobs:
  welcome-new-contributor:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: 'Swift Bot'
        uses: swiftwave-org/bot@develop
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          triage-team-usernames: tanmoysrt
```

Update `swiftwave-org/bot@develop` with your fork repo details to test
- swiftwave-org : org name
- bot : repo name
- develop : branch name

Available Option
- Remove `pending-triage` label, that will unlock conversion and write message for start working
- `/approve` command > approve issue, this will remove `pending-triage` label and do the same as before