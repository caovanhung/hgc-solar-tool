/**
 * RFC 4180 compliant CSV parser & formatter.
 * Handles quoted fields, embedded commas, double quotes (""), newlines, and UTF-8 BOM.
 */

export function parseCsv(text: string): string[][] {
  let str = text;
  // Strip BOM if present
  if (str.charCodeAt(0) === 0xfeff) {
    str = str.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;
  const len = str.length;

  while (i < len) {
    const char = str[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && str[i + 1] === '"') {
          // Escaped quote: ""
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
      } else if (char === '\r') {
        if (i + 1 < len && str[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
      } else {
        currentCell += char;
        i++;
      }
    }
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  // Filter out any purely empty trailing row
  return rows.filter((r) => r.length > 0 && r.some((cell) => cell.length > 0));
}

export function formatCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function toCsv(rows: any[][]): string {
  const lines = rows.map((r) => r.map(formatCsvCell).join(','));
  return '\ufeff' + lines.join('\r\n');
}
