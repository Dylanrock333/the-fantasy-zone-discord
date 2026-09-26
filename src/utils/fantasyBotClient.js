// HTTP client for the fantasy-bot API (chat, charts, weekly recap, matchup preview, leaderboard).
const { env } = require("../config");
// Base URL of the fantasy-bot API (FANTASY_AGENT_URL env var, localhost by default).
const FANTASY_AGENT_URL = env.FANTASY_AGENT_URL;

// Flattens FastAPI error `detail` (string or list of {loc, msg}) into readable text.
function formatErrorDetail(detail) {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  const items = Array.isArray(detail) ? detail : [detail];
  return items.map((d) => (typeof d === "string" ? d : d.loc ? `${d.loc.at(-1)}: ${d.msg}` : d.msg || JSON.stringify(d))).join("; ");
}

// Throws a labeled error (with the response's detail, if any) for non-OK responses.
async function throwIfError(res, label) {
  if (res.ok) return;
  let detail = "";
  try {
    detail = formatErrorDetail((await res.json()).detail);
  } catch {
    // non-JSON body: no detail
  }
  throw new Error(`${label} request failed: ${res.status}${detail ? ` - ${detail}` : ""}`);
}

// Calls the API (POST with a JSON body, or GET when body is omitted); throws a labeled error on failure.
async function request(path, label, body) {
  const res = await fetch(
    `${FANTASY_AGENT_URL}${path}`,
    body === undefined
      ? undefined
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  await throwIfError(res, label);
  return res;
}

// Same as request, but returns the parsed JSON body.
const requestJson = async (...args) => (await request(...args)).json();

// Sends a chat message to the agent; sessionId (the channel ID) scopes server-side memory.
async function sendChat(message, leagueId, sessionId) {
  const { reply } = await requestJson("/api/chat", "fantasy agent", { session_id: sessionId, message, league_id: leagueId });
  return reply;
}

// Renders one chart object to a PNG buffer via fantasy-bot.
async function renderChartImage(chartData) {
  const res = await request("/api/chart", "chart render", chartData);
  return Buffer.from(await res.arrayBuffer());
}

// Fetches the weekly recap (summary + power rankings); week=0 means current week.
// Returns { week, league_summary, power_rankings: [{rank, team, tag}], power_ranking_image_base64 }.
function getWeeklyRecap(leagueId, week = 0) {
  return requestJson("/api/weekly-recap", "weekly recap", { league_id: leagueId, week });
}

// Fetches the matchup preview; week=0 means current week, optional recap text is passed as prior context.
// Returns { week, league_preview, matchups: [{team_a, proj_a, record_a, team_b, proj_b, record_b, winner, margin}], matchup_image_base64 }.
function getMatchupPreview(leagueId, week = 0, previousRecapContext = null) {
  const body = { league_id: leagueId, week };
  if (previousRecapContext) body.previous_recap_context = previousRecapContext;
  return requestJson("/api/matchup-preview", "matchup preview", body);
}

// Fetches the top `size` players at `position` (rostered and free agents), ranked by `sortBy`.
// Returns { position, players: [{rank, name, pro_team, total_points, avg_points, projected_total_points, percent_owned, owner_team_name}] }.
function getLeaderboard(leagueId, position, size = 15, sortBy = "points") {
  return requestJson("/api/leaderboard", "leaderboard", { league_id: leagueId, position, size, sort_by: sortBy });
}

// Lists a league's teams for the trade-compare team selects. Returns { teams: [{ id, name }] }.
function getLeagueTeams(leagueId) {
  return requestJson(`/api/league/${leagueId}/teams`, "league teams");
}

// Lists a team's roster for the trade-compare player selects. Returns { id, name, players: [{ id, name, position, proTeam }] }.
function getTeamPlayers(leagueId, teamId) {
  return requestJson(`/api/league/${leagueId}/teams/${teamId}/players`, "team players");
}

module.exports = {
  sendChat,
  renderChartImage,
  getWeeklyRecap,
  getMatchupPreview,
  getLeaderboard,
  getLeagueTeams,
  getTeamPlayers,
};
