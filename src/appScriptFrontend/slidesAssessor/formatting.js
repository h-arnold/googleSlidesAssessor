/**
 * Creates headers for the given sheet using the parsed data.
 * @param {Sheet} sheet - The Google Sheet to create headers for.
 * @param {Object} parsedData - The parsed data to extract headers from.
 * @returns {Object} - An object containing headersRequests and headers.
 */
function createHeaders(sheet, parsedData) {
  const sheetId = sheet.getSheetId();
  let headersRequests = [];

  // Extract headers
  const { topHeaders, subHeaders } = extractHeaders(parsedData);

  console.log(`Top headers object is: ${JSON.stringify(topHeaders)} and is ${topHeaders.length} long.`)

  // Ensure sheet has enough columns
  headersRequests.push(...ensureSheetHasEnoughColumns(sheet, sheetId, topHeaders.length));

  // Create header value requests
  headersRequests.push(createHeaderValuesRequest(sheetId, topHeaders, 0));
  headersRequests.push(createHeaderValuesRequest(sheetId, subHeaders, 1));

  // Add header formatting requests
  headersRequests.push(createHeaderFormattingRequest(sheetId, topHeaders.length));
  headersRequests.push(createSecondRowFormattingRequest(sheetId, topHeaders.length));

  // Add merge requests for task headers
  headersRequests.push(...createMergeRequests(sheetId, topHeaders));

  // Concatenate headers arrays for calculating the column width later
  const headers = [topHeaders, subHeaders];

  console.log(`Headers request is: \n  ${JSON.stringify(headersRequests)}`)

  return { headersRequests, headers };
}

/**
 * Extracts top and sub headers from the parsed data.
 * @param {Object} parsedData - The parsed data to extract headers from.
 * @returns {Object} - An object containing topHeaders and subHeaders.
 */
function extractHeaders(parsedData) {
  const topHeaders = [""];
  const subHeaders = ["Name"];

  Object.keys(parsedData).forEach(function(task) {
    topHeaders.push(task, "", "");
    subHeaders.push("Completeness", "Accuracy", "SPaG");
  });

  // Add the Averages header
  topHeaders.push("Averages", "", "");
  subHeaders.push("Completeness", "Accuracy", "SPaG");

  return { topHeaders, subHeaders };
}

/**
 * Ensures the sheet has enough columns.
 * @param {Sheet} sheet - The Google Sheet to check.
 * @param {number} sheetId - The ID of the sheet.
 * @param {number} requiredColumns - The number of columns required.
 * @returns {Array} - An array of requests to add columns if needed.
 */
function ensureSheetHasEnoughColumns(sheet, sheetId, requiredColumns) {
  const currentColumns = sheet.getMaxColumns();
  if (currentColumns < requiredColumns) {
    return [{
      appendDimension: {
        sheetId: sheetId,
        dimension: "COLUMNS",
        length: requiredColumns - currentColumns
      }
    }];
  }
  return [];
}

/**
 * Creates a request to set header values in the sheet.
 * @param {number} sheetId - The ID of the sheet.
 * @param {Array<string>} headers - The header values to set.
 * @param {number} rowIndex - The row index to start setting the header values.
 * @returns {Object} - A request to update cells with header values.
 */
function createHeaderValuesRequest(sheetId, headers, rowIndex) {
  return {
    updateCells: {
      rows: [
        {
          values: headers.map(function(header) {
            return { userEnteredValue: { stringValue: header } };
          })
        }
      ],
      fields: 'userEnteredValue',
      start: { sheetId: sheetId, rowIndex: rowIndex, columnIndex: 0 }
    }
  };
}

/**
 * Creates a request to format header cells in the sheet.
 * @param {number} sheetId - The ID of the sheet.
 * @param {number} headerLength - The number of header columns to format.
 * @returns {Object} - A request to format header cells.
 */
function createHeaderFormattingRequest(sheetId, headerLength) {
  return {
    repeatCell: {
      range: {
        sheetId: sheetId,
        startRowIndex: 0,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: headerLength
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE",
          textFormat: {
            bold: true
          }
        }
      },
      fields: "userEnteredFormat(backgroundColor, horizontalAlignment, verticalAlignment, textFormat)"
    }
  };
}

/**
 * Creates merge requests for task headers.
 * @param {number} sheetId - The ID of the sheet.
 * @param {Array<string>} topHeaders - The top headers to create merge requests for.
 * @returns {Array} - An array of merge requests.
 */
