// Image helpers for fantasy-bot payloads.
const { AttachmentBuilder } = require("discord.js");

// Decodes a base64 image into a discord.js attachment.
function base64ToAttachment(base64Data, filename) {
  return new AttachmentBuilder(Buffer.from(base64Data, "base64"), { name: filename });
}

module.exports = { base64ToAttachment };
