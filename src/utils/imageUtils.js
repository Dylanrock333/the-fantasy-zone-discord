const { AttachmentBuilder } = require("discord.js");

// Decodes a base64 image string (e.g. fantasy-bot's power_ranking_image_base64)
// into a discord.js attachment ready to send. Generic - not tied to any one
// command/job, any base64 image payload from fantasy-bot can use this.
function base64ToAttachment(base64Data, filename) {
  return new AttachmentBuilder(Buffer.from(base64Data, "base64"), { name: filename });
}

module.exports = { base64ToAttachment };
