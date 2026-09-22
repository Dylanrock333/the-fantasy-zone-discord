const { SERVERS } = require("../config/servers");
const { checkInjuries } = require("../utils/fantasyAgentClient");
const { splitMessage } = require("../utils/splitMessage");
const { logger } = require("../utils/logger");

// Injury data is NFL-wide, not league-specific, but the fantasy-bot
// endpoint still needs a league_id for the ownership-% lookup. Every guild
// in SERVERS points at the same leagueId today, so just take the first
// configured one - exported separately so it's a one-line swap to an
// explicit env var later if a second league is ever added.
function getCanonicalLeagueId() {
  return Object.values(SERVERS)[0].leagueId;
}

function formatAlert({ name, pro_team, status, injury_type, news_link }) {
  if (status === "Active") {
    return `✅ **${name}** (${pro_team}) is back to **Active**.`;
  }

  let line = `🚑 **${name}** (${pro_team}) is now **${status}**${injury_type ? ` (${injury_type})` : ""}.`;
  if (news_link) {
    line += `\n${news_link}`;
  }
  return line;
}

// Fetches the injury diff once (unlike weeklyRecap/matchupPreview, which
// fetch per-guild), then fans the same alerts out to every guild's
// configured injury channel.
async function postInjuryAlertsForAllGuilds(client) {
  const alerts = await checkInjuries(getCanonicalLeagueId());

  if (alerts.length === 0) {
    logger.info("No injury updates.");
    return;
  }

  const text = alerts.map(formatAlert).join("\n\n");
  const chunks = splitMessage(text);

  for (const guildId of Object.keys(SERVERS)) {
    const config = SERVERS[guildId];
    if (!config.injuryChannelId) continue;

    try {
      const channel = await client.channels.fetch(config.injuryChannelId);
      for (const chunk of chunks) {
        await channel.send(chunk);
      }
    } catch (err) {
      logger.error(`Injury alert post failed for guild ${guildId}:`, err);
    }
  }
}

module.exports = { getCanonicalLeagueId, formatAlert, postInjuryAlertsForAllGuilds };