function createMergeRequests(sheetId, topHeaders) {
  let mergeRequests = [];
  
  // Iterate over the top headers and create merge requests for tasks
  let columnIndex = 1; // Start after the first column (Name)
  for (let i = 1; i < topHeaders.length; i += 3) {
    mergeRequests.push({
      mergeCells: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: columnIndex,
          endColumnIndex: columnIndex + 3
        },
        mergeType: "MERGE_ALL"
      }
    });
    columnIndex += 3;
  }

  return mergeRequests;
}

/**
 * Creates requests to set column widths in the sheet.
 * @param {Sheet} sheet - The Google Sheet to set column widths for.
 * @param {Array<number>} columnWidths - The widths of the columns to set.
 * @returns {Array} - An array of requests to update column widths.
 */
function createColumnWidthRequests(sheet, columnWidths) {
  const sheetId = sheet.getSheetId();
  let requests = [];

  columnWidths.forEach((width, index) => {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: sheetId,
          dimension: "COLUMNS",
          startIndex: index,
          endIndex: index + 1
        },
        properties: {
          pixelSize: width
        },
        fields: "pixelSize"
      }
    });
  });

  return requests;
}

/**
 * Calculates the widths of columns based on headers and data.
 * @param {Array<Array<string>>} headers - The headers of the sheet.
 * @param {Array<Object>} data - The data to calculate column widths from.
 * @returns {Array<number>} - An array of column widths.
 */
function calculateColumnWidths(headers, data) {
  const charWidth = 10; // Approximate width of a character in pixels
  let nameColumnWidth = headers[0][0].length * charWidth; // Initialize with the length of the first header (Name)

  // Calculate the maximum length of the name column
  data.forEach(row => {
    const cellValue = row.rowData[0].userEnteredValue.stringValue;
    const cellLength = cellValue.length;
    if (cellLength * charWidth > nameColumnWidth) {
      nameColumnWidth = cellLength * charWidth;
    }
  });

  // Set a fixed width for task columns (75 pixels each)
  const taskColumnWidth = 75;
  const totalColumns = headers[1].length; // Including new average columns

  // Create an array for column widths
  let columnWidths = [nameColumnWidth];
  for (let i = 1; i < totalColumns; i++) {
    columnWidths.push(taskColumnWidth);
  }

  return columnWidths;
}

/**
 * Creates a request to format the second row of headers in the sheet.
 * @param {number} sheetId - The ID of the sheet.
 * @param {number} headerLength - The number of header columns to format.
 * @returns {Object} - A request to format the second row of headers.
 */
function createSecondRowFormattingRequest(sheetId, headerLength) {
  return {
    repeatCell: {
      range: {
        sheetId: sheetId,
        startRowIndex: 1,
        endRowIndex: 2,
        startColumnIndex: 1,
        endColumnIndex: headerLength
      },
      cell: {
        userEnteredFormat: {
          textRotation: {
            angle: 45,
          },
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE"
        }
      },
      fields: "userEnteredFormat(textRotation, horizontalAlignment, verticalAlignment)"
    }
  };
}


/**
 * Executes a batch update of requests.
 * @param {Object[]} requests - The requests to be executed.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to update.
 */
function executeBatchUpdate(requests) {
  // Ensure that the sheet has enough columns for the batch update
  const spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  try {
    Sheets.Spreadsheets.batchUpdate({ requests: requests }, spreadsheetId);
  } catch (e){
    console.log(e.message)
    console.log(e.stack)
    console.log(JSON.stringify(requests))
    throw new Error(`Error applying batch update. ${e.message}`);
  }
}


/**
 * Applies a batch update to the sheet with the given data.
 * @param {Array<Object>} data - The data to apply.
 * @param {Sheet} sheet - The Google Sheet to update.
 */
function applyBatchUpdate(data, sheet) {
  let requests = buildBatchUpdateRequests(data, sheet);

  const headersRequests = data[0].headersRequests;

  //This gets executed first to ensure that there are enough columns before the rest of the batch update is executed.
  executeBatchUpdate(headersRequests);

  const conditionalFormattingRequests = createConditionalFormattingRequests(data, sheet);
  requests = requests.concat(conditionalFormattingRequests);

  const columnWidths = calculateColumnWidths(data[0].headers, data);
  const columnWidthRequests = createColumnWidthRequests(sheet, columnWidths);
  requests = requests.concat(columnWidthRequests);

  // Add freeze rows and columns request
  const freezeRequest = createFreezeRequest(sheet);
  requests.push(freezeRequest);

  // Add Class Average row and blank row
  const classAverageRequests = addClassAverageRow(sheet, data);
  requests = requests.concat(classAverageRequests);

  executeBatchUpdate(requests);
}

