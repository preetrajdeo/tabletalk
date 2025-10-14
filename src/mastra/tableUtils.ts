/**
 * TableTalk - Utility functions for creating and managing tables in Slack
 */

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface TableMetadata {
  id: string;
  createdBy: string;
  createdAt: string;
  channel: string;
  messageTs: string;
}

/**
 * Format a table as Slack markdown with proper alignment
 */
export function formatTableAsMarkdown(table: TableData): string {
  const { headers, rows } = table;

  if (headers.length === 0) {
    return "_Empty table_";
  }

  // Calculate column widths for alignment
  const columnWidths = headers.map((header, colIndex) => {
    const headerLength = header.length;
    const maxRowLength = Math.max(
      ...rows.map((row) => (row[colIndex] || "").length),
      0
    );
    return Math.max(headerLength, maxRowLength, 3); // Minimum width of 3
  });

  // Helper to pad text
  const pad = (text: string, width: number) => {
    return text + " ".repeat(Math.max(0, width - text.length));
  };

  // Build the markdown table
  let markdown = "```\n";

  // Header row (bold with *)
  const headerRow = headers
    .map((header, i) => pad(`*${header}*`, columnWidths[i] + 2))
    .join(" | ");
  markdown += headerRow + "\n";

  // Separator row
  const separator = columnWidths.map((width) => "-".repeat(width + 2)).join("-|-");
  markdown += separator + "\n";

  // Data rows
  rows.forEach((row) => {
    const rowStr = row
      .map((cell, i) => pad(cell || "", columnWidths[i] + 2))
      .join(" | ");
    markdown += rowStr + "\n";
  });

  markdown += "```";

  return markdown;
}

/**
 * Format a table as plain text (alternative format without code blocks)
 */
export function formatTableAsPlainText(table: TableData): string {
  const { headers, rows } = table;

  if (headers.length === 0) {
    return "_Empty table_";
  }

  let text = "";

  // Header row with bold
  text += "*" + headers.join(" | ") + "*\n";

  // Separator
  text += headers.map(() => "---").join("|") + "\n";

  // Data rows
  rows.forEach((row) => {
    text += row.join(" | ") + "\n";
  });

  return text;
}

/**
 * Parse a simple table format from user input
 * Example: "Name, Status, Owner\nProject A, Active, John\nProject B, Pending, Sarah"
 */
export function parseTableFromText(text: string): TableData {
  const lines = text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(/[,|\t]/).map((h) => h.trim());
  const rows = lines
    .slice(1)
    .map((line) => line.split(/[,|\t]/).map((cell) => cell.trim()));

  return { headers, rows };
}

/**
 * Create a table with specified dimensions
 */
export function createEmptyTable(
  numColumns: number,
  numRows: number,
  headers?: string[]
): TableData {
  const defaultHeaders = headers || Array.from({ length: numColumns }, (_, i) => `Col ${i + 1}`);
  const rows = Array.from({ length: numRows }, () =>
    Array(numColumns).fill("")
  );

  return {
    headers: defaultHeaders,
    rows,
  };
}

/**
 * Add a row to a table
 */
export function addRow(table: TableData, rowData?: string[]): TableData {
  const newRow = rowData || Array(table.headers.length).fill("");
  return {
    ...table,
    rows: [...table.rows, newRow],
  };
}

/**
 * Add a column to a table
 */
export function addColumn(
  table: TableData,
  header: string,
  defaultValue = ""
): TableData {
  return {
    headers: [...table.headers, header],
    rows: table.rows.map((row) => [...row, defaultValue]),
  };
}

/**
 * Remove a row from a table
 */
export function removeRow(table: TableData, rowIndex: number): TableData {
  return {
    ...table,
    rows: table.rows.filter((_, index) => index !== rowIndex),
  };
}

/**
 * Remove a column from a table
 */
export function removeColumn(table: TableData, columnIndex: number): TableData {
  return {
    headers: table.headers.filter((_, index) => index !== columnIndex),
    rows: table.rows.map((row) => row.filter((_, index) => index !== columnIndex)),
  };
}

/**
 * Update a cell value
 */
export function updateCell(
  table: TableData,
  rowIndex: number,
  columnIndex: number,
  value: string
): TableData {
  const newRows = [...table.rows];
  if (newRows[rowIndex]) {
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][columnIndex] = value;
  }
  return {
    ...table,
    rows: newRows,
  };
}

/**
 * Serialize table to JSON string for storage
 */
export function serializeTable(table: TableData): string {
  return JSON.stringify(table);
}

/**
 * Deserialize table from JSON string
 */
export function deserializeTable(json: string): TableData {
  try {
    return JSON.parse(json);
  } catch {
    return { headers: [], rows: [] };
  }
}
