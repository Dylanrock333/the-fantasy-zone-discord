// Team and player picks for one side ("A" or "B") of the trade panel.
const { updateSession } = require("./state");
const { renderPanel } = require("./panel");
const { getTeamPlayers } = require("../../utils/fantasyBotClient");
const { logger } = require("../../utils/logger");

// Sets team `side`, loading its roster and clearing that side's player picks.
async function pickTeam(interaction, session, side) {
  const otherSide = side === "A" ? "B" : "A";
  const teamId = Number(interaction.values[0]);
  if (session[`team${otherSide}`]?.id === teamId) {
    await interaction.update(renderPanel(session, { error: "Team A and Team B must be different teams." }));
    return;
  }

  try {
    const { id, name, players } = await getTeamPlayers(session.leagueId, teamId);
    updateSession(interaction.message.id, {
      [`team${side}`]: { id, name },
      [`roster${side}`]: players,
      [`selected${side}`]: [],
    });
    await interaction.update(renderPanel(session));
  } catch (err) {
    logger.error(`trade compare: failed to load team ${side} roster:`, err);
    await interaction.update(renderPanel(session, { error: "Could not load that team's roster - try again." }));
  }
}

// Stores the players selected on `side` and redraws the panel.
async function pickPlayers(interaction, session, side) {
  updateSession(interaction.message.id, { [`selected${side}`]: interaction.values.map(Number) });
  await interaction.update(renderPanel(session));
}

module.exports = { pickTeam, pickPlayers };
