// 0BaseSheetManager.gs
// Note - BaseSheetManager needs a leading 0 in the filename to ensure that you don't get a reference error as AnalysisSheetManager depends on it. It appears that Google App Script concatenates all the script files before execution so the order in which the files are shown matters.

/**
 * BaseSheetManager Class
 *
 * Provides common methods for sheet manipulation.
 */
class BaseSheetManager {
  constructor() {
    this.sheet = null;
    this.requests = [];
  }

  /**
   * Creates or retrieves a sheet with the given name.
   * @param {string} sheetName - The name of the sheet.
   * @param {string} [spreadsheetId] - Optional ID of the spreadsheet to create the sheet in.
   *                             If not provided, uses the active spreadsheet.
   */
  createOrGetSheet(sheetName, spreadsheetId) {
    let spreadsheet;
    if (spreadsheetId) {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    this.sheet = spreadsheet.getSheetByName(sheetName);

    if (!this.sheet) {
      this.sheet = spreadsheet.insertSheet(sheetName);
    } else {
      // Clear existing content and formatting
      // this.clearSheet() // temporarily removed as it broke the GoogleClassroomManager.createAssessmentRecord() method. This change may break other things. 
    }
  }

  /**
   * Clears the content and formatting of the sheet.
   */
  clearSheet() {
    this.sheet.clear();
    this.sheet.clearFormats();
    this.sheet.clearNotes();
    this.sheet.clearConditionalFormatRules();
  }

  /**
   * Ensures the sheet has enough columns to accommodate the data.
   * @param {number} requiredColumns - The number of columns required.
   */
  ensureSheetHasEnoughColumns(requiredColumns) {
    const sheetId = this.sheet.getSheetId();
    const currentColumns = this.sheet.getMaxColumns();
    if (currentColumns < requiredColumns) {
      this.requests.push({
        appendDimension: {
          sheetId: sheetId,
          dimension: "COLUMNS",
          length: requiredColumns - currentColumns
        }
      });
    }
  }

  /**
   * Creates a request to set header values in the sheet.
   * @param {number} sheetId - The ID of the sheet.
   * @param {Array<string>} headers - The header values to set.
   * @param {number} rowIndex - The row index to start setting the header values.
   * @return {Object} - A request to update cells with header values.
   */
  createHeaderValuesRequest(sheetId, headers, rowIndex) {
    return {
      updateCells: {
        rows: [
          {
            values: headers.map(header => ({ userEnteredValue: { stringValue: header } }))
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
   * @param {number} startRowIndex - The starting row index for formatting.
   * @param {number} endRowIndex - The ending row index for formatting.
   * @returns {Object} - A request to format header cells.
   */
  createHeaderFormattingRequest(sheetId, headerLength, startRowIndex = 0, endRowIndex = 2) {
    return {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: startRowIndex,
          endRowIndex: endRowIndex,
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
            },
            textRotation: {
              angle: 45
            }
          }
        },
        fields: "userEnteredFormat(backgroundColor, horizontalAlignment, verticalAlignment, textFormat, textRotation)"
      }
    };
  }

  /**
   * Creates requests to set column widths in the sheet.
   * @param {number} sheetId - The ID of the sheet.
   * @param {Array<number>} columnWidths - The widths of the columns to set.
   * @returns {Array<Object>} - An array of requests to update column widths.
   */
  createColumnWidthRequests(sheetId, columnWidths) {
    const requests = [];
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
   * Creates a request to freeze rows and columns in the sheet.
   * @param {number} sheetId - The ID of the sheet.
   * @param {number} frozenRowCount - The number of rows to freeze.
   * @param {number} frozenColumnCount - The number of columns to freeze.
   * @returns {Object} - A request to freeze rows and columns.
   */
  createFreezeRequest(sheetId, frozenRowCount = 2, frozenColumnCount = 1) {
    return {
      updateSheetProperties: {
        properties: {
          sheetId: sheetId,
          gridProperties: {
            frozenRowCount: frozenRowCount,
            frozenColumnCount: frozenColumnCount
          }
        },
        fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount'
      }
    };
  }

  /**
   * Executes all batchUpdate requests collected.
   * @param spreadsheetId {string} - Optional - the ID of the spreadsheet you'd like to perform the batch update on.
   */
  executeBatchUpdate(spreadsheetId) {
    if (this.requests.length === 0) {
      console.log("No batch requests to execute.");
      return;
    }

    if (!spreadsheetId) {
    spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    }

    try {
      Sheets.Spreadsheets.batchUpdate({ requests: this.requests }, spreadsheetId);
      console.log("Batch update executed successfully.");
      // Clear requests after successful execution
      this.requests = [];
    } catch (e) {
      console.error("Error executing batch update:", e);
      throw new Error(`Error applying batch update. ${e.message}`);
    }
  }
}
