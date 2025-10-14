/**
 * Slack slash command handlers for TableTalk
 */

import { WebClient } from "@slack/web-api";
import {
  formatTableAsMarkdown,
  createEmptyTable,
  parseTableFromText,
  type TableData,
} from "./tableUtils";
import { parseTableFromNaturalLanguage } from "./aiTableParser";

/**
 * Handle /table slash command
 */
export async function handleTableCommand(
  payload: any,
  slack: WebClient
): Promise<void> {
  const { trigger_id, text, user_id, channel_id, response_url } = payload;

  console.log("[TableCommand] Received:", { text, user_id, channel_id, response_url });

  // If user provided text, use AI to parse it
  if (text && text.trim()) {
    console.log("[TableCommand] Processing with AI:", text);

    // Process AI parsing asynchronously (don't await to avoid timeout)
    processTableWithAI(slack, channel_id, text, user_id, response_url).catch((error) => {
      console.error("AI table creation failed:", error);
    });

    // Return immediately to avoid Slack timeout
    return;
  }

  // Otherwise, open the modal for interactive input
  console.log("[TableCommand] Opening modal");
  await openTableModal(slack, trigger_id, null);
}

/**
 * Process table creation with AI asynchronously
 */
async function processTableWithAI(
  slack: WebClient,
  channelId: string,
  description: string,
  userId: string,
  responseUrl?: string
): Promise<void> {
  console.log("[AI Process] Starting for channel:", channelId);

  try {
    // Use AI to parse the natural language description
    console.log("[AI Process] Calling AI parser...");
    const parsedTable = await parseTableFromNaturalLanguage(description);
    console.log("[AI Process] AI parsing complete:", parsedTable);

    // Format the table
    const markdown = formatTableAsMarkdown(parsedTable);

    // Use response_url to post back to Slack (works in all channel types)
    if (responseUrl) {
      console.log("[AI Process] Using response_url to post table");
      const response = await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "in_channel",
          text: "Table created",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: markdown,
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "✏️ Edit",
                  },
                  action_id: "edit_table",
                  value: JSON.stringify({ table: parsedTable, userId, channelId }),
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "➕ Add Row",
                  },
                  action_id: "add_row",
                  value: JSON.stringify({ table: parsedTable, userId, channelId }),
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "➕ Add Column",
                  },
                  action_id: "add_column",
                  value: JSON.stringify({ table: parsedTable, userId, channelId }),
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Response URL failed: ${response.status}`);
      }
      console.log("[AI Process] Table posted successfully via response_url");
    } else {
      // Fallback to direct posting
      console.log("[AI Process] Posting table directly to channel");
      await postTable(slack, channelId, parsedTable, userId);
      console.log("[AI Process] Table posted successfully");
    }
  } catch (error) {
    console.error("[AI Process] Error:", error);

    // Try to post error via response_url
    if (responseUrl) {
      await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "❌ Sorry, I couldn't create that table. Please try `/table` to use the manual form.",
        }),
      });
    }
  }
}

/**
 * Create the table modal view structure
 */
function createTableModalView(existingTable: TableData | null, isEdit: boolean): any {
  // Pre-populate with existing data or defaults
  const table = existingTable || createEmptyTable(3, 3);

  const columnEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: isEdit
          ? "✏️ *Edit your table*"
          : "✨ *Create a new table*",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `📋 *Headers* (${table.headers.length} columns)`,
      },
    },
  ];

  // Add input fields for each column header in a more visual way
  table.headers.forEach((header, colIndex) => {
    blocks.push({
      type: "input",
      block_id: `header_${colIndex}`,
      label: {
        type: "plain_text",
        text: `${columnEmojis[colIndex] || "▪️"} Column ${colIndex + 1}`,
      },
      element: {
        type: "plain_text_input",
        action_id: `header_input_${colIndex}`,
        placeholder: {
          type: "plain_text",
          text: `e.g., ${colIndex === 0 ? "Name" : colIndex === 1 ? "Status" : "Owner"}`,
        },
        initial_value: header || "",
      },
    });
  });

  blocks.push({
    type: "divider",
  });

  // Add input fields for each row with grid-like visual structure
  table.rows.forEach((row, rowIndex) => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `📝 *Row ${rowIndex + 1}*`,
      },
    });

    row.forEach((cell, colIndex) => {
      const columnLabel = table.headers[colIndex] || `Column ${colIndex + 1}`;
      blocks.push({
        type: "input",
        block_id: `row_${rowIndex}_col_${colIndex}`,
        label: {
          type: "plain_text",
          text: `${columnEmojis[colIndex] || "▪️"} ${columnLabel}`,
        },
        element: {
          type: "plain_text_input",
          action_id: `cell_input_${rowIndex}_${colIndex}`,
          placeholder: {
            type: "plain_text",
            text: `Row ${rowIndex + 1}, Col ${colIndex + 1}`,
          },
          initial_value: cell || "",
        },
        optional: true,
      });
    });

    // Add a subtle divider between rows
    if (rowIndex < table.rows.length - 1) {
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "━━━━━━━━━━━━━━━━━━━━━━",
          },
        ],
      });
    }
  });

  return {
    type: "modal",
    callback_id: isEdit ? "table_edit_modal" : "table_create_modal",
    title: {
      type: "plain_text",
      text: isEdit ? "Edit Table" : "Create Table",
    },
    submit: {
      type: "plain_text",
      text: isEdit ? "Update" : "Create",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: blocks,
  };
}

/**
 * Open the table creation/edit modal
 */
export async function openTableModal(
  slack: WebClient,
  triggerId: string,
  existingTable: TableData | null
): Promise<void> {
  const isEdit = existingTable !== null;

  await slack.views.open({
    trigger_id: triggerId,
    view: createTableModalView(existingTable, isEdit) as any,
  });
}

/**
 * Handle modal submission
 */
export async function handleModalSubmission(
  payload: any,
  slack: WebClient
): Promise<void> {
  const { user, view } = payload;
  const values = view.state.values;
  const callbackId = view.callback_id;

  // Handle AI edit modal
  if (callbackId === "ai_edit_modal") {
    const metadata = JSON.parse(view.private_metadata);
    const editDescription = values.edit_description?.edit_input?.value || "";

    console.log("[Modal Submission] AI Edit metadata:", metadata);

    if (!editDescription.trim()) {
      return;
    }

    // Process AI edit asynchronously
    processAIEdit(
      slack,
      metadata.channelId,
      metadata.table,
      editDescription,
      metadata.userId,
      payload.response_urls?.[0]?.response_url,
      metadata.messageTs
    ).catch(
      (error) => console.error("AI edit failed:", error)
    );

    return;
  }

  // Handle manual table creation/edit modal
  // Extract headers from individual input fields
  const headers: string[] = [];
  let colIndex = 0;
  while (values[`header_${colIndex}`]) {
    const headerValue = values[`header_${colIndex}`][`header_input_${colIndex}`]?.value || "";
    if (headerValue.trim()) {
      headers.push(headerValue.trim());
    }
    colIndex++;
  }

  // If no headers were provided, use defaults
  if (headers.length === 0) {
    headers.push("Column 1", "Column 2", "Column 3");
  }

  // Extract rows from individual input fields
  const rows: string[][] = [];
  let rowIndex = 0;
  while (true) {
    const row: string[] = [];
    let hasAnyValue = false;

    for (let col = 0; col < headers.length; col++) {
      const blockId = `row_${rowIndex}_col_${col}`;
      const actionId = `cell_input_${rowIndex}_${col}`;
      const cellValue = values[blockId]?.[actionId]?.value || "";

      row.push(cellValue.trim());
      if (cellValue.trim()) {
        hasAnyValue = true;
      }
    }

    // Stop if this row doesn't exist in the form
    if (!values[`row_${rowIndex}_col_0`]) {
      break;
    }

    // Only add rows that have at least one value
    if (hasAnyValue) {
      rows.push(row);
    }

    rowIndex++;
  }

  const table: TableData = { headers, rows };

  // Get channel from metadata if available, otherwise use user's DM
  const channelId = view.private_metadata || user.id;

  // Post the table
  await postTable(slack, channelId, table, user.id);
}

/**
 * Process AI-powered table editing
 */
async function processAIEdit(
  slack: WebClient,
  channelId: string,
  originalTable: TableData,
  command: string,
  userId: string,
  responseUrl?: string,
  messageTs?: string
): Promise<void> {
  try {
    console.log("[AI Edit] Starting modification...", { channelId, responseUrl, messageTs });

    // Use AI to modify the table
    const { modifyTableWithAI } = await import("./aiTableParser");
    const modifiedTable = await modifyTableWithAI(originalTable, command);

    console.log("[AI Edit] Modification complete");

    // Format the table
    const markdown = formatTableAsMarkdown(modifiedTable);

    // Post edited table as an ephemeral message (only visible to user) with option to post to channel
    if (channelId && userId) {
      console.log("[AI Edit] Posting ephemeral preview to user");
      await slack.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: "✅ Table updated (preview)",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `✅ *Table updated* (preview - only you can see this):\n\n${markdown}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "📤 Post to Channel",
                },
                action_id: "post_to_channel",
                value: JSON.stringify({ table: modifiedTable, userId, channelId }),
                style: "primary",
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "✏️ Edit More",
                },
                action_id: "edit_table",
                value: JSON.stringify({ table: modifiedTable, userId, channelId }),
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "➕ Add Row",
                },
                action_id: "add_row",
                value: JSON.stringify({ table: modifiedTable, userId, channelId }),
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "➕ Add Column",
                },
                action_id: "add_column",
                value: JSON.stringify({ table: modifiedTable, userId, channelId }),
              },
            ],
          },
        ],
      } as any);
      console.log("[AI Edit] Ephemeral preview posted successfully");
    } else if (responseUrl) {
      // Fallback to response_url
      console.log("[AI Edit] Using response_url to post table");
      const response = await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "in_channel",
          text: "Table updated",
          replace_original: false,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: markdown,
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "✏️ Edit",
                  },
                  action_id: "edit_table",
                  value: JSON.stringify({ table: modifiedTable, userId, channelId }),
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "➕ Add Row",
                  },
                  action_id: "add_row",
                  value: JSON.stringify({ table: modifiedTable, userId, channelId }),
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "➕ Add Column",
                  },
                  action_id: "add_column",
                  value: JSON.stringify({ table: modifiedTable, userId, channelId }),
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Response URL failed: ${response.status}`);
      }
      console.log("[AI Edit] Table posted via response_url");
    } else if (channelId) {
      // Last resort: post new message
      console.log("[AI Edit] Posting new table message to channel");
      await postTable(slack, channelId, modifiedTable, userId);
    } else {
      throw new Error("No channel ID, message TS, or response URL available");
    }
  } catch (error) {
    console.error("[AI Edit] Error:", error);

    if (messageTs && channelId) {
      // Try to post error as ephemeral message
      try {
        await slack.chat.postEphemeral({
          channel: channelId,
          user: userId,
          text: "❌ Sorry, I couldn't apply those changes. Please try editing manually.",
        });
      } catch (e) {
        console.error("[AI Edit] Failed to post error message:", e);
      }
    } else if (responseUrl) {
      await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "❌ Sorry, I couldn't apply those changes. Please try editing manually.",
        }),
      });
    }
  }
}

/**
 * Post a formatted table to Slack
 */
export async function postTable(
  slack: WebClient,
  channelId: string,
  table: TableData,
  userId: string
): Promise<void> {
  const markdown = formatTableAsMarkdown(table);

  const message = {
    channel: channelId,
    text: "Table created",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: markdown,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "✏️ Edit",
            },
            action_id: "edit_table",
            value: JSON.stringify({ table, userId, channelId }),
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "➕ Add Row",
            },
            action_id: "add_row",
            value: JSON.stringify({ table, userId, channelId }),
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "➕ Add Column",
            },
            action_id: "add_column",
            value: JSON.stringify({ table, userId, channelId }),
          },
        ],
      },
    ],
  };

  await slack.chat.postMessage(message as any);
}

/**
 * Handle button interactions (edit, add row, add column)
 */
export async function handleTableAction(
  payload: any,
  slack: WebClient
): Promise<void> {
  const { actions, trigger_id, user, message } = payload;
  const action = actions[0];
  const { action_id, value } = action;

  console.log("[TableAction]", { action_id, has_value: !!value, has_message: !!message });

  const data = value ? JSON.parse(value) : {};
  const table: TableData = data.table;
  const originalUserId = data.userId;
  const storedChannelId = data.channelId;
  const storedMessageTs = data.messageTs;

  // Only allow the original creator to edit (skip check if no userId in data)
  if (originalUserId && user.id !== originalUserId) {
    await slack.chat.postEphemeral({
      channel: payload.channel?.id || payload.view?.id,
      user: user.id,
      text: "⚠️ Only the table creator can edit this table.",
    });
    return;
  }

  switch (action_id) {
    case "edit_table":
      // Capture messageTs from the actual message if available
      const messageTs = message?.ts || storedMessageTs;
      const channelId = storedChannelId || message?.channel;

      console.log("[TableAction] Edit table clicked, messageTs:", messageTs, "channelId:", channelId);

      // Show options: AI edit or Manual edit
      await slack.views.open({
        trigger_id: trigger_id,
        view: {
          type: "modal",
          callback_id: "edit_choice_modal",
          title: {
            type: "plain_text",
            text: "Edit Table",
          },
          close: {
            type: "plain_text",
            text: "Cancel",
          },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "How would you like to edit this table?",
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "🤖 Edit with AI",
                  },
                  action_id: "edit_with_ai",
                  value: JSON.stringify({ table, userId: originalUserId, channelId, messageTs }),
                  style: "primary",
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "✏️ Edit Manually",
                  },
                  action_id: "edit_manually",
                  value: JSON.stringify({ table, userId: originalUserId, channelId, messageTs }),
                },
              ],
            },
          ],
        } as any,
      });
      break;

    case "edit_with_ai":
      console.log("[TableAction] Opening AI edit modal");
      try {
        // Use stored values from button or extract from message
        const channelId = storedChannelId || message?.channel;
        const messageTs = storedMessageTs || message?.ts;

        console.log("[TableAction] Using channelId:", channelId, "messageTs:", messageTs);

        await slack.views.push({
          trigger_id: trigger_id,
          view: {
            type: "modal",
            callback_id: "ai_edit_modal",
            title: {
              type: "plain_text",
              text: "AI Edit",
            },
            submit: {
              type: "plain_text",
              text: "Apply Changes",
            },
            close: {
              type: "plain_text",
              text: "Cancel",
            },
            private_metadata: JSON.stringify({ table, userId: originalUserId, channelId, messageTs }),
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "Describe how you'd like to modify the table:",
                },
              },
              {
                type: "input",
                block_id: "edit_description",
                label: {
                  type: "plain_text",
                  text: "Changes",
                },
                element: {
                  type: "plain_text_input",
                  action_id: "edit_input",
                  multiline: true,
                  placeholder: {
                    type: "plain_text",
                    text: 'e.g., "add a deadline column" or "remove the last row" or "add a row for Project D, in progress, Mike"',
                  },
                },
              },
            ],
          } as any,
        });
        console.log("[TableAction] AI edit modal pushed");
      } catch (error) {
        console.error("[TableAction] Error opening AI edit modal:", error);
        throw error;
      }
      break;

    case "edit_manually":
      console.log("[TableAction] Opening manual edit modal");
      try {
        await slack.views.push({
          trigger_id: trigger_id,
          view: await createTableModalView(table, true),
        });
        console.log("[TableAction] Manual edit modal pushed");
      } catch (error) {
        console.error("[TableAction] Error opening manual edit modal:", error);
        throw error;
      }
      break;

    case "add_row":
      // Add an empty row
      const tableWithRow = {
        ...table,
        rows: [...table.rows, Array(table.headers.length).fill("")],
      };
      await openTableModal(slack, trigger_id, tableWithRow);
      break;

    case "add_column":
      // Add an empty column
      const tableWithColumn = {
        headers: [...table.headers, `Col ${table.headers.length + 1}`],
        rows: table.rows.map((row) => [...row, ""]),
      };
      await openTableModal(slack, trigger_id, tableWithColumn);
      break;

    case "post_to_channel":
      // Post the table to the channel
      console.log("[TableAction] Posting table to channel");
      try {
        const channelToPost = storedChannelId || payload.channel?.id;
        if (channelToPost) {
          await postTable(slack, channelToPost, table, originalUserId);
          // Acknowledge with ephemeral message
          await slack.chat.postEphemeral({
            channel: channelToPost,
            user: user.id,
            text: "✅ Table posted to channel!",
          });
        }
      } catch (error) {
        console.error("[TableAction] Error posting to channel:", error);
        await slack.chat.postEphemeral({
          channel: payload.channel?.id || storedChannelId,
          user: user.id,
          text: "❌ Failed to post table to channel. Please try again.",
        });
      }
      break;
  }
}
