const { withSession, updateSession, emptyPicks } = require("../../../features/tradeCompare/state");
const { renderPanel } = require("../../../features/tradeCompare/panel");

// "Cancel" resets the standing panel back to a fresh pick, rather than
// clearing it away - the panel is meant to always be there.
const handler = {
  customId: "tradeCompare:cancel",
  execute: withSession(async (interaction, session) => {
    updateSession(interaction.message.id, emptyPicks());
    await interaction.update(renderPanel(session));
  }),
};

module.exports = { handler };
