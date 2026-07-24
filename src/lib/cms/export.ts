export type ExportFormat = 'csv' | 'json' | 'xlsx';

export interface ExportColumn<T> {
  key: keyof T & string;
  header: string;
  formatter?: (value: T[keyof T], row: T) => string;
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return value;
}

export function generateCsvContent<T>(data: T[], columns: ExportColumn<T>[]): string {
  const headerRow = columns.map((col) => escapeCsvField(col.header)).join(',');

  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const rawValue = row[col.key];
        const displayValue = col.formatter ? col.formatter(rawValue, row) : String(rawValue ?? '');
        return escapeCsvField(displayValue);
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

export function generateExportFilename(name: string, format: ExportFormat): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const extension = format === 'xlsx' ? 'xlsx' : format;
  return `${name}-${dateStr}.${extension}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const csv = generateCsvContent(data, columns);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function exportToJson<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const exported = data.map((row) => {
    const obj: Record<string, string> = {};
    for (const col of columns) {
      const rawValue = row[col.key];
      obj[col.key] = col.formatter ? col.formatter(rawValue, row) : String(rawValue ?? '');
    }
    return obj;
  });

  const json = JSON.stringify(exported, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(blob, filename);
}
