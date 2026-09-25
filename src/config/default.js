// Settings shared by every environment. prod.js / test.js override or add to these.
module.exports = {
  schedules: {
    weeklyRecapCron: "0 0 * * 2", // Tuesday 00:00, after Monday Night Football
    matchupPreviewCron: "0 17 * * 4", // Thursday 17:00 in matchupPreviewTz, before Thursday Night Football
    matchupPreviewTz: "America/Chicago",
  },

  leaderboard: {
    defaultSort: "points",
    defaultSize: 15,
    countOptions: [5, 10, 15, 20, 25],
    cacheTtlMs: 5 * 60 * 1000,
    panelScanLimit: 20, // recent messages checked for an existing panel
  },

  chat: {
    contextMessages: 5, // bot messages sent to the agent as context
    contextSearchLimit: 10, // recent messages fetched to find them
    typingRefreshMs: 8000, // Discord's typing indicator expires after ~10s
  },

  recap: {
    contextScanLimit: 20, // messages scanned for the last recap when building a preview
  },

  panels: {
    tradeHistoryScanLimit: 50, // how far back to look for an existing trade panel after a restart
    selectOptionCap: 25, // Discord's max options per select menu
    panelMarker: "trade-compare-panel", // embed footer used to recognize the panel across restarts
    defaultTradePrompt: "what do you think of this trade, take into consideration the team and pull in player stats",
  },

  limits: {
    discordMessageChars: 2000,
    embedFieldBudget: 1000, // embed field values cap at 1024
    promptMaxLength: 1000,
  },

  guilds: {}, // per-guild IDs live in prod.js / test.js
};
