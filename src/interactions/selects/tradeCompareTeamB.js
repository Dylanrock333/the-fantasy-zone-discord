const { getSession, updateSession } = require("../../features/tradeCompare/state");
const { renderPanel } = require("../../features/tradeCompare/panel");
const { getTeamPlayers } = require("../../utils/fantasyAgentClient");
const { logger } = require("../../utils/logger");

const handler = {
  customId: "tradeCompare:teamSelectB",
  async execute(interaction) {
    const session = getSession(interaction.message.id);
    if (!session) {
      await interaction.update({ content: "This trade panel expired - it'll refresh automatically.", embeds: [], components: [] });
      return;
    }

    const teamId = Number(interaction.values[0]);
    if (session.teamA?.id === teamId) {
      await interaction.update(renderPanel(session, { error: "Team A and Team B must be different teams." }));
      return;
    }

    try {
      const { id, name, players } = await getTeamPlayers(session.leagueId, teamId);
      updateSession(interaction.message.id, { teamB: { id, name }, rosterB: players, selectedB: [] });
      await interaction.update(renderPanel(session));
    } catch (err) {
      logger.error("trade compare: failed to load team B roster:", err);
      await interaction.update(renderPanel(session, { error: "Could not load that team's roster - try again." }));
    }
  },
};

module.exports = { handler };
