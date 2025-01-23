// CohortAnalysisSheetManager.gs

/**
 * CohortAnalysisSheetManager
 *
 * Responsible for taking aggregated "overview" data
 * (such as from MultiSheetExtractor) and creating
 * Year Group tabs in the Master spreadsheet.
 */
class CohortAnalysisSheetManager extends BaseSheetManager {

    /**
     * Creates or updates a Year Group sheet for each year group
     * found in the given overviewData object.
     *
     * @param {Object} overviewData - The aggregated data from MultiSheetExtractor,
     *                                e.g. { "Year 7": { "7A1 Digital Tech": {...}}, ... }
     * @param {string} masterSpreadsheetId - The ID of the Master spreadsheet.
     */
    createYearGroupSheets(overviewData, masterSpreadsheetId) {
      // Iterate over each Year Group in overviewData
      for (const [yearGroup, classData] of Object.entries(overviewData)) {
        // 1. Transform the data to headers + rows
        const { headers, rows } = this._transformYearGroupData(yearGroup, classData);
  
        // 2. Create or get the sheet for this Year Group
        this.createOrGetSheet(`Y${yearGroup}`, masterSpreadsheetId);
  
        // 3. Clear the sheet - batch updates tend not to work if the sheet isn't clear initially
        this.clearSheet();
  
        // 4. Prepare the sheet for writing
        const sheetId = this.sheet.getSheetId();
  
        // Ensure we have enough columns for all headers
        this.ensureSheetHasEnoughColumns(headers.length);
  
        // 5. Create "set header values" request
        const headerValuesRequest = this.createHeaderValuesRequest(sheetId, headers, 0);
  
        // 6. Create "header formatting" request
        const headerFormattingRequest = this.createHeaderFormattingRequest(
          sheetId,
          headers.length,
          0,      // startRowIndex
          1       // endRowIndex (we're formatting just the first row)
        );
  
        // 7. Convert rows to batch update objects
        const rowData = rows.map(row => ({
          values: row.map(cell => ({ userEnteredValue: { stringValue: String(cell) } }))
        }));
        const appendRowsRequest = {
          appendCells: {
            sheetId: sheetId,
            rows: rowData,
            fields: 'userEnteredValue'
          }
        };
  
        // 8. (Optional) Freeze the top row and/or first column
        const freezeRequest = this.createFreezeRequest(sheetId, 1, 1);
  
        // 9. Add all requests to the queue
        this.requests.push(headerValuesRequest);
        this.requests.push(headerFormattingRequest);
        this.requests.push(appendRowsRequest);
        this.requests.push(freezeRequest);
  
        // 10. Execute batch update for this Year Group sheet
        this.executeBatchUpdate(masterSpreadsheetId);
  
        // (Optionally) apply more advanced conditional formatting afterwards,
        // e.g. highlight "N", color scales for numeric columns, etc.
        // this.applyAnalysisFormatting(sheetId, masterSpreadsheetId);
      }
    }
  
    /**
     * Private helper method that transforms a single year group’s
     * class-and-student object data into tabular format.
     *
     * @param {string} yearGroup - e.g. "Year 7"
     * @param {Object} classData - e.g. { "7A1 Digital Tech": { "Student A": {...}, ...}, ... }
     * @returns {{ headers: string[], rows: Array<Array<string>> }}
     */
    _transformYearGroupData(yearGroup, classData) {
      // 1. Find all sub-headers from the first (or all) classes
      //    e.g. "Score", "Grade", etc.
      const allHeaders = new Set();
      for (const singleClassObj of Object.values(classData)) {
        for (const studentData of Object.values(singleClassObj)) {
          Object.keys(studentData).forEach(key => allHeaders.add(key));
        }
      }
      // Convert the Set to an array
      const subHeaders = Array.from(allHeaders);
  
      // 2. Build final headers (e.g. "Student Name", "Class Name", then the sub-headers)
      const headers = ["Student Name", "Class Name", ...subHeaders];
  
      // 3. Build row data
      const rows = [];
      for (const [className, students] of Object.entries(classData)) {
        for (const [studentName, studentValues] of Object.entries(students)) {
          // For each sub-header, get the student value or default to ""
          const subHeaderValues = subHeaders.map(h => studentValues[h] ?? "");
          rows.push([
            studentName,
            className,
            ...subHeaderValues
          ]);
        }
      }
  
      return { headers, rows };
    }
  
    /**
     * (Optional) Example method to apply additional conditional formatting
     * or color scales for numeric columns, highlight "N", etc.
     * You can call this method after createYearGroupSheets or inline.
     *
     * @param {number} sheetId
     * @param {string} masterSpreadsheetId
     */
    applyAnalysisFormatting(sheetId, masterSpreadsheetId) {
      // Build your conditional formatting requests here,
      // or do .setConditionalFormatRules() on this.sheet directly.
      // e.g. this.sheet.setConditionalFormatRules([...]);
      //
      // If using batch requests, push them to this.requests:
      // this.requests.push( { ... } );
      //
      // Then execute:
      this.executeBatchUpdate(masterSpreadsheetId);
    }
  }
  
