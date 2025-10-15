/**
 * AI-powered table parser using OpenAI
 * Converts natural language descriptions into structured tables
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { TableData } from "./tableUtils";

/**
 * Parse natural language description into a table structure using AI
 */
export async function parseTableFromNaturalLanguage(
  description: string
): Promise<TableData> {
  // Check if OpenAI key is configured
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error("OPENAI_API_KEY not set, using fallback parser");
    return fallbackParser(description);
  }

  const prompt = `You are a table creation assistant. Parse the user's request and generate a structured table.

User's request: "${description}"

Your task:
1. If the user specifies dimensions (like "5 rows and 2 columns" or "3x4 table"), create a table with that many rows and columns using generic headers like "Column 1", "Column 2", etc.
2. Otherwise, identify meaningful column headers from the description
3. Extract any row data mentioned, or create appropriate example rows
4. If no specific rows are mentioned, create 3 empty example rows with placeholder data that matches the context

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "headers": ["Column 1", "Column 2", "Column 3"],
  "rows": [
    ["value1", "value2", "value3"],
    ["value1", "value2", "value3"]
  ]
}

Examples:

Input: "5 rows and 2 columns"
Output: {"headers":["Column 1","Column 2"],"rows":[["",""],["",""],["",""],["",""],["",""]]}

Input: "3x4 table"
Output: {"headers":["Column 1","Column 2","Column 3","Column 4"],"rows":[["","","",""],["","","",""],["","","",""]]}

Input: "project tracker with name, status, owner"
Output: {"headers":["Name","Status","Owner"],"rows":[["Project A","In Progress","John"],["Project B","Not Started","Sarah"],["Project C","Complete","Mike"]]}

Input: "meeting schedule with time, topic, and presenter. Add 9am standup with John, 2pm review with Sarah"
Output: {"headers":["Time","Topic","Presenter"],"rows":[["9am","Standup","John"],["2pm","Review","Sarah"],["TBD","",""]]}

Now parse the user's request above.`;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: prompt,
      temperature: 0.3,
    });

    // Extract JSON from response (in case AI adds markdown)
    let jsonStr = text.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Validate the structure
    if (!parsed.headers || !Array.isArray(parsed.headers)) {
      throw new Error("Invalid headers in AI response");
    }
    if (!parsed.rows || !Array.isArray(parsed.rows)) {
      throw new Error("Invalid rows in AI response");
    }

    return {
      headers: parsed.headers,
      rows: parsed.rows,
    };
  } catch (error) {
    console.error("AI parsing error:", error);

    // Fallback: try to extract basic structure from the description
    return fallbackParser(description);
  }
}

/**
 * Fallback parser for when AI fails
 * Uses simple heuristics to extract table structure
 */
function fallbackParser(description: string): TableData {
  const lowerDesc = description.toLowerCase();

  // Common patterns for column identification
  const columnPatterns = [
    /(?:columns?|fields?|headers?)(?:\s+(?:for|are|like|with|including))?:?\s*([^.]+)/i,
    /with\s+(?:columns?\s+)?([^.]+?)(?:\s+and\s+add|\.|$)/i,
    /(?:tracker|schedule|list).*with\s+([^.]+)/i,
  ];

  let headers: string[] = [];

  // Try to find columns
  for (const pattern of columnPatterns) {
    const match = description.match(pattern);
    if (match) {
      // Split by common separators
      headers = match[1]
        .split(/,|\sand\s|,?\s+and\s+/)
        .map((h) => h.trim())
        .filter((h) => h.length > 0 && h.length < 50) // Filter out very long strings
        .map((h) => {
          // Capitalize first letter
          return h.charAt(0).toUpperCase() + h.slice(1);
        });

      if (headers.length > 0) {
        break;
      }
    }
  }

  // If no headers found, use generic ones
  if (headers.length === 0) {
    headers = ["Column 1", "Column 2", "Column 3"];
  }

  // Try to extract row data from the description
  const rows: string[][] = [];

  // Look for patterns like "Add rows for X (y, z), A (b, c)"
  const rowPattern = /add.*row.*for\s+(.+)/i;
  const rowMatch = description.match(rowPattern);

  if (rowMatch) {
    // Try to parse row data
    const rowData = rowMatch[1];
    const rowMatches = rowData.split(/,(?![^()]*\))/); // Split by comma not inside parentheses

    rowMatches.forEach(rowStr => {
      const parenMatch = rowStr.match(/([^(]+)\(([^)]+)\)/);
      if (parenMatch) {
        const firstValue = parenMatch[1].trim();
        const otherValues = parenMatch[2].split(',').map(v => v.trim());
        rows.push([firstValue, ...otherValues]);
      }
    });
  }

  // If no rows were extracted, create 3 empty rows
  if (rows.length === 0) {
    for (let i = 0; i < 3; i++) {
      rows.push(Array(headers.length).fill(""));
    }
  } else {
    // Normalize row lengths to match headers
    rows.forEach(row => {
      while (row.length < headers.length) {
        row.push("");
      }
      if (row.length > headers.length) {
        row.length = headers.length;
      }
    });
  }

  return { headers, rows };
}

/**
 * Modify an existing table using natural language commands
 */
export async function modifyTableWithAI(
  table: TableData,
  command: string
): Promise<TableData> {
  const prompt = `You are a table editing assistant. Modify the table based on the user's command.

Current table:
Headers: ${JSON.stringify(table.headers)}
Rows: ${JSON.stringify(table.rows)}

User's command: "${command}"

Possible commands:
- "add a column for [name]"
- "add a row for [data]"
- "remove column [name/number]"
- "remove row [number]"
- "rename column [old] to [new]"
- "sort by [column]"

Return ONLY valid JSON with the modified table (no markdown, no explanation):
{
  "headers": [...],
  "rows": [...]
}`;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: prompt,
      temperature: 0.3,
    });

    let jsonStr = text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "");
    }

    const parsed = JSON.parse(jsonStr);

    return {
      headers: parsed.headers,
      rows: parsed.rows,
    };
  } catch (error) {
    console.error("AI modification error:", error);
    // Return original table if modification fails
    return table;
  }
}
