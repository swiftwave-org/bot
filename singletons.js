const github = require("@actions/github");
const core = require("@actions/core");

class Issue {
  /**
   * actions_payload : the payload received from the action context
   * details : the details of the issue fetched from the API
   */

  static instance;

  /**
   *  @returns {Issue}
   * */
  static getInstance() {
    if (!Issue.instance) {
      Issue.instance = new Issue();
    }
    return Issue.instance;
  }

  /**
   * @typedef {import('@octokit/core').Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types").Api & { paginate: import("@octokit/plugin-paginate-rest").PaginateInterface; }} octokit
   * @param {octokit} octokit - Octokit instance
   */
  constructor(octokit) {
    this.actions_payload = github.context.payload.issue;
    this.octokit = octokit;
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
