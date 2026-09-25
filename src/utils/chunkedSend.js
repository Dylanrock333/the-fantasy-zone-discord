// Helpers for fitting long text into Discord's 2000-character message limit.
const { settings } = require("../config");

const DISCORD_LIMIT = settings.limits.discordMessageChars;

// Splits text into <=limit chunks, breaking at the last newline when possible.
function splitMessage(text, limit = DISCORD_LIMIT) {
  const chunks = [];
  let rest = text;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf("\n", limit);
    if (cut <= 0) cut = limit;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  chunks.push(rest);
  return chunks;
}

// Sends text to a channel as one or more chunked messages.
async function sendChunked(channel, text) {
  for (const chunk of splitMessage(text)) {
    await channel.send(chunk);
  }
}

// Fills a deferred interaction reply with the first chunk and sends the rest as follow-ups.
async function replyChunked(interaction, text) {
  const [first, ...rest] = splitMessage(text);
  await interaction.editReply(first);
  for (const chunk of rest) {
    await interaction.followUp(chunk);
  }
}

module.exports = { splitMessage, sendChunked, replyChunked };
