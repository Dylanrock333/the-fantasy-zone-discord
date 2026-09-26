// Trade-compare Edit Prompt button: opens a modal prefilled with the panel's current prompt.
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { settings } = require("../../../config");
const { withSession } = require("../../../features/tradeCompare/state");

const handler = {
  customId: "tradeCompare:editPrompt",
  execute: withSession(async (interaction, session) => {
    const modal = new ModalBuilder().setCustomId("tradeCompare:promptModal").setTitle("Trade Compare Prompt");
    const input = new TextInputBuilder()
      .setCustomId("prompt")
      .setLabel("What should the AI focus on?")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(session.prompt)
      .setRequired(true)
      .setMaxLength(settings.limits.promptMaxLength);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  }, { ephemeral: true }), // a modal can't update the panel, so an expired panel gets a private reply
};

module.exports = { handler };
