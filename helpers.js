const core = require("@actions/core");
const github = require("@actions/github");

// This function will verify action has been performed by a member of triage team
function verifyTriageTeam() {
    const triageTeamUsernames = core.getInput("triage-team-usernames").split(",");
    const actor = github.context.actor;
    return triageTeamUsernames.includes(actor);
}

module.exports = { verifyTriageTeam, addLabels };