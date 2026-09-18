const { MessageFlags } = require("discord.js");
const { getSession, updateSession } = require("../../features/tradeCompare/state");
const { renderPanel, DEFAULT_PROMPT } = require("../../features/tradeCompare/panel");

const handler = {
  customId: "tradeCompare:promptModal",
  async execute(interaction) {
    // Populated because this modal is only ever opened from a component on
    // the panel message (tradeCompareEditPrompt.js) - discord.js carries
    // interaction.message through to the resulting modal submit.
    const messageId = interaction.message?.id;
    if (!messageId) {
      await interaction.reply({ content: "Couldn't tell which trade panel this was for - try again.", flags: MessageFlags.Ephemeral });
      return;
    }

    const session = getSession(messageId);
    if (!session) {
      await interaction.reply({ content: "This trade panel expired - it'll refresh automatically.", flags: MessageFlags.Ephemeral });
      return;
    }

    const prompt = interaction.fields.getTextInputValue("prompt").trim();
    updateSession(messageId, { prompt: prompt || DEFAULT_PROMPT });
    await interaction.update(renderPanel(session));
  },
};

module.exports = { handler };
