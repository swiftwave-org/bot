const core = require('@actions/core');
const github = require('@actions/github');
const { Issue } = require("./singletons");



async function add_labels_and_lock_new_issues(octokit) {
    try {
        // get the issue
        const issue = await Issue.getInstance();

        if (github.context.eventName === "issues" && github.context.payload.action === "opened" && !issue.isPullRequest()) {
            // fetch the issue labels
            const issue_labels = issue.details.labels;
            const hasPendingTriageLabel = issue_labels.some(label => label.name === 'pending-triage');
            const hasMaxAssigneesLabel = issue_labels.some(label => label.name.match(/max-assignees-[0-9]{1,2}/));
            // prepare the missing labels list
            let missingLabels = [];
            if (!hasPendingTriageLabel) {
                core.info("Issue does not have any label");
                missingLabels.push('pending-triage');
            }
            if (!hasMaxAssigneesLabel) {
                core.info("Issue does not have max-assignees label");
                // adding max-assignees-1 by default
                missingLabels.push('max-assignees-1');
            }
            // add the missing labels
            const add_labels_reponse = await octokit.rest.issues.addLabels({
                owner: github.context.payload.repository.owner.login,
                repo: github.context.payload.repository.name,
                issue_number: issue.actions_payload.number,
                labels: missingLabels,
            });

            if (add_labels_reponse.status == 200) {
                core.info("Labels added successfully");
            } else {
                core.setFailed("Failed to add labels");
                return;
            }

            // lock the conversation to author and org members unless approved by triage team
            const lockResponse = await octokit.rest.issues.lock(
                {
                    owner: github.context.payload.repository.owner.login,
                    repo: github.context.payload.repository.name,
                    issue_number: issue.actions_payload.number,
                }
            );
            if (lockResponse.status == 204) {
                core.info("Issue locked successfully");
            } else {
                core.setFailed("Failed to lock issue");
            }
        }
    } catch (error) {
        core.setFailed(error?.message);
    }
}

module.exports = add_labels_and_lock_new_issues