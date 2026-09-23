const { getSession, updateSession } = require("../../features/tradeCompare/state");
const { renderPanel } = require("../../features/tradeCompare/panel");

const handler = {
  customId: "tradeCompare:playerSelectB",
  async execute(interaction) {
    const session = getSession(interaction.message.id);
    if (!session) {
      await interaction.update({ content: "This trade panel expired - it'll refresh automatically.", embeds: [], components: [] });
      return;
    }

    updateSession(interaction.message.id, { selectedB: interaction.values.map(Number) });
    await interaction.update(renderPanel(session));
  },
};

module.exports = { handler };