/**
 * Builds batch update requests for the given data and sheet.
 * @param {Array<Object>} data - The data to use for building requests.
 * @param {Sheet} sheet - The Google Sheet to update.
 * @returns {Array<Object>} - An array of batch update requests.
 */
function buildBatchUpdateRequests(data, sheet) {
  let requests = [];
  const sheetId = sheet.getSheetId();

  data.forEach((row, rowIndex) => {
    const { rowData, notesData } = row;

    // Prepare the request to set values and add notes
    requests.push({
      updateCells: {
        rows: [{
          values: rowData.map(value => {
            if (value.userEnteredValue.hasOwnProperty('numberValue')) {
              if (value.userEnteredValue.numberValue === "N") {
                value.userEnteredValue.numberValue = 0;
              }
              return { userEnteredValue: { numberValue: value.userEnteredValue.numberValue } };
            } else if (value.userEnteredValue.hasOwnProperty('stringValue')) {
              return { userEnteredValue: { stringValue: value.userEnteredValue.stringValue } };
            } else if (value.userEnteredValue.hasOwnProperty('formulaValue')) {
              return { userEnteredValue: { formulaValue: value.userEnteredValue.formulaValue } };
            }
          })
        }],
        fields: 'userEnteredValue,note', // Include notes in the fields
        start: { sheetId: sheetId, rowIndex: rowIndex + 2, columnIndex: 0 } // Adjust for header rows
      }
    });

    // Add notes for each cell
    notesData.forEach((note, columnIndex) => {
      requests.push({
        updateCells: {
          rows: [{
            values: [{ note: note }]
          }],
          fields: 'note',
          start: { sheetId: sheetId, rowIndex: rowIndex + 2, columnIndex: columnIndex + 1 } // Adjust for student name columns
        }
      });
    });
  });

  // Add cell formatting requests for all columns after the name column
  requests.push({
    repeatCell: {
      range: {
        sheetId: sheetId,
        startRowIndex: 2, // Data starts after the header rows
        endRowIndex: data.length + 2, // Number of rows including header rows
        startColumnIndex: 1, // Columns after the name column
        endColumnIndex: data[0].rowData.length // Up to the last column
      },
      cell: {
        userEnteredFormat: {
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE"
        }
      },
      fields: "userEnteredFormat(horizontalAlignment, verticalAlignment)"
    }
  });

  return requests;
}

/**
 * Creates conditional formatting requests for the given data and sheet.
 * @param {Array<Object>} data - The data to format.
 * @param {Sheet} sheet - The Google Sheet to format.
 * @returns {Array<Object>} - An array of conditional formatting requests.
 */
function createConditionalFormattingRequests(data, sheet) {
  const sheetId = sheet.getSheetId();
  
  // Calculate number of rows and columns based on data array
  const numRows = data.length + 2 + 2; // Add 2 for header rows, and 2 for blank and class average rows
  const numColumns = data[3].rowData.length;

  // Calculate the starting row and column for the task data
  const startRowIndex = 2; // Assuming the header rows are the first two rows
  const startColumnIndex = 1; // Assuming the first column is for name
  const endRowIndex = numRows;
  const endColumnIndex = startColumnIndex + numColumns + 3; // Add 3 to include average columns.

  const range = {
    sheetId: sheetId,
    startRowIndex: startRowIndex,
    startColumnIndex: startColumnIndex,
    endRowIndex: endRowIndex,
    endColumnIndex: endColumnIndex
  };

  const requests = [
    {
      addConditionalFormatRule: {
        rule: {
          ranges: [range],
          gradientRule: {
            minpoint: {
              color: { red: 1, green: 0, blue: 0 }, // Dark amber for 0
              type: "NUMBER",
              value: "0"
            },
            midpoint: {
              color: { red: 1, green: 1, blue: 0 }, // Yellow for mid-point (2.5)
              type: "NUMBER",
              value: "2.5"
            },
            maxpoint: {
              color: { red: 0, green: 1, blue: 0 }, // Green for 5
              type: "NUMBER",
              value: "5"
            }
          }
        }
      }
    },
    {
      addConditionalFormatRule: {
        rule: {
          ranges: [range],
          booleanRule: {
            condition: {
              type: "TEXT_EQ",
              values: [
                {
                  userEnteredValue: "N"
                }
              ]
            },
            format: {
              backgroundColor: {
                red: 1,
                green: 0,
                blue: 0
              }
            }
          }
        },
        index: 0
      }
    }
  ];
  return requests;
}

/**
 * Creates a request to freeze the first two rows and first column in the sheet.
 * @param {Sheet} sheet - The Google Sheet to freeze.
 * @returns {Object} - A request to freeze rows and columns.
 */
