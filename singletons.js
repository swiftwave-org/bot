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
        }
        while(Issue.instance.fetching_details) {
            await new Promise(r => setTimeout(r, 100));
        }
        if(!Issue.instance.fetched_issue_details) {
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
        this.fetching_details = true;
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
            return;
        }
        const issue_details = issue_details_response.data;
        this.details = issue_details;
        this.fetched_issue_details = true;
        this.fetching_details = false;
    }
    async addLabels(labels) {
        const octokit_response = await this.octokit.rest.issues.addLabels({
            owner: github.context.payload.repository.owner.login,
            repo: github.context.payload.repository.name,
            issue_number: this.actions_payload.number,
            labels: labels,
        });
        if (octokit_response.status == 200) {
            core.info("Labels added successfully");
        } else {
            core.setFailed("Failed to add labels");
        }
    }

    isPullRequest() {
        return this.details.pull_request != undefined;
    }
}

class IssueComment {
    /**
     * ### Available properties
     * actions_payload : the payload received from the action context
     * details : the details of the issue fetched from the API
     */

    /** @type {IssueComment} */
    static instance;

    /** @returns {Promise<IssueComment>} */
    static async getInstance() {
        if (!IssueComment.instance) {
            IssueComment.instance = new IssueComment();
        }
        while(IssueComment.instance.fetching_details) {
            await new Promise(r => setTimeout(r, 100));
        }
        if(!IssueComment.instance.fetched_comment_details) {
            await IssueComment.instance.fetchDetails();
        }
        return IssueComment.instance;
    }

    constructor() {
        this.actions_payload = github.context.payload.comment;
        /**
         * @typedef {import('@octokit/core').Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types").Api & { paginate: import("@octokit/plugin-paginate-rest").PaginateInterface; }} octokit
         * @type {octokit}
         */
        this.octokit = globalThis.octokit;
    }

    async fetchDetails() {
        this.fetching_details = true;
        if (this.fetched_comment_details) {
            return;
        }
        const comment_details_response = await this.octokit.rest.issues.getComment({
            owner: github.context.payload.repository.owner.login,
            repo: github.context.payload.repository.name,
            comment_id: this.actions_payload.id,
        });
        if (comment_details_response.status == 200) {
            core.info("Comment details fetched successfully");
        } else {
            core.setFailed("Failed to fetch comment details");
            return;
        }
        const comment_details = comment_details_response.data;
        this.details = comment_details;
        this.fetched_comment_details = true;
        this.fetching_details = false;
    }
}

module.exports = { Issue, IssueComment };
