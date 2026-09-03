// Discord has no equivalent of the webapp's client-side ```chart renderer -
// it just prints the fenced JSON as a literal code block. This turns each
// recognized chart shape (fantasy-bot/webapp/static/app.js) into a plain
// monospace table, sent as a .txt file attachment rather than inline -
// Discord's inline code blocks wrap long lines (breaking column alignment,
// worse on mobile than desktop), where a file attachment doesn't.

function padCell(value, width) {
  return String(value).padEnd(width);
}

function renderTable(headers, rows) {
  const widths = headers.map((h, i) =>
    Math.max(String(h).length, ...rows.map((r) => String(r[i]).length))
  );
  const line = (cells) => cells.map((c, i) => padCell(c, widths[i])).join("  ");

  return [line(headers), widths.map((w) => "-".repeat(w)).join("  "), ...rows.map(line)].join(
    "\n"
  );
}

// Categories (players, teams, weeks...) go down the rows and series (the
// handful of stats being tracked) go across as columns - not the reverse.
// Rows are free (the file just gets taller); columns are the scarce
// resource (each one widens every line).
function barTable(data) {
  const seriesList = Array.isArray(data.series) ? data.series : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const headers = [
    "",
    ...seriesList.map((s) => (data.unit ? `${s.name} (${data.unit})` : s.name || "")),
  ];
  const rows = categories.map((cat, i) => [
    String(cat),
    ...seriesList.map((s) => (Array.isArray(s.values) ? s.values[i] : "")),
  ]);
  return { title: data.title, text: renderTable(headers, rows) };
}

function comparisonTable(data) {
  const series = (Array.isArray(data.series) ? data.series : []).map(String);
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const headers = [
    "",
    ...rows.map((r) => (r.unit ? `${r.label} (${r.unit})` : r.label)),
  ];
  const tableRows = series.map((name, seriesIdx) => [
    name,
    ...rows.map((r) => (Array.isArray(r.values) ? r.values[seriesIdx] : "")),
  ]);
  return { title: data.title, text: renderTable(headers, tableRows) };
}

// Pulls every ```chart fenced block out of the reply, turning recognized
// ones into { title, text } tables and leaving anything unrecognized in
// place as a plain code block so nothing silently vanishes.
function extractChartBlocks(text) {
  const fenceRe = /```chart\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let cleaned = "";
  const tables = [];
  let match;

  while ((match = fenceRe.exec(text))) {
    cleaned += text.slice(lastIndex, match.index);
    let data;
    try {
      data = JSON.parse(match[1]);
    } catch (err) {
      data = null;
    }

    if (data && data.type === "bar" && Array.isArray(data.categories)) {
      tables.push(barTable(data));
    } else if (data && data.type === "comparison" && Array.isArray(data.rows)) {
      tables.push(comparisonTable(data));
    } else {
      cleaned += text.slice(match.index, fenceRe.lastIndex);
    }
    lastIndex = fenceRe.lastIndex;
  }

  cleaned += text.slice(lastIndex);
  return { text: cleaned.trim(), tables };
}

module.exports = { extractChartBlocks };
