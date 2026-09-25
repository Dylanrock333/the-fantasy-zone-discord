// Pulls ```chart JSON blocks out of agent replies so they can be rendered to images via fantasy-bot.
// Only {type: "table", title, columns, rows} is supported, matching fantasy-bot's chart renderer.
const SUPPORTED_TYPES = new Set(["table"]);

// Returns the reply text minus supported chart blocks, plus the parsed charts; bad blocks stay in the text.
function extractChartBlocks(text) {
  const fenceRe = /```chart\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let cleaned = "";
  const charts = [];
  let match;

  while ((match = fenceRe.exec(text))) {
    cleaned += text.slice(lastIndex, match.index);
    let data;
    try {
      data = JSON.parse(match[1]);
    } catch (err) {
      data = null;
    }

    if (data && SUPPORTED_TYPES.has(data.type)) {
      charts.push(data);
    } else {
      cleaned += text.slice(match.index, fenceRe.lastIndex);
    }
    lastIndex = fenceRe.lastIndex;
  }

  cleaned += text.slice(lastIndex);
  return { text: cleaned.trim(), charts };
}

module.exports = { extractChartBlocks };
