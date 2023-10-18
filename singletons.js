const github = require("@actions/github");
const core = require("@actions/core");

class Issue {
    /**
     * ### Available properties
     * actions_payload : the payload received from the action context
     * details : the details of the issue fetched from the API
     */

    /** @type {Issue} */
    static instance;

    /** @returns {Promise<Issue>} */
    static async getInstance() {
        if (!Issue.instance) {
            Issue.instance = new Issue();
            await Issue.instance.fetchIssueDetails();
        }
        return Issue.instance;
    }

    constructor() {
        this.actions_payload = github.context.payload.issue;
        /**
         * @typedef {import('@octokit/core').Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types").Api & { paginate: import("@octokit/plugin-paginate-rest").PaginateInterface; }} octokit
         * @type {octokit}
         */
        this.octokit = globalThis.octokit;
    }

    async fetchIssueDetails() {
        if (this.fetched_issue_details) {
            return;
        }
        const issue_details_response = await this.octokit.rest.issues.get({
            owner: github.context.payload.repository.owner.login,
            repo: github.context.payload.repository.name,
            issue_number: this.actions_payload.number,
        });
        if (issue_details_response.status == 200) {
            core.info("Issue details fetched successfully");
        } else {
            core.setFailed("Failed to fetch issue details");
        }
        const issue_details = await issue_details_response.data;
        this.details = issue_details;
        this.fetched_issue_details = true;
    }
}

module.exports = { Issue };
