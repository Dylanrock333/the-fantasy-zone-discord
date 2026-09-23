// Loads commands, events and interaction handlers from their src/ folders at startup.
const { readdirSync } = require("node:fs");
const path = require("node:path");
const { Collection } = require("discord.js");
const { logger } = require("./logger");

function jsFiles(dir) {
  return readdirSync(dir).filter((f) => f.endsWith(".js"));
}

// Registers each command file on client.commands by name.
async function loadCommands(client) {
  const dir = path.join(__dirname, "..", "commands");
  for (const file of jsFiles(dir)) {
    const { command } = require(path.join(dir, file));
    if (command?.data?.name) {
      client.commands.set(command.data.name, command);
    } else {
      logger.warn(`Skipping malformed command file: ${file}`);
    }
  }
}

// Binds each event file to the client (once or on).
async function loadEvents(client) {
  const dir = path.join(__dirname, "..", "events");
  for (const file of jsFiles(dir)) {
    const event = require(path.join(dir, file));
    if (!event.name || !event.execute) {
      logger.warn(`Skipping malformed event file: ${file}`);
      continue;
    }
    if (event.once) {
      client.once(event.name, event.execute);
    } else {
      client.on(event.name, event.execute);
    }
  }
}

// Collects button/modal/select handlers from interactions/<subdir>, keyed by customId.
function loadInteractionHandlers(subdir) {
  const collection = new Collection();
  const dir = path.join(__dirname, "..", "interactions", subdir);
  for (const file of jsFiles(dir)) {
    const { handler } = require(path.join(dir, file));
    if (handler?.customId) {
      collection.set(handler.customId, handler);
    } else {
      logger.warn(`Skipping malformed ${subdir} handler file: ${file}`);
    }
  }
  return collection;
}

const loadButtonHandlers = () => loadInteractionHandlers("buttons");
const loadModalHandlers = () => loadInteractionHandlers("modals");
const loadSelectHandlers = () => loadInteractionHandlers("selects");

module.exports = {
  loadCommands,
  loadEvents,
  loadButtonHandlers,
  loadModalHandlers,
  loadSelectHandlers,
};
