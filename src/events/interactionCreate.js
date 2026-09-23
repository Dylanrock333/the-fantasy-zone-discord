// Routes slash commands, buttons, modals and selects to their loaded handlers.
const { Events, MessageFlags } = require("discord.js");
const { logger } = require("../utils/logger");

const name = Events.InteractionCreate;
const once = false;

// Dispatches by interaction type; any handler error gets a generic ephemeral reply.
async function execute(interaction) {
  const client = interaction.client;

  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    } else if (interaction.isButton()) {
      const handler = client.buttons.get(interaction.customId);
      if (!handler) return;
      await handler.execute(interaction);
    } else if (interaction.isModalSubmit()) {
      const handler = client.modals.get(interaction.customId);
      if (!handler) return;
      await handler.execute(interaction);
    } else if (interaction.isAnySelectMenu()) {
      const handler = client.selects.get(interaction.customId);
      if (!handler) return;
      await handler.execute(interaction);
    }
  } catch (err) {
    logger.error("Error handling interaction:", err);
    // Use followUp if the handler already replied/deferred, otherwise a fresh reply.
    if (interaction.isRepliable()) {
      const payload = { content: "Something went wrong.", flags: MessageFlags.Ephemeral };
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      } catch (followUpErr) {
        logger.error("Failed to send error reply:", followUpErr);
      }
    }
  }
}

module.exports = { name, once, execute };
