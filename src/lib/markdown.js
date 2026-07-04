// 記事本文（Markdown）→ HTML 変換。
// app/article/[slug] のSSRで使用する。入力はDB上の自作記事のみだが、
// 念のため全テキストをエスケープしてから整形する（XSS防止）。

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+|\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );
}

export function markdownToHtml(md) {
  const lines = String(md || '').split('\n');
  const out = [];
  let inList = false;
  let tableLines = [];

  function flushTable() {
    if (tableLines.length < 2) {
      tableLines.forEach((l) => out.push(`<p>${inlineFormat(l)}</p>`));
      tableLines = [];
      return;
    }
    const parseRow = (line) => line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const headers = parseRow(tableLines[0]);
    const rows = tableLines.slice(2).map(parseRow);
    let html = '<table><thead><tr>';
    headers.forEach((h) => { html += `<th>${inlineFormat(h)}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach((row) => {
      html += '<tr>';
      row.forEach((cell) => { html += `<td>${inlineFormat(cell)}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    out.push(html);
    tableLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\|.+\|$/.test(line.trim())) {
      if (inList) { out.push('</ul>'); inList = false; }
      tableLines.push(line.trim());
      continue;
    }
    if (tableLines.length) flushTable();

    if (/^### /.test(line)) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (/^## /.test(line)) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (/^# /.test(line)) {
      if (inList) { out.push('</ul>'); inList = false; }
      // 記事タイトルはページ側の <h1> が担うため、本文中の # は h2 に落とす
      out.push(`<h2>${escapeHtml(line.slice(2))}</h2>`);
      continue;
    }

    if (/^- /.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<hr>');
      continue;
    }

    if (line.trim() === '') {
      if (inList) { out.push('</ul>'); inList = false; }
      continue;
    }

    if (inList) { out.push('</ul>'); inList = false; }
    out.push(`<p>${inlineFormat(line)}</p>`);
  }

  if (tableLines.length) flushTable();
  if (inList) out.push('</ul>');
  return out.join('\n');
}
