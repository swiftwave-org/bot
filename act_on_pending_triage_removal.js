const core = require("@actions/core");
const github = require("@actions/github");

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
async function act_on_pending_triage_removal(octokit) {
  const issue = github.context.payload.issue;

  // Check event name and action
  if (
    github.context.eventName == "issues" &&
    github.context.payload.action == "unlabeled"
  ) {
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
              issue_number: issue.number,
            });
            if (octokit_response.status == 204) {
              core.info("Issue unlocked successfully");

              const issue_assignees = issue.assignees ?? [];

              // Create message
              let message = `This issue has been verified and unlocked.\n `;
              if (issue_assignees.data.length > 0) {
                issue_assignees.data.forEach((assignee) => {
                  message += `@${assignee.login} `;
                });
                message += ` can start working on this issue now amd raise PR`;
              } else {
                message += `If anyone is interested in working on this issue, please comment \`/assign\` to get assigned to this issue.`;
              }

              // Add a comment to the issue
              const comment_response = await octokit.rest.issues.createComment({
                owner: github.context.payload.repository.owner.login,
                repo: github.context.payload.repository.name,
                issue_number: issue.number,
                body: message,
              });
              if (comment_response.status == 201) {
                core.info("Commented successfully");
              } else {
                core.error(
                  "Comment adding failed with status code " +
                    comment_response.status.toString()
                );
              }
            } else {
              core.error(
                "Issue unlocking failed with status code " +
                  octokit_response.status.toString()
              );
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


module.exports = act_on_pending_triage_removal;