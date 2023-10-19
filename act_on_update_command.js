const core = require("@actions/core");
const github = require("@actions/github");
const { Issue, IssueComment } = require("./singletons");

/**
 * This function will be only run if
 * - It's a PR
 * - The PR is still open/draft
 * - Event is `issue_comment` and action is `created`
 * - The comment is `/update`
 * 
 * This function will:
 * - Update the PR with the latest changes from the base branch
 * - Give a thumbs up to the comment
 * @export
 * @typedef {import('@octokit/core').Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types").Api & { paginate: import("@octokit/plugin-paginate-rest").PaginateInterface; }} octokit
 * @param {octokit} octokit - Octokit instance
 * @returns {Promise<void>}
 **/
async function act_on_update_command(octokit) {
    const issue = await Issue.getInstance();
    if (issue.isPullRequest() === false) {
        return;
    }
    if (issue.details.state == "closed") {
        core.info("PR is closed, no action needed");
        return;
    }
    // Check event name and action
    if (github.context.eventName === "issue_comment" && github.context.payload.action === "created") {
        // Fetch comment
        const issue_comment = await IssueComment.getInstance();
        if ((issue_comment.details.body ?? "").trim() === "/update") {
            core.info("Updating PR");
            try {
                const octokit_response = await octokit.rest.pulls.updateBranch({
                    owner: github.context.payload.repository.owner.login,
                    repo: github.context.payload.repository.name,
                    pull_number: issue.actions_payload.number,
                });
                if (octokit_response.status == 200) {
                    core.info("PR updated successfully");
                } else {
                    core.setFailed("Failed to update PR");
                }
            } catch (error) {
                core.setFailed("Failed to update PR");
                core.error(error);
                return
            }
            // Add a thumbs up to the comment
            try {
                const octokit_response = await octokit.rest.reactions.createForIssueComment({
                    owner: github.context.payload.repository.owner.login,
                    repo: github.context.payload.repository.name,
                    comment_id: issue_comment.actions_payload.id,
                    content: "THUMBS_UP",
                });
                if (octokit_response.status == 200) {
                    core.info("Thumbs up added successfully");
                } else {
                    core.setFailed("Failed to add thumbs up");
                }
            } catch (error) {
                core.setFailed("Failed to add thumbs up");
                core.error(error);
            }
        }
    }
}

module.exports = act_on_update_command