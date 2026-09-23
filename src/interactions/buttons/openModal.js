// Demo button that opens the example modal.
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

const handler = {
  customId: "open-modal-button",
  async execute(interaction) {
    const modal = new ModalBuilder().setCustomId("example-modal").setTitle("Example Modal");

    const input = new TextInputBuilder()
      .setCustomId("example-input")
      .setLabel("Say something")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    await interaction.showModal(modal);
  },
};

module.exports = { handler };