function createFreezeRequest(sheet) {
  return {
    updateSheetProperties: {
      properties: {
        sheetId: sheet.getSheetId(),
        gridProperties: {
          frozenRowCount: 2,
          frozenColumnCount: 1
        }
      },
      fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount'
    }
  };
}

/**
 * Builds a batch update request for student averages in the overview sheet.
 * @param {Array<Object>} studentAverages - The student averages to add.
 * @param {Sheet} sheet - The overview Google Sheet.
 * @returns {Array<Object>} - An array of batch update requests.
 */
function buildOverviewAveragesBatchUpdateRequest(studentAverages, sheet) {
  let requests = [];
  const sheetId = sheet.getSheetId();

  // Clear existing content in the overview sheet
  requests.push({
    updateCells: {
      range: {
        sheetId: sheetId,
        startRowIndex: 1, // Assuming headers are in the first row
        startColumnIndex: 0
      },
      fields: 'userEnteredValue'
    }
  });

  // Prepare rows of student averages
  const rows = studentAverages.map(student => {
    return {
      values: [
        { userEnteredValue: { stringValue: student.name } },
        { userEnteredValue: { numberValue: parseFloat(student.completeness) } },
        { userEnteredValue: { numberValue: parseFloat(student.accuracy) } },
        { userEnteredValue: { numberValue: parseFloat(student.spag) } }
      ]
    };
  });

  // Add the student averages to the update request
  requests.push({
    updateCells: {
      rows: rows,
      fields: 'userEnteredValue',
      start: { sheetId: sheetId, rowIndex: 1, columnIndex: 0 }
    }
  });

  return requests;
}

/**
 * Creates conditional formatting requests for the overview sheet.
 * @param {Sheet} sheet - The overview Google Sheet.
 * @param {number} rowCount - The number of rows to format.
 * @returns {Array<Object>} - An array of conditional formatting requests.
 */
function createOverviewConditionalFormattingRequests(sheet, rowCount) {
  const sheetId = sheet.getSheetId();
  const numRows = rowCount + 3; // Including the header row, blank row, and class average row
  const startRowIndex = 1; // Assuming the header row is the first row
  const startColumnIndex = 1; // Assuming the first column is for names
  const endColumnIndex = 5; // Completeness, Accuracy, SPaG, Average (Columns B to E)

  const range = {
    sheetId: sheetId,
    startRowIndex: startRowIndex,
    startColumnIndex: startColumnIndex,
    endRowIndex: numRows,
    endColumnIndex: endColumnIndex
  };

  const requests = [
    {
      addConditionalFormatRule: {
        rule: {
          ranges: [range],
          gradientRule: {
            minpoint: {
              color: { red: 1, green: 0, blue: 0 }, // Red for 0
              type: 'NUMBER',
              value: '0'
            },
            midpoint: {
              color: { red: 1, green: 1, blue: 0 }, // Yellow for mid-point (2.5)
              type: 'NUMBER',
              value: '2.5'
            },
            maxpoint: {
              color: { red: 0, green: 1, blue: 0 }, // Green for 5
              type: 'NUMBER',
              value: '5'
            }
          }
        },
        index: 0
      }
    },
    {
      "addConditionalFormatRule": {
        "rule": {
          "ranges": [range],
          "booleanRule": {
            "condition": {
              "type": "TEXT_EQ",
              "values": [
                {
                  "userEnteredValue": "N"
                }
              ]
            },
            "format": {
              "backgroundColor": {
                "red": 1,
                "green": 0,
                "blue": 0
              }
            }
          }
        },
        "index": 0
      }
    }
  ];

  return requests;
}

//NEW MARKDOWN FORMATTING FUNCTIONALITY - THIS FORMATS MARKDOWN TABLES AFTER THEY'VE BEEN PROCESSED IN LANGFLOW TO OPTIMISE THEM FOR READABILITY.

/**
 * Formats all Markdown tables within a given text by wrapping cell content to a maximum of 16 characters.
 * @param {string} text - The input text containing Markdown tables.
 * @return {string} - The text with all Markdown tables formatted with wrapped text.
 */
function formatMarkdownTablesInText(text) {
  if (!text || typeof text !== 'string') return text;

  // Regular expression to match Markdown tables
  const tableRegex = /(\|(?:.+\|)+\n\|(?:\s*-+\s*\|)+\n(?:\|.*\|(?:\n\|.*\|)*)?)/g;

  return text.replace(tableRegex, function(match) {
    return formatMarkdownTable(match);
  });
}

/**
 * Formats a single Markdown table to have consistent column widths with wrapped text.
 * Columns are either as wide as the widest cell (up to 16 characters) or 16 characters, whichever is smaller.
 * @param {string} tableText - The Markdown table text.
 * @return {string} - The formatted Markdown table with wrapped text.
 */
