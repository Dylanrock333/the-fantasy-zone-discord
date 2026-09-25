// Trade-compare panel selects: team and player picks for sides A and B.
const { withSession } = require("../../features/tradeCompare/state");
const { pickTeam, pickPlayers } = require("../../features/tradeCompare/pick");

const handlers = ["A", "B"].flatMap((side) => [
  { customId: `tradeCompare:teamSelect${side}`, execute: withSession((i, s) => pickTeam(i, s, side)) },
  { customId: `tradeCompare:playerSelect${side}`, execute: withSession((i, s) => pickPlayers(i, s, side)) },
]);

module.exports = { handlers };
