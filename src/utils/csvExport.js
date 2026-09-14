/**
 * toCsv/downloadCsv - client-side CSV generation for the SaaS Metrics
 * dashboard's per-tab export, same Blob + temporary <a download> technique
 * AdvancedSearch.jsx uses for its server-streamed export.
 */

const escapeCell = (cell) => {
  const value = cell === null || cell === undefined ? '' : String(cell);
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * @param {Array<Object>} rows
 * @param {Array<{key: string, label: string}>} columns
 */
export const toCsv = (rows, columns) => {
  const header = columns.map((col) => escapeCell(col.label)).join(',');
  const body = rows
    .map((row) => columns.map((col) => escapeCell(row[col.key])).join(','))
    .join('\n');
  return `${header}\n${body}`;
};

export const downloadCsv = (filename, csvString) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const todayStamp = () => new Date().toISOString().slice(0, 10);
