// Discord has no equivalent of the webapp's client-side ```chart renderer -
// this pulls each ```chart fenced JSON block out of the reply so the caller
// can render it to a real image via fantasy-bot's POST /api/chart and
// attach it, instead of dumping the raw JSON. Unrecognized or unparseable
// blocks are left in the text untouched so nothing silently vanishes.
//
// Shapes match fantasy_agent/graph.py's _personality_system prompt and
// fantasy_agent/chart_render.py's renderer: "bar" (categories + series) and
// "comparison" (rows of differently-scaled metrics).
const SUPPORTED_TYPES = new Set(["bar", "comparison"]);

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
