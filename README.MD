Sample installation workflow

```yaml
name: 'SwiftWave Triage Bot'

on:
  issues:
    types: [unlabeled]
  issue_comment:
    types: [created]

jobs:
  swiftwave-triage-bot:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
      contents: write
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
- `/update` command > update the base branch of pull request branch
- Add `max-assignee-{number}` label, that will limit the number of assignees for the issue. If not provided it will be limited to 1
- `/assign` command > assigns the issue to the commenter
- `/unassign` command > unassigns the issue from the commenter
- `/assign @user1` command > assigns the issue to `user1` (can only be used by triage-team members)
- `/unassign @user1` command > unassigns `user1` from the issue (can only be used by triage-team members)
