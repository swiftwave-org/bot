const core = require('@actions/core');
const github = require('@actions/github');
const { Issue } = require("./singletons");



async function add_labels_and_lock_new_issues(octokit) {
    try {
        // get the issue
        const issue = Issue.getInstance();

        // get the issue labels
        const issue_labels_response = await octokit.rest.issues.listLabelsOnIssue({
            owner: github.context.payload.repository.owner.login,
            repo: github.context.payload.repository.name,
            issue_number: issue.actions_payload.number,
        });
        if (issue_labels_response.status == 200) {
            core.info("Issue labels fetched successfully");
            const hasPendingTriageLabel = issue_labels_response.data.some(label => label.name === 'pending-triage');
            const hasMaxAssigneesLabel = issue_labels_response.data.some(label => label.name === 'max-assignees-1');
            if (!hasPendingTriageLabel) {
                core.info("Issue does not have pending-triage label");
                await issue.addLabels(['pending-triage']);
            }
            if (!hasMaxAssigneesLabel) {
                core.info("Issue does not have max-assignees-1 label");
                await issue.addLabels(['max-assignees-1']);
            }
        } else {
            core.setFailed("Failed to fetch issue labels");
            return;
        }
        // lock the conversation to author and org members unless approved by triage team
        const lockResponse = await octokit.rest.issues.lock(
            {
                owner: github.context.payload.repository.owner.login,
                repo: github.context.payload.repository.name,
                issue_number: issue.actions_payload.number,
                lock_reason: 'spam',
            }
        );
        if (lockResponse.status == 204) {
            core.info("Issue locked successfully");
        } else {
            core.setFailed("Failed to lock issue");
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

module.exports = add_labels_and_lock_new_issues