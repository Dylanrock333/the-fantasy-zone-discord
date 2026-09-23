// HTTP client for the fantasy-bot API (chat, charts, weekly recap, matchup preview, leaderboard).
const { FANTASY_AGENT_URL = "http://localhost:8787" } = process.env;

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

// Sends a chat message to the agent; sessionId (the channel ID) scopes server-side memory.
async function askFantasyAgent(message, leagueId, sessionId) {
  const res = await fetch(`${FANTASY_AGENT_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message, league_id: leagueId }),
  });

  await throwIfError(res, "fantasy agent");

  const { reply } = await res.json();
  return reply;
}

// Renders one chart object to a PNG buffer via fantasy-bot.
async function renderChartImage(chartData) {
  const res = await fetch(`${FANTASY_AGENT_URL}/api/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chartData),
  });

  if (!res.ok) {
    throw new Error(`chart render request failed: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

// Fetches the weekly recap (summary + power rankings); week=0 means current week.
async function getWeeklyRecap(leagueId, week = 0) {
  const res = await fetch(`${FANTASY_AGENT_URL}/api/weekly-recap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ league_id: leagueId, week }),
  });

  await throwIfError(res, "weekly recap");

  return res.json(); // { week, league_summary, power_rankings: [{rank, team, tag}], power_ranking_image_base64 }
}

// Fetches the matchup preview; week=0 means current week, optional recap text is passed as prior context.
async function getMatchupPreview(leagueId, week = 0, previousRecapContext = null) {
  const body = { league_id: leagueId, week };
  if (previousRecapContext) {
    body.previous_recap_context = previousRecapContext;
  }

  const res = await fetch(`${FANTASY_AGENT_URL}/api/matchup-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await throwIfError(res, "matchup preview");

  return res.json(); // { week, league_preview, matchups: [{team_a, proj_a, record_a, team_b, proj_b, record_b, winner, margin}], matchup_image_base64 }
}

// Fetches the top `size` players at `position` (rostered and free agents), ranked by `sortBy`.
async function getLeaderboard(leagueId, position, size = 15, sortBy = "points") {
  const res = await fetch(`${FANTASY_AGENT_URL}/api/leaderboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ league_id: leagueId, position, size, sort_by: sortBy }),
  });

  await throwIfError(res, "leaderboard");

  return res.json(); // { position, players: [{rank, name, pro_team, total_points, avg_points, projected_total_points, percent_owned, owner_team_name}] }
}

module.exports = { askFantasyAgent, renderChartImage, getWeeklyRecap, getMatchupPreview, getLeaderboard };
