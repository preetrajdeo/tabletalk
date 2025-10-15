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
  const { trigger_id, text, user_id, channel_id, response_url, channel_name } = payload;

  console.log("[TableCommand] Received:", { text, user_id, channel_id, channel_name, response_url });
  console.log("[TableCommand] Full payload:", JSON.stringify(payload, null, 2));

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
  console.log("[TableCommand] Opening modal for channel:", channel_id);
  await openTableModal(slack, trigger_id, null, channel_id, user_id);
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

  // Add action buttons for adding rows and columns (only in edit mode)
  if (isEdit) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Need more space?*",
      },
    });
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "➕ Add Row",
          },
          action_id: "modal_add_row",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "➕ Add Column",
          },
          action_id: "modal_add_column",
        },
      ],
    });
    blocks.push({
      type: "divider",
    });
  }

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
  existingTable: TableData | null,
  channelId?: string,
  userId?: string
): Promise<void> {
  const isEdit = existingTable !== null;

  const view = createTableModalView(existingTable, isEdit);

  // Add channel and user info to private_metadata if provided
  if (channelId || userId) {
    view.private_metadata = JSON.stringify({ channelId, userId });
  }

  await slack.views.open({
    trigger_id: triggerId,
    view: view as any,
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
    // Stop if this row doesn't exist in the form
    if (!values[`row_${rowIndex}_col_0`]) {
      break;
    }

    const row: string[] = [];
    for (let col = 0; col < headers.length; col++) {
      const blockId = `row_${rowIndex}_col_${col}`;
      const actionId = `cell_input_${rowIndex}_${col}`;
      const cellValue = values[blockId]?.[actionId]?.value || "";
      row.push(cellValue.trim());
    }

    // Include all rows, even if empty
    rows.push(row);
    rowIndex++;
  }

  const table: TableData = { headers, rows };

  // Get channel from metadata if available, otherwise use user's DM
  let channelId = user.id; // Default to DM
  let originalUserId = user.id;

  console.log("[Modal Submission] Initial channelId (user.id):", channelId);
  console.log("[Modal Submission] view.private_metadata:", view.private_metadata);

  if (view.private_metadata) {
    try {
      const metadata = JSON.parse(view.private_metadata);
      console.log("[Modal Submission] Parsed metadata:", metadata);
      channelId = metadata.channelId || user.id;
      originalUserId = metadata.userId || user.id;
      console.log("[Modal Submission] Using channel from metadata:", channelId);
    } catch (e) {
      // If metadata is not JSON, assume it's a channel ID (for backward compatibility)
      channelId = view.private_metadata;
      console.log("[Modal Submission] Using channel from legacy metadata:", channelId);
    }
  } else {
    console.log("[Modal Submission] No private_metadata found, using user.id as channelId");
  }

  console.log("[Modal Submission] Final channelId before posting:", channelId);
  console.log("[Modal Submission] Final userId:", originalUserId);

  // Post the table
  try {
    await postTable(slack, channelId, table, originalUserId);
    console.log("[Modal Submission] Table posted successfully");
  } catch (error) {
    console.error("[Modal Submission] Error posting table:", error);
    throw error; // Re-throw so the modal doesn't close on error
  }
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
  console.log("[postTable] Called with:", { channelId, userId, hasTable: !!table });

  if (!channelId) {
    console.error("[postTable] ERROR: channelId is missing!");
    throw new Error("Cannot post table: channelId is required");
  }

  // For DM channels (start with 'D'), use conversations.open first to ensure the DM exists
  let targetChannel = channelId;
  if (channelId.startsWith('D')) {
    console.log("[postTable] DM detected, opening conversation with user:", userId);
    try {
      const result = await slack.conversations.open({
        users: userId,
      });
      targetChannel = result.channel?.id || channelId;
      console.log("[postTable] DM conversation opened, channel:", targetChannel);
    } catch (error) {
      console.error("[postTable] Error opening DM conversation:", error);
      // Fall back to using the original channelId
    }
  }

  const markdown = formatTableAsMarkdown(table);

  const message = {
    channel: targetChannel,
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

  console.log("[postTable] About to call slack.chat.postMessage");
  const result = await slack.chat.postMessage(message as any);
  console.log("[postTable] Message posted successfully:", { ts: result.ts, channel: result.channel });
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

  console.log("[TableAction] Parsed data:", {
    hasTable: !!table,
    tableHeaders: table?.headers?.length,
    tableRows: table?.rows?.length,
    userId: originalUserId,
    channelId: storedChannelId
  });

  // Check if table data is valid
  if (!table || !table.headers || !table.rows) {
    console.error("[TableAction] Invalid table data:", { table, data });
    await slack.chat.postEphemeral({
      channel: payload.channel?.id || storedChannelId,
      user: user.id,
      text: "❌ Invalid table data. Please try creating a new table.",
    });
    return;
  }

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
        const channelId = storedChannelId || message?.channel;
        const modalView = createTableModalView(table, true);

        // Add metadata with channel and user info
        if (channelId || originalUserId) {
          modalView.private_metadata = JSON.stringify({ channelId, userId: originalUserId });
        }

        await slack.views.push({
          trigger_id: trigger_id,
          view: modalView as any,
        });
        console.log("[TableAction] Manual edit modal pushed with metadata");
      } catch (error) {
        console.error("[TableAction] Error opening manual edit modal:", error);
        throw error;
      }
      break;

    case "add_row":
      console.log("[TableAction] Adding row to table");
      try {
        // Add an empty row
        const tableWithRow = {
          ...table,
          rows: [...table.rows, Array(table.headers.length).fill("")],
        };
        console.log("[TableAction] Opening modal with new row, channelId:", storedChannelId);
        await openTableModal(slack, trigger_id, tableWithRow, storedChannelId, originalUserId);
        console.log("[TableAction] Modal opened successfully");
      } catch (error) {
        console.error("[TableAction] Error adding row:", error);
        await slack.chat.postEphemeral({
          channel: payload.channel?.id || storedChannelId,
          user: user.id,
          text: "❌ Failed to open edit modal. Please try again.",
        });
      }
      break;

    case "add_column":
      console.log("[TableAction] Adding column to table");
      try {
        // Add an empty column
        const tableWithColumn = {
          headers: [...table.headers, `Col ${table.headers.length + 1}`],
          rows: table.rows.map((row) => [...row, ""]),
        };
        console.log("[TableAction] Opening modal with new column, channelId:", storedChannelId);
        await openTableModal(slack, trigger_id, tableWithColumn, storedChannelId, originalUserId);
        console.log("[TableAction] Modal opened successfully");
      } catch (error) {
        console.error("[TableAction] Error adding column:", error);
        await slack.chat.postEphemeral({
          channel: payload.channel?.id || storedChannelId,
          user: user.id,
          text: "❌ Failed to open edit modal. Please try again.",
        });
      }
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

    case "modal_add_row":
      console.log("[TableAction] Adding row from modal");
      try {
        // Extract current form data from the modal
        const view = payload.view;
        const values = view.state.values;

        console.log("[modal_add_row] view.id:", view.id);
        console.log("[modal_add_row] view.private_metadata:", view.private_metadata);

        // Extract headers
        const headers: string[] = [];
        let colIdx = 0;
        while (values[`header_${colIdx}`]) {
          headers.push(values[`header_${colIdx}`][`header_input_${colIdx}`]?.value || "");
          colIdx++;
        }

        console.log("[modal_add_row] Extracted headers:", headers);

        // Extract rows
        const rows: string[][] = [];
        let rowIdx = 0;
        while (values[`row_${rowIdx}_col_0`]) {
          const row: string[] = [];
          for (let col = 0; col < headers.length; col++) {
            row.push(values[`row_${rowIdx}_col_${col}`]?.[`cell_input_${rowIdx}_${col}`]?.value || "");
          }
          rows.push(row);
          rowIdx++;
        }

        console.log("[modal_add_row] Extracted rows (before adding new):", rows.length);

        // Add new empty row
        rows.push(Array(headers.length).fill(""));

        console.log("[modal_add_row] Total rows (after adding new):", rows.length);

        const updatedTable = { headers, rows };

        // Extract metadata
        let channelId, userId;
        if (view.private_metadata) {
          const metadata = JSON.parse(view.private_metadata);
          channelId = metadata.channelId;
          userId = metadata.userId;
        }

        console.log("[modal_add_row] Metadata:", { channelId, userId });

        // Update the modal with the new row and preserve metadata
        const newView = createTableModalView(updatedTable, true);
        if (channelId || userId) {
          newView.private_metadata = JSON.stringify({ channelId, userId });
        }

        console.log("[modal_add_row] About to update modal with", rows.length, "rows");

        // Update the modal with the new row
        try {
          const result = await slack.views.update({
            view_id: view.id,
            view: newView as any,
          });

          console.log("[TableAction] Row added to modal successfully, result:", JSON.stringify(result));
        } catch (updateError) {
          console.error("[TableAction] Error updating modal view:", updateError);
          throw updateError;
        }
      } catch (error) {
        console.error("[TableAction] Error adding row in modal:", error);
        // Log the full error details
        if (error instanceof Error) {
          console.error("[TableAction] Error name:", error.name);
          console.error("[TableAction] Error message:", error.message);
          console.error("[TableAction] Error stack:", error.stack);
        }
      }
      break;

    case "modal_add_column":
      console.log("[TableAction] Adding column from modal");
      try {
        // Extract current form data from the modal
        const view = payload.view;
        const values = view.state.values;

        // Extract headers
        const headers: string[] = [];
        let colIdx = 0;
        while (values[`header_${colIdx}`]) {
          headers.push(values[`header_${colIdx}`][`header_input_${colIdx}`]?.value || "");
          colIdx++;
        }

        // Add new column header
        headers.push(`Col ${headers.length + 1}`);

        // Extract rows and add empty cell to each
        const rows: string[][] = [];
        let rowIdx = 0;
        while (values[`row_${rowIdx}_col_0`]) {
          const row: string[] = [];
          for (let col = 0; col < headers.length - 1; col++) {
            row.push(values[`row_${rowIdx}_col_${col}`]?.[`cell_input_${rowIdx}_${col}`]?.value || "");
          }
          row.push(""); // Add empty cell for new column
          rows.push(row);
          rowIdx++;
        }

        const updatedTable = { headers, rows };

        // Extract metadata
        let channelId, userId;
        if (view.private_metadata) {
          const metadata = JSON.parse(view.private_metadata);
          channelId = metadata.channelId;
          userId = metadata.userId;
        }

        // Update the modal with the new column
        const newView = createTableModalView(updatedTable, true);
        if (channelId || userId) {
          newView.private_metadata = JSON.stringify({ channelId, userId });
        }

        await slack.views.update({
          view_id: view.id,
          view: newView as any,
        });

        console.log("[TableAction] Column added to modal successfully");
      } catch (error) {
        console.error("[TableAction] Error adding column in modal:", error);
      }
      break;
  }
}
