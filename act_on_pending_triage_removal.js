const core = require('@actions/core');
const github = require('@actions/github');

/**
* This function will be only run if
* - Event is `issues` and action is `unlabeled`
* - The label removed is `pending-triage`
* - The issue is not closed
* 
* This function will:
* - Unlock the issues if it is locked
* 
* @export
* @typedef {import('@octokit/core').Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types").Api & { paginate: import("@octokit/plugin-paginate-rest").PaginateInterface; }} octokit
* @param {octokit} octokit - Octokit instance
* @returns {Promise<void>}
*/
export default async function act_on_pending_triage_removal(octokit) {
    const issue = github.context.payload.issue;

    // Check event name and action
    if (github.context.eventName == "issues" && github.context.payload.action == "unlabeled") {
        // check if the label removed is `pending-triage`
        if (github.context.payload.label.name == "pending-triage") {
            // Check if the issue is closed
            if (issue.state == "closed") {
                core.info("Issue is closed, no action needed");
            } else {
                // Check if the issue is locked
                if (issue.locked == true) {
                    // Unlock the issue
                    core.info("Issue is locked, unlocking...");
                    try {
                        const octokit_response = await octokit.rest.issues.unlock({
                            owner: github.context.payload.repository.owner.login,
                            repo: github.context.payload.repository.name,
                            issue_number: issue.number
                        });
                        if( octokit_response.status == 204 ){
                            core.info("Issue unlocked successfully");
                        } else {
                            core.error("Issue unlocking failed with status code " + octokit_response.status.toString());
                        }
                    } catch (error) {
                        core.error("Issue unlocking failed");
                        core.error(error);
                    }

                } else {
                    core.info("Issue is not locked, no action needed");
                }
            }
        }
    }
}