/**
 * Manages Google Classroom operations and associated tasks.
 */
class GoogleClassroomManager {
    constructor(sheet, templateSheetId, destinationFolderId) {
        this.sheet = sheet;
        this.classrooms = [];
        this.templateSheetId = templateSheetId;
        this.destinationFolderId = destinationFolderId;
        this.progressTracker = ProgressTracker.getInstance();
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
     * Creates classrooms based on sheet data and copies templates.
     */
    createClassroomsAndTemplates() {
        const data = SpreadsheetHandler.getData(this.sheet);
        data.forEach((row, index) => {
            if (!row[0]) { // Only process rows without Classroom IDs
                try {
                    const classroom = new GoogleClassroom({
                        name: row[1],
                        ownerId: row[2],
                        teachers: row.slice(2, 6).filter(email => email) // Teacher emails
                    });
                    classroom.create();
                    this.progressTracker.logInfo(`Classroom created: ${row[1]}`);

                    // Copy template for the new classroom
                    const copiedSheetFile = DriveManager.copyTemplateSheet(
                        this.templateSheetId,
                        this.destinationFolderId,
                        classroom.name
                    );
                    SpreadsheetManager.appendClassInfoValues(
                        copiedSheetFile.getId(),
                        classroom.name,
                        classroom.id
                    );
                } catch (error) {
                    this.progressTracker.logError(`Failed to create classroom or template for row ${index + 1}: ${error.message}`);
                }
            }
        });

        // Share folder with all teacher emails
        const teacherEmails = SpreadsheetManager.getTeacherEmails(this.sheet);
        DriveManager.shareFolder(this.destinationFolderId, teacherEmails);
    }
}