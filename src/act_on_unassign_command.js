const core = require("@actions/core");
const github = require("@actions/github");
const { Issue, IssueComment } = require("./singletons")
const { verifyTriageTeam } = require("./helpers")

/**
 * This function will be only run if
 * - Event is `issue_comment` and action is `created`
 * - The messgae is `/assign`
 * - The issue is not closed
 *
 * This function will:
 * - `/unassign @user1` : Can only be used by core-members of the organization. Unassigns user1 from the issue.   
 * - `/unassign` : Unassign the commenter from the issue.
 * 
 *
 * @export
 * @typedef {import('@octokit/core').Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types").Api & { paginate: import("@octokit/plugin-paginate-rest").PaginateInterface; }} octokit
 * @param {octokit} octokit - Octokit instance
 * @returns {Promise<void>}
 */

async function act_on_assign_command( octokit ) {

    const issue = await Issue.getInstance();
    if (issue.actions_payload.state == "closed") {
        core.info("Issue is closed, no action needed");
        return;
    }
    if (github.context.eventName === "issue_comment" && github.context.payload.action === "created") {
        const issue_comment = await IssueComment.getInstance();
        const issue_comment_body = (issue_comment.details.body ?? "").trim();
        if(issue_comment_body.startsWith("/unassign")) {

            if(issue_comment_body === "/unassign") {
                // self-unassign --done
                try {
                    const res = await octokit.rest.issues.removeAssignees({
                        owner: github.context.payload.repository.owner.login,
                        repo: github.context.payload.repository.name,
                        issue_number: issue.actions_payload.number,
                        assignees: [github.context.actor]
                    });

                    let comment_reaction = "+1";                    
                    if(res.status === 200) {
                        core.info(`${github.context.actor} unassigned(self) from the issue`);
                    } else {
                        comment_reaction = "-1";
                        core.error(`Failed to unassign(self) ${github.context.actor} from the issue`);
                    } 
                    
                    // reaction to the comment
                    await octokit.rest.reactions.createForIssueComment({
                        owner: github.context.payload.repository.owner.login,
                        repo: github.context.payload.repository.name,
                        comment_id: issue_comment.actions_payload.id,
                        content: comment_reaction
                    });                                   
                } catch (error) {
                    core.error(error.message);
                }
                return;
            }
            if(verifyTriageTeam()) {
                // unassign to other contributors
                let assignees_to_remove = issue_comment_body.substring(9).split("@").map(e => e.trim())
                assignees_to_remove.shift()

                try {
                    const res = await octokit.rest.issues.removeAssignees({
                        owner: github.context.payload.repository.owner.login,
                        repo: github.context.payload.repository.name,
                        issue_number: issue.actions_payload.number,
                        assignees: assignees_to_remove
                    });

                    let comment_reaction = "+1"; 
                    const removed_assignees = (assignees_to_remove).filter(ele => !(res.details.assignees).includes(ele));                                       
                    if(res.status === 200) {
                        core.info(`${removed_assignees.join(",")} unassigned from the issue`);
                    } else {
                        comment_reaction = "-1";
                        core.error(`Failed to unassign ${assignees_to_remove.join(",")} from the issue`);
                    } 
                    
                    
                    // reaction to the comment
                    await octokit.rest.reactions.createForIssueComment({
                        owner: github.context.payload.repository.owner.login,
                        repo: github.context.payload.repository.name,
                        comment_id: issue_comment.actions_payload.id,
                        content: comment_reaction
                    });
                } catch (error) {
                    core.error(error.message);
                }
            }    
        }
    }
}

module.exports = act_on_assign_command;