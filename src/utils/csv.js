// CSV export helpers

// Escape a single value per RFC 4180: wrap in quotes if it contains
// a comma, quote, or newline, and double any embedded quotes.
function escapeCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build a CSV string from an array of row objects.
 * `columns` is an array of { key, label } describing the output columns.
 */
export function toCSV(rows, columns) {
  const header = columns.map(c => escapeCell(c.label)).join(',');
  const body = rows
    .map(row => columns.map(c => escapeCell(row[c.key])).join(','))
    .join('\r\n');
  return body ? `${header}\r\n${body}` : header;
}

/**
 * Trigger a browser download of `content` as `filename`.
 * Prepends a UTF-8 BOM so Excel reads non-ASCII characters correctly.
 */
export function downloadCSV(filename, content) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Convenience: stamp a filename with today's date, e.g. vehicles_2026-05-31.csv
export function datedFilename(base) {
  const date = new Date().toISOString().split('T')[0];
  return `${base}_${date}.csv`;
}
