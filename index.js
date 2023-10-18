const core = require('@actions/core');
const github = require('@actions/github');
const {Issue} = require('./singletons');

const act_on_pending_triage_removal = require('./act_on_pending_triage_removal');

const run = async () => {
    const token = core.getInput('token', { required: true });
    const octokit = github.getOctokit(token);

    // Set some global variables
    globalThis.octokit = octokit;

    // List all the triggers here
    await act_on_pending_triage_removal(octokit);
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