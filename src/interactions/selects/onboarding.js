// Onboarding team-picker select: links the chosen team's ESPN owner id to this Discord user.
const { handlePickTeam } = require("../../features/onboarding/pick");

const handlers = [{ customId: "onboarding:teamSelect", execute: handlePickTeam }];

module.exports = { handlers };
