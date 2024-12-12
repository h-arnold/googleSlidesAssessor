// SpreadsheetManager.js
/**
 * Handles operations with Google Sheets.
 */
class SpreadsheetManager {
    /**
     * Initializes the SpreadsheetManager with a specific sheet.
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to manage.
     */
    constructor(sheet) {
        this.sheet = sheet;
    }

    /**
     * Retrieves all data from the sheet.
     * @returns {Array<Array>} The data in the sheet.
     */
    getData() {
        return this.sheet.getDataRange().getValues();
    }

    /**
     * Clears all data from the sheet.
     */
    clearSheet() {
        this.sheet.clear();
    }

    /**
     * Writes headers to the first row of the sheet.
     * @param {Array<string>} headers - The column headers.
     */
    writeHeaders(headers) {
        this.sheet.appendRow(headers);
    }

    /**
     * Appends a row to the sheet.
     * @param {Array} row - The row data.
     */
    appendRow(row) {
        this.sheet.appendRow(row);
    }

    /**
     * Appends class information to the 'ClassInfo' sheet in the specified spreadsheet.
     * @param {string} spreadsheetId - The ID of the spreadsheet.
     * @param {string} className - The name of the class.
     * @param {string} courseId - The ID of the course.
     */
    appendClassInfo(spreadsheetId, className, courseId) {
        try {
            const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
            const classInfoSheet = spreadsheet.getSheetByName('ClassInfo') || spreadsheet.insertSheet('ClassInfo');
            classInfoSheet.appendRow(['Class', className]);
            classInfoSheet.appendRow(['Course ID', courseId]);
            console.log('Appended class info values successfully.');
        } catch (error) {
            console.error(`Failed to append class info: ${error.message}`);
            throw error;
        }
    }

    /**
     * Extracts all unique teacher emails from the 'Active Courses' sheet.
     * Assumes teacher emails are in columns C to F (indexes 2 to 5).
     * @returns {Set<string>} A set of unique teacher emails.
     */
    getTeacherEmails() {
        const data = this.getData();
        const teacherEmails = new Set();
        for (let i = 1; i < data.length; i++) { // Start from row 2
            const row = data[i];
            for (let j = 2; j <= 5; j++) { // Columns C to F
                const email = row[j];
                if (email && email.trim() !== '') {
                    teacherEmails.add(email.trim());
                }
            }
        }
        return teacherEmails;
    }

    /**
     * Retrieves all active courses from the sheet.
     * Assumes course ID is in column A and course name is in column B.
     * @returns {Array<Object>} An array of course objects with id and name.
     */
    getActiveCourses() {
        const data = this.getData();
        const courses = [];
        for (let i = 1; i < data.length; i++) { // Start from row 2
            const row = data[i];
            const courseId = row[0];
            const courseName = row[1];
            if (courseId && courseName) {
                courses.push({ id: courseId, name: courseName });
            } else {
                console.warn(`Invalid course data at row ${i + 1}`);
            }
        }
        return courses;
    }
}
