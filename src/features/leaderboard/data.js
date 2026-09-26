// Leaderboard data: labels, fetch with 5-min response cache, and text formatting.
const { getGuildConfig, settings } = require("../../config");
const { getLeaderboard } = require("../../utils/fantasyBotClient");

// Position code fantasy-bot expects -> label shown in Discord.
const POSITION_LABELS = { QB: "QB", RB: "RB", WR: "WR", TE: "TE", K: "K", "D/ST": "DEF" };
// Add entries here to grow the "Ranked by" list (channel menu + /leaderboard command both read this).
const SORT_LABELS = {
  points: "Total Points",
  avg_points: "Avg Points/Game",
  projected_points: "Projected Points",
  percent_owned: "Ownership %",
};
// How each ranking's value is displayed on a leaderboard line.
const STAT_FORMATTERS = {
  points: (p) => `${p.total_points.toFixed(1)} pts`,
  avg_points: (p) => `${p.avg_points.toFixed(1)} pts/gm`,
  projected_points: (p) => `${p.projected_total_points.toFixed(1)} proj pts`,
  percent_owned: (p) => (p.percent_owned < 0 ? "ownership unknown" : `${p.percent_owned.toFixed(0)}% owned`),
};
// Leaderboard settings from config/default.js.
const {
  defaultSort: DEFAULT_SORT,
  defaultSize: DEFAULT_SIZE,
  countOptions: COUNT_OPTIONS,
  maxSize: MAX_SIZE,
  cacheTtlMs: CACHE_TTL_MS,
} = settings.leaderboard;

// 5-min cache of leaderboard responses keyed by league/position/sort; always fetches MAX_SIZE and slices.
// Stores the promise so a Search during an in-flight prefetch reuses the same request.
const playersCache = new Map();

// Returns cached players for this query, or starts a fetch (evicted on failure).
function fetchPlayers(leagueId, position, sortBy) {
  const key = `${leagueId}:${position}:${sortBy}`;
  const cached = playersCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.promise;

  const promise = getLeaderboard(leagueId, position, MAX_SIZE, sortBy).then((res) => res.players);
  promise.catch(() => playersCache.delete(key));
  playersCache.set(key, { promise, at: Date.now() });
  return promise;
}

// Warms the cache when a select changes so Search is usually instant.
function prefetchLeaderboard(guildId, { position, sortBy } = {}) {
  if (!position) return;
  // Best-effort: any real error surfaces when Search is pressed.
  try {
    fetchPlayers(getGuildConfig(guildId).leagueId, position, sortBy || DEFAULT_SORT).catch(() => {});
  } catch {}
}

// Fetches and formats the top players at `position`, ranked by `sortBy`.
async function getLeaderboardText(guildId, position, sortBy = DEFAULT_SORT, size = DEFAULT_SIZE) {
  const config = getGuildConfig(guildId);
  const players = (await fetchPlayers(config.leagueId, position, sortBy)).slice(0, size);

  const format = STAT_FORMATTERS[sortBy] || STAT_FORMATTERS[DEFAULT_SORT];
  const lines = players.map((p) => `**${p.rank}\\. ${p.name}** (${p.pro_team})\n${format(p)} — ${p.owner_team_name || "Free Agent"}`);
  const text = `**${POSITION_LABELS[position] || position} Leaderboard — Ranked by ${SORT_LABELS[sortBy] || sortBy} (Top ${players.length})**\n${lines.join("\n")}`;

  return { text, count: players.length };
}

module.exports = {
  getLeaderboardText,
  prefetchLeaderboard,
  POSITION_LABELS,
  SORT_LABELS,
  COUNT_OPTIONS,
  DEFAULT_SORT,
  DEFAULT_SIZE,
};
