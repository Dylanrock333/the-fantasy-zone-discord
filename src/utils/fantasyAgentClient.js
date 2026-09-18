const { FANTASY_AGENT_URL = "http://localhost:8787" } = process.env;

async function askFantasyAgent(message, leagueId) {
  const res = await fetch(`${FANTASY_AGENT_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, league_id: leagueId }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).detail || "";
    } catch {
      // response body wasn't JSON - fall through with no detail
    }
    throw new Error(`fantasy agent request failed: ${res.status}${detail ? ` - ${detail}` : ""}`);
  }

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

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).detail || "";
    } catch {
      // response body wasn't JSON - fall through with no detail
    }
    throw new Error(`weekly recap request failed: ${res.status}${detail ? ` - ${detail}` : ""}`);
  }

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

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).detail || "";
    } catch {
      // response body wasn't JSON - fall through with no detail
    }
    throw new Error(`matchup preview request failed: ${res.status}${detail ? ` - ${detail}` : ""}`);
  }

  return res.json(); // { week, league_preview, matchups: [{team_a, proj_a, record_a, team_b, proj_b, record_b, winner, margin}], matchup_image_base64 }
}

module.exports = { askFantasyAgent, renderChartImage, getWeeklyRecap, getMatchupPreview };
