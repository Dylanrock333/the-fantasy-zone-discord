const { FANTASY_AGENT_URL = "http://localhost:8787" } = process.env;

// FastAPI validation errors put `detail` as a list of {loc, msg} objects
// rather than a string - flatten that into something readable instead of
// letting it stringify as "[object Object]".
function formatErrorDetail(detail) {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  const items = Array.isArray(detail) ? detail : [detail];
  return items.map((d) => (typeof d === "string" ? d : d.loc ? `${d.loc.at(-1)}: ${d.msg}` : d.msg || JSON.stringify(d))).join("; ");
}

// Shared by every fantasy-bot call below: throws a labeled error with
// whatever detail the response body provides once the status isn't ok.
async function throwIfError(res, label) {
  if (res.ok) return;
  let detail = "";
  try {
    detail = formatErrorDetail((await res.json()).detail);
  } catch {
    // response body wasn't JSON - fall through with no detail
  }
  throw new Error(`${label} request failed: ${res.status}${detail ? ` - ${detail}` : ""}`);
}

// sessionId scopes fantasy-bot's server-side conversation memory - the
// Discord channel ID works well since context is already reconstructed
// per-channel from recent messages (see messageCreate.js).
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

// Sends one parsed ```chart JSON object to fantasy-bot's renderer and gets
// a PNG back, ready to attach to a Discord message.
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

// Runs the weekly recap graph for a league and returns one league-wide
// summary plus a power ranking of every team. week=0 means "current week"
// server-side.
async function getWeeklyRecap(leagueId, week = 0) {
  const res = await fetch(`${FANTASY_AGENT_URL}/api/weekly-recap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ league_id: leagueId, week }),
  });

  await throwIfError(res, "weekly recap");

  return res.json(); // { week, league_summary, power_rankings: [{rank, team, tag}], power_ranking_image_base64 }
}

// Runs the matchup preview graph for a league and returns a look-ahead
// league summary plus this week's projected matchups. week=0 means
// "current week" server-side. previousRecapContext (optional) is raw text
// (e.g. last week's recap summary message pulled from Discord) folded into
// the prompt as prior context so the preview can reference it.
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

// Fetches the top `size` fantasy players at `position`, ranked by
// `sortBy` (one of "points", "avg_points", "projected_points",
// "percent_owned"), across the whole player pool (rostered and free
// agents alike).
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
