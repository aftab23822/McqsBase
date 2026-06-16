function flushParagraph(blocks, paragraph) {
  if (paragraph.length) {
    blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
    paragraph.length = 0;
  }
}

function isTableDivider(line) {
  return /^\s*\|?[\s:-]+\|[\s|:-]+\|?\s*$/.test(line);
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

export function parseBlogBody(body = '') {
  const lines = String(body).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  const paragraph = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph(blocks, paragraph);
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph(blocks, paragraph);
      blocks.push({ type: headingMatch[1].length === 2 ? 'heading' : 'subheading', text: headingMatch[2].trim() });
      index += 1;
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph(blocks, paragraph);
      const items = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^[-*]\s+(.+)$/);
        if (!match) break;
        items.push(match[1].trim());
        index += 1;
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph(blocks, paragraph);
      const items = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^\d+\.\s+(.+)$/);
        if (!match) break;
        items.push(match[1].trim());
        index += 1;
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    if (trimmed.includes('|') && lines[index + 1] && isTableDivider(lines[index + 1])) {
      flushParagraph(blocks, paragraph);
      const headers = parseTableRow(trimmed);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim().includes('|')) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    paragraph.push(trimmed);
    index += 1;
  }

  flushParagraph(blocks, paragraph);
  return blocks;
}

export function estimateReadTime(text = '') {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min`;
}
