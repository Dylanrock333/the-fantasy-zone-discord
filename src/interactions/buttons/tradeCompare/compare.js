const { withSession } = require("../../../features/tradeCompare/state");
const { runCompare } = require("../../../features/tradeCompare/compare");

const handler = { customId: "tradeCompare:compare", execute: withSession(runCompare) };

module.exports = { handler };
