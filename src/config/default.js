// Settings shared by every environment. prod.js / test.js override or add to these.
module.exports = {
  // When the automated posts run (node-cron syntax).
  schedules: {
    weeklyRecapCron: "0 0 * * 2", // Tuesday 00:00 (server time), after Monday Night Football
    matchupPreviewCron: "0 17 * * 4", // Thursday 17:00 in matchupPreviewTz, before Thursday Night Football
    matchupPreviewTz: "America/Chicago", // timezone for matchupPreviewCron
  },

  // Leaderboard panel and /leaderboard command.
  leaderboard: {
    defaultSort: "points", // a key of SORT_LABELS in features/leaderboard/data.js
    defaultSize: 15, // players shown when no count is picked
    countOptions: [5, 10, 15, 20, 25], // panel count choices; min/max also bound /leaderboard count
    cacheTtlMs: 5 * 60 * 1000, // how long a fetched leaderboard is reused (5 min)
    panelScanLimit: 20, // recent messages checked for an existing panel
  },

  // Chat bridge (features/chat).
  chat: {
    contextMessages: 5, // bot messages sent to the agent as context
    contextSearchLimit: 10, // recent messages fetched to find them
    typingRefreshMs: 8000, // Discord's typing indicator expires after ~10s
  },

  // Weekly recap / matchup preview jobs.
  recap: {
    contextScanLimit: 20, // messages scanned for the last recap when building a preview
  },

  // Trade-compare panel.
  panels: {
    tradeHistoryScanLimit: 50, // how far back to look for an existing trade panel after a restart
    selectOptionCap: 25, // Discord's max options per select menu
    panelMarker: "trade-compare-panel", // embed footer used to recognize the panel across restarts
    // Prompt sent with a trade until someone changes it with Edit Prompt.
    defaultTradePrompt: "what do you think of this trade, take into consideration the team and pull in player stats",
  },

  // Discord and input size limits.
  limits: {
    discordMessageChars: 2000, // max characters per Discord message
    embedFieldBudget: 1000, // embed field values cap at 1024
    promptMaxLength: 1000, // max length of the trade-compare Edit Prompt input
  },

  // Per-guild IDs live in prod.js / test.js, keyed by Discord guild ID:
  //   chatChannelId          - channel where every message goes to the AI (required)
  //   leagueId               - fantasy league ID sent to fantasy-bot (required)
  //   weeklyReportsChannelId - where the Tuesday weekly recap posts
  //   matchupChannelId       - where the Thursday matchup preview posts
  //   leaderboardChannelId   - where the leaderboard panel lives
  //   tradeCompareChannelId  - where the trade-compare panel lives (omit to disable)
  guilds: {},
};
