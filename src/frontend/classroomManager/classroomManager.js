// Classroom Manager.gs

/**
 * Manages Google Classroom operations.
 */
class GoogleClassroomManager {
    /**
     * Constructor for GoogleClassroomManager.
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The active Google Sheet.
     */
    constructor(sheet) {
        this.sheet = sheet;
        this.classrooms = [];
        this.progressTracker = ProgressTracker.getInstance(); // User-facing error handling
    }

    /**
     * Fetches Google Classroom courses where the user is a teacher.
     * @return {Array<GoogleClassroom>} List of GoogleClassroom instances.
     */
    fetchClassrooms() {
        const courses = Classroom.Courses.list({ teacherId: 'me' }).courses || [];
        this.classrooms = courses.map(course => new GoogleClassroom(course));
        return this.classrooms;
    }

    /**
     * Creates classrooms from sheet data.
     */
    createClassroomsFromSheet() {
        const data = SpreadsheetHandler.getData(this.sheet);
        data.forEach((row, index) => {
            if (!row[0]) { // Skip rows with existing course IDs
                try {
                    const classroom = new GoogleClassroom({
                        name: row[1],
                        ownerId: row[2],
                        teachers: row.slice(2, 6).filter(email => email) // Collect teacher emails
                    });
                    classroom.create();
                    this.progressTracker.logInfo(`Created classroom: ${row[1]}`);
                } catch (error) {
                    this.progressTracker.logError(`Failed to create classroom for row ${index + 1}: ${error.message}`);
                }
            }
        });
    }

    /**
     * Updates classrooms from sheet data.
     */
    updateClassroomsFromSheet() {
        const data = SpreadsheetHandler.getData(this.sheet);
        data.forEach((row, index) => {
            if (row[0]) { // Only update rows with existing course IDs
                try {
                    const classroom = this.classrooms.find(c => c.id === row[0]);
                    if (classroom) {
                        classroom.update(row[1], row[2], row.slice(2, 6).filter(email => email));
                        this.progressTracker.logInfo(`Updated classroom: ${row[1]}`);
                    }
                } catch (error) {
                    this.progressTracker.logError(`Failed to update classroom for row ${index + 1}: ${error.message}`);
                }
            }
        });
    }

    /**
     * Writes Google Classroom data to the active sheet.
     */
    writeClassroomsToSheet() {
        SpreadsheetHandler.clearSheet(this.sheet);
        SpreadsheetHandler.writeHeaders(this.sheet, ['Classroom ID', 'Name', 'Teacher 1', 'Teacher 2', 'Teacher 3', 'Teacher 4', 'Enrollment Code']);
        this.classrooms.forEach(classroom => {
            SpreadsheetHandler.appendRow(this.sheet, classroom.toRow());
        });
    }
}


