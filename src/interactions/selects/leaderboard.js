// Leaderboard panel selects: each stores its pick, redraws the panel, and prefetches results.
const { makeSelectHandler } = require("../../features/leaderboard/selectHandler");

const handlers = [
  makeSelectHandler("leaderboard-position-select", "position"),
  makeSelectHandler("leaderboard-sort-select", "sortBy"),
  makeSelectHandler("leaderboard-count-select", "size", Number),
];

module.exports = { handlers };
