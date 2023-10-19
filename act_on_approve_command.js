const core = require("@actions/core");
const github = require("@actions/github");
const { Issue, IssueComment } = require("./singletons");

const { verifyTriageTeam } = require("./helpers");

/**
 * This function will be only run if
 * - Verify run is triggered by a member of triage team
 * - Event is `issue_comment` and action is `created`
 * - The messgae is `/approve`
 * - The issue is not closed
 *
 * This function will:
 * - If locked but has no pending-triage label, add `pending-triage` label
 * - Remove the `pending-triage` label, this will trigger `act_on_pending_triage_removal`
 *
 * @export
 * @typedef {import('@octokit/core').Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types").Api & { paginate: import("@octokit/plugin-paginate-rest").PaginateInterface; }} octokit
 * @param {octokit} octokit - Octokit instance
 * @returns {Promise<void>}
 */
async function act_on_approve_command(octokit) {
    if (verifyTriageTeam() === false) {
        core.info("Not a member of triage team, no action needed");
        return;
    }
    const issue = await Issue.getInstance();
    if (issue.actions_payload.state == "closed") {
        core.info("Issue is closed, no action needed");
        return;
    }
    const issue_comment = await IssueComment.getInstance();
    // Check event name and action
    if (github.context.eventName === "issue_comment" && github.context.action === "created") {
        // Fetch comment body
        if ((issue_comment.details.body_text ?? "").trim() === "/approve") {
            // Find out if `pending-triage` label exists
            let pending_triage_label_exists = false;
            issue.details.labels.forEach((label) => {
                if (label.name === "pending-triage") {
                    pending_triage_label_exists = true;
                }
            });
            // Ignore if the issue is not locked
            if (issue.actions_payload.locked === false) {
                core.info("Issue is not locked, no action needed");
            } else {
                // if `pending-triage` label does not exist, add it
                if (pending_triage_label_exists === false) {
                    core.info("Adding `pending-triage` label");
                    try {
                        const octokit_response = await octokit.rest.issues.addLabels({
                            owner: github.context.payload.repository.owner.login,
                            repo: github.context.payload.repository.name,
                            issue_number: issue.actions_payload.number,
                            labels: ["pending-triage"],
                        });
                        if (octokit_response.status == 200) {
                            core.info("Label added successfully");
                        } else {
                            core.setFailed("Failed to add label");
                        }
                    } catch (error) {
                        core.setFailed(error.message);
                    }
                }
            }

            // Remove the `pending-triage` label to trigger other actions
            core.info("Removing `pending-triage` label");
            try {
                const octokit_response = await octokit.rest.issues.removeLabel({
                    owner: github.context.payload.repository.owner.login,
                    repo: github.context.payload.repository.name,
                    issue_number: issue.actions_payload.number,
                    name: "pending-triage",
                });
                if (octokit_response.status == 200) {
                    core.info("Label removed successfully");
                } else {
                    core.setFailed("Failed to remove label");
                }
            } catch (error) {
                core.setFailed(error.message);
            }

        }
    }
}


module.exports = act_on_approve_command;
