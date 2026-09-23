const { getSession, updateSession } = require("../../features/tradeCompare/state");
const { renderPanel, DEFAULT_PROMPT } = require("../../features/tradeCompare/panel");

// "Cancel" resets the standing panel back to a fresh pick, rather than
// clearing it away - the panel is meant to always be there.
const handler = {
  customId: "tradeCompare:cancel",
  async execute(interaction) {
    const session = getSession(interaction.message.id);
    if (!session) {
      await interaction.update({ content: "This trade panel expired - it'll refresh automatically.", embeds: [], components: [] });
      return;
    }

    updateSession(interaction.message.id, {
      teamA: null,
      teamB: null,
      rosterA: null,
      rosterB: null,
      selectedA: [],
      selectedB: [],
      prompt: DEFAULT_PROMPT,
      status: "pickingTeamA",
    });
    await interaction.update(renderPanel(session));
  },
};

module.exports = { handler };
