/**
 * Handles operations with the Google Sheet.
 */
class SpreadsheetHandler {
    /**
     * Gets all data from the sheet.
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet.
     * @return {Array<Array>} The data in the sheet.
     */
    static getData(sheet) {
        return sheet.getDataRange().getValues();
    }

    /**
     * Clears all data in the sheet.
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet.
     */
    static clearSheet(sheet) {
        sheet.clear();
    }

    /**
     * Writes headers to the first row of the sheet.
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet.
     * @param {Array<string>} headers - The column headers.
     */
    static writeHeaders(sheet, headers) {
        sheet.appendRow(headers);
    }

    /**
     * Appends a row to the sheet.
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet.
     * @param {Array} row - The row data.
     */
    static appendRow(sheet, row) {
        sheet.appendRow(row);
    }
}
/**
 * Handles operations with the Google Sheet.
 */
class SpreadsheetHandler {
    /**
     * Gets all data from the sheet.
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet.
     * @return {Array<Array>} The data in the sheet.
     */
    static getData(sheet) {
        return sheet.getDataRange().getValues();
    }

    /**
     * Clears all data in the sheet.
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet.
     */
    static clearSheet(sheet) {
        sheet.clear();
    }

    /**
     * Writes headers to the first row of the sheet.
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet.
     * @param {Array<string>} headers - The column headers.
     */
    static writeHeaders(sheet, headers) {
        sheet.appendRow(headers);
    }

    /**
     * Appends a row to the sheet.
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet.
     * @param {Array} row - The row data.
     */
    static appendRow(sheet, row) {
        sheet.appendRow(row);
    }
}
