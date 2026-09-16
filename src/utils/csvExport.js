/**
 * toCsv/downloadCsv - client-side CSV generation for the SaaS Metrics
 * dashboard's per-tab export, same Blob + temporary <a download> technique
 * AdvancedSearch.jsx uses for its server-streamed export.
 */

// Guards against CSV/formula injection: a spreadsheet app treats a cell
// starting with =, +, -, @, tab, or CR as a formula, which lets
// attacker-controlled data (e.g. a Salesforce field) run code when the
// exported file is opened in Excel/Sheets. Prefixing with a single quote
// forces the cell to be read as literal text.
const FORMULA_TRIGGER_CHARS = new Set(['=', '+', '-', '@', '\t', '\r']);

const escapeCell = (cell) => {
  let value = cell === null || cell === undefined ? '' : String(cell);
  if (value.length > 0 && FORMULA_TRIGGER_CHARS.has(value[0])) {
    value = `'${value}`;
  }
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
