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

module.exports = { askFantasyAgent, renderChartImage, getWeeklyRecap };