function formatMarkdownTable(tableText) {
  const lines = tableText.trim().split('\n');

  if (lines.length < 2) return tableText; // Not a valid table

  // Parse header and separator
  const header = lines[0].trim().split('|').slice(1, -1).map(cell => cell.trim());
  const separator = lines[1].trim().split('|').slice(1, -1).map(cell => cell.trim());

  // Parse data rows
  const dataRows = lines.slice(2).map(line => 
    line.trim().split('|').slice(1, -1).map(cell => cell.trim())
  );

  // Determine the number of columns
  const numCols = header.length;

  // Initialize array to hold maximum widths for each column
  const maxColWidths = Array(numCols).fill(0);

  // Compute maximum width for each column based on header and data
  header.forEach((cell, index) => {
    const wrapped = wrapText(cell, 16);
    const maxLength = Math.max(...wrapped.map(line => line.length));
    maxColWidths[index] = Math.min(maxLength, 16);
  });

  dataRows.forEach(row => {
    row.forEach((cell, index) => {
      const wrapped = wrapText(cell, 16);
      const maxLength = Math.max(...wrapped.map(line => line.length));
      maxColWidths[index] = Math.min(Math.max(maxColWidths[index], maxLength), 16);
    });
  });

  // Format header row with wrapped text
  const formattedHeaderLines = header.map((cell, index) => {
    const wrapped = wrapText(cell, 16);
    return wrapped.map(line => padString(line, maxColWidths[index])).join('\n');
  });

  // Determine the maximum number of lines in the header
  const headerMaxLines = Math.max(...formattedHeaderLines.map(line => line.split('\n').length));

  // Pad header lines to have the same number of lines
  const paddedFormattedHeader = formattedHeaderLines.map(line => {
    const lines = line.split('\n');
    while (lines.length < headerMaxLines) {
      lines.push(padString('', maxColWidths[formattedHeaderLines.indexOf(line)]));
    }
    return lines;
  });

  // Transpose the header to create multi-line headers
  let finalHeader = '';
  for (let i = 0; i < headerMaxLines; i++) {
    finalHeader += '| ' + paddedFormattedHeader.map(line => line[i]).join(' | ') + ' |\n';
  }

  // Format separator row
  const formattedSeparator = '| ' + maxColWidths.map(width => '-'.repeat(width)).join(' | ') + ' |';

  // Format data rows with wrapped text
  const formattedDataRows = dataRows.map(row => {
    // Wrap each cell in the row
    const wrappedCells = row.map((cell, index) => wrapText(cell, 16));

    // Determine the maximum number of lines in this row
    const rowMaxLines = Math.max(...wrappedCells.map(cell => cell.length));

    // Pad each cell's wrapped lines to have the same number of lines
    const paddedWrappedCells = wrappedCells.map(cell => {
      while (cell.length < rowMaxLines) {
        cell.push(padString('', maxColWidths[wrappedCells.indexOf(cell)]));
      }
      return cell;
    });

    // Transpose the wrapped cells to create multi-line rows
    let finalRow = '';
    for (let i = 0; i < rowMaxLines; i++) {
      finalRow += '| ' + paddedWrappedCells.map(cell => padString(cell[i], maxColWidths[paddedWrappedCells.indexOf(cell)])).join(' | ') + ' |\n';
    }

    return finalRow.trim(); // Remove trailing newline
  });

  // Combine all parts
  return [finalHeader.trim(), formattedSeparator, ...formattedDataRows].join('\n');
}

/**
 * Wraps a given text into lines with a maximum specified length by inserting line breaks.
 * @param {string} text - The text to wrap.
 * @param {number} maxLength - The maximum length of each line.
 * @return {Array.<string>} - An array of wrapped lines.
 */
function wrapText(text, maxLength) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      if (word.length > maxLength) {
        // If the word itself is longer than maxLength, split it
        let splitWord = word;
        while (splitWord.length > maxLength) {
          lines.push(splitWord.substring(0, maxLength));
          splitWord = splitWord.substring(maxLength);
        }
        currentLine = splitWord;
      } else {
        currentLine = word;
      }
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Pads a string with spaces to ensure consistent column widths.
 * If the string is shorter than the desired length, it appends spaces.
 * If it's longer, it truncates the string.
 * @param {string} str - The string to pad.
 * @param {number} length - The desired length after padding.
 * @return {string} - The padded string.
 */
function padString(str, length) {
  if (str.length > length) {
    return str.substring(0, length);
  }
  return str + ' '.repeat(length - str.length);
}