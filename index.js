const core = require('@actions/core');
const github = require('@actions/github');

const act_on_pending_triage_removal = require('./src/act_on_pending_triage_removal');
const act_on_approve_command = require('./src/act_on_approve_command');
const act_on_update_command = require('./src/act_on_update_command');
const slash_assign = require("./src/slash_assign")
const slash_unassign = require("./src/slash_unassign")

const run = async () => {
    const token = core.getInput('token', { required: true });
    const octokit = github.getOctokit(token);

    // Set some global variables
    globalThis.octokit = octokit;

    // List all the triggers here
    await Promise.all([
        act_on_pending_triage_removal(octokit),
        act_on_approve_command(octokit),
        act_on_update_command(octokit),
        slash_assign(octokit),
        slash_unassign(octokit),
    ])
}

// Run the main function
async function main() {
    try {
        await run();
    } catch (error) {
        core.setFailed(error.message);
    }
}

// Run the script
main();