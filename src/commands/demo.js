// /demo: sample message showing the example button, select and modal handlers.
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

const command = {
  data: new SlashCommandBuilder().setName("demo").setDescription("Shows off buttons, selects, and modals"),
  async execute(interaction) {
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("example-button").setLabel("Click me").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("open-modal-button").setLabel("Open modal").setStyle(ButtonStyle.Secondary)
    );

    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("example-select")
        .setPlaceholder("Pick an option")
        .addOptions(
          { label: "Option A", value: "a" },
          { label: "Option B", value: "b" },
          { label: "Option C", value: "c" }
        )
    );

    await interaction.reply({
      content: "Try out a button, a select menu, or open a modal:",
      components: [buttonRow, selectRow],
    });
  },
};

module.exports = { command };
