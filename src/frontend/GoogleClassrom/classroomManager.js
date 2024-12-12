/**
 * Saves the selected classroom's name and ID to the 'ClassInfo' sheet.
 *
 * @param {string} courseName - The name of the selected classroom.
 * @param {string} courseId - The ID of the selected classroom.
 */
function saveClassroom(courseName, courseId) {
    try {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = spreadsheet.getSheetByName('ClassInfo');

        // If 'ClassInfo' sheet doesn't exist, create it
        if (!sheet) {
            sheet = spreadsheet.insertSheet('ClassInfo');
        }

        // Set headers in A1 and B1
        sheet.getRange('A1').setValue('Class Name');
        sheet.getRange('A2').setValue('Course ID');

        // Write the selected classroom's name and ID to A2 and B2
        sheet.getRange('B1').setValue(courseName);
        sheet.getRange('B2').setValue(courseId);

        console.log(`Classroom saved: ${courseName} (${courseId})`);
    } catch (error) {
        console.error('Error saving classroom:', error);
        throw new Error('Failed to save classroom. Please try again.');
    }
}