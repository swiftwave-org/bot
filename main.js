const core = require('@actions/core');
const github = require('@actions/github');

const run = async () => {
}

// Run the script
try {
    run();
} catch (error) {
    core.setFailed(error.message);
}