// Chat bridge trigger: forwards @mentions (or messages in a user's private chat channel) to the chat feature.
const { Events } = require("discord.js");
const { logger } = require("../utils/logger");
const { GUILDS } = require("../config");
const { getChannel } = require("../db");
const { handleMessage } = require("../features/chat/handleMessage");

const name = Events.MessageCreate;
const once = false; // fire on every message

// Ignores bots and off-topic messages, strips the bot @mention, and hands the text to the chat feature.
async function execute(message) {
  if (message.author.bot) return;

  const guildConfig = GUILDS[message.guildId]; // undefined for DMs and unconfigured guilds
  if (!guildConfig) return;

  const privateChatChannel = getChannel(message.guildId, "chat", message.author.id);
  const inPrivateChatChannel = privateChatChannel?.channel_id === message.channelId;
  const mentioned = message.mentions.has(message.client.user);
  if (!inPrivateChatChannel && !mentioned) return;

  const content = mentioned
    ? message.content.replace(`<@${message.client.user.id}>`, "").trim()
    : message.content.trim();
  if (!content) return;

  try {
    await handleMessage(message, guildConfig, content);
  } catch (err) {
    logger.error("fantasy agent error:", err);
    await message.reply("Something went wrong talking to the fantasy agent.");
  }
}

module.exports = { name, once, execute };
