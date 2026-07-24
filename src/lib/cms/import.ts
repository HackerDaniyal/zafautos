export interface ImportResult<T> {
  success: boolean;
  data?: T[];
  errors: ImportError[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportColumn<T> {
  key: keyof T & string;
  header: string;
  required?: boolean;
  validator?: (value: string) => T[keyof T] | null;
  defaultValue?: T[keyof T];
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current);
        current = '';
      } else if (char === '\r') {
        if (next === '\n') i++;
        row.push(current);
        current = '';
        if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
          rows.push(row);
        }
        row = [];
      } else if (char === '\n') {
        row.push(current);
        current = '';
        if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
          rows.push(row);
        }
        row = [];
      } else {
        current += char;
      }
    }
  }

  if (current !== '' || row.length > 0) {
    row.push(current);
    if (!(row.length === 1 && row[0] === '')) {
      rows.push(row);
    }
  }

  return rows;
}

export function parseJson(text: string): Record<string, unknown>[] {
  const parsed: unknown = JSON.parse(text);

  if (Array.isArray(parsed)) {
    return parsed.filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null && !Array.isArray(item)
    );
  }

  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    return [parsed as Record<string, unknown>];
  }

  return [];
}

export function mapImportData<T>(
  rows: string[][] | Record<string, unknown>[],
  columns: ImportColumn<T>[]
): ImportResult<T> {
  const errors: ImportError[] = [];
  const data: T[] = [];

  if (rows.length === 0) {
    return { success: true, data: [], errors: [], totalRows: 0, validRows: 0, skippedRows: 0 };
  }

  const isCsv = Array.isArray(rows[0]);

  if (isCsv) {
    const csvRows = rows as string[][];
    const headers = csvRows[0] ?? [];
    const dataRows = csvRows.slice(1);

    const headerMap = new Map<string, number>();
    headers.forEach((header, index) => {
      headerMap.set(header.trim().toLowerCase(), index);
    });

    for (const col of columns) {
      if (col.required) {
        const found = headers.some(
          (h) => h.trim().toLowerCase() === col.header.trim().toLowerCase()
        );
        if (!found) {
          errors.push({ row: 0, field: col.key, message: `Missing required column "${col.header}"` });
        }
      }
    }

    for (let i = 0; i < dataRows.length; i++) {
      const csvRow = dataRows[i];
      const rowNum = i + 2;
      let hasError = false;
      const record = {} as Record<string, unknown>;

      for (const col of columns) {
        const headerIndex = headerMap.get(col.header.trim().toLowerCase());
        const rawValue =
          headerIndex !== undefined && csvRow[headerIndex] !== undefined
            ? csvRow[headerIndex].trim()
            : '';

        if (col.required && rawValue === '') {
          errors.push({ row: rowNum, field: col.key, message: `Required field "${col.header}" is empty` });
          hasError = true;
          continue;
        }

        if (rawValue === '' || rawValue === undefined) {
          if (col.defaultValue !== undefined) {
            record[col.key] = col.defaultValue;
          }
          continue;
        }

        if (col.validator) {
          const validated = col.validator(rawValue);
          if (validated === null) {
            errors.push({ row: rowNum, field: col.key, message: `Invalid value "${rawValue}" for "${col.header}"` });
            hasError = true;
            continue;
          }
          record[col.key] = validated;
        } else {
          record[col.key] = rawValue as T[keyof T];
        }
      }

      if (!hasError) {
        data.push(record as T);
      }
    }
  } else {
    const jsonRows = rows as Record<string, unknown>[];

    for (let i = 0; i < jsonRows.length; i++) {
      const jsonRow = jsonRows[i];
      const rowNum = i + 1;
      let hasError = false;
      const record = {} as Record<string, unknown>;

      for (const col of columns) {
        const rawValue = jsonRow[col.header] ?? jsonRow[col.key] ?? '';
        const strValue = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue ?? '').trim();

        if (col.required && strValue === '') {
          errors.push({ row: rowNum, field: col.key, message: `Required field "${col.header}" is empty` });
          hasError = true;
          continue;
        }

        if (strValue === '') {
          if (col.defaultValue !== undefined) {
            record[col.key] = col.defaultValue;
          }
          continue;
        }

        if (col.validator) {
          const validated = col.validator(strValue);
          if (validated === null) {
            errors.push({ row: rowNum, field: col.key, message: `Invalid value "${strValue}" for "${col.header}"` });
            hasError = true;
            continue;
          }
          record[col.key] = validated;
        } else {
          record[col.key] = rawValue as T[keyof T];
        }
      }

      if (!hasError) {
        data.push(record as T);
      }
    }
  }

  const totalRows = isCsv ? (rows as string[][]).length - 1 : (rows as Record<string, unknown>[]).length;
  const skippedRows = errors.filter((e) => e.row > 0).length;
  const validRows = totalRows - skippedRows;

  return {
    success: validRows > 0,
    data: validRows > 0 ? data : undefined,
    errors,
    totalRows,
    validRows,
    skippedRows,
  };
}

export function readImportFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
