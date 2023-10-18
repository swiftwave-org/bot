Sample installation workflow

```yaml
name: 'Welcome New Contributors'

on:
  issues:
    types: [unlabeled]

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
```

Update `swiftwave-org/bot@develop` with your fork repo details to test
- swiftwave-org : org name
- bot : repo name
- develop : branch name