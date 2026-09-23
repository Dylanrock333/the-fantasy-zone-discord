const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require("discord.js");
const { getSession } = require("../../features/tradeCompare/state");

const handler = {
  customId: "tradeCompare:editPrompt",
  async execute(interaction) {
    const session = getSession(interaction.message.id);
    if (!session) {
      await interaction.reply({ content: "This trade panel expired - it'll refresh automatically.", flags: MessageFlags.Ephemeral });
      return;
    }

    const modal = new ModalBuilder().setCustomId("tradeCompare:promptModal").setTitle("Trade Compare Prompt");
    const input = new TextInputBuilder()
      .setCustomId("prompt")
      .setLabel("What should the AI focus on?")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(session.prompt)
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  },
};

module.exports = { handler };
