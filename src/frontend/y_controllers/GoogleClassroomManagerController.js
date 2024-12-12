// GoogleClassroomManagerController.js
/**
 * Coordinates operations between DriveManager, SpreadsheetManager, and ClassroomManager.
 */
class GoogleClassroomManagerController {
    /**
     * Initializes the GoogleClassroomManagerController with necessary configurations.
     * @param {string} templateSheetId - The ID of the template Google Sheet.
     * @param {string} destinationFolderId - The ID of the destination folder.
     */
    constructor(templateSheetId, destinationFolderId) {
        this.templateSheetId = templateSheetId;
        this.destinationFolderId = destinationFolderId;
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let classroomsSheet = spreadsheet.getSheetByName('Classrooms');

        if (!classroomsSheet) {
            console.log('Classrooms sheet not found. Creating a new one.');
            classroomsSheet = spreadsheet.insertSheet('Classrooms');
            classroomsSheet.appendRow(['Classroom ID', 'Name', 'Teacher 1', 'Teacher 2', 'Teacher 3', 'Teacher 4', 'Enrollment Code']);
        }

        this.spreadsheetManager = new SpreadsheetManager(classroomsSheet);
    }

    /**
     * Copies the template sheet for all active courses and shares the destination folder with teachers.
     */
    copyTemplateForActiveCourses() {
        const courses = this.spreadsheetManager.getActiveCourses();
        const teacherEmails = this.spreadsheetManager.getTeacherEmails();

        courses.forEach(course => {
            try {
                const copiedSheet = DriveManager.copyTemplateSheet(
                    this.templateSheetId,
                    this.destinationFolderId,
                    course.name
                );
                console.log(`Copied and renamed template sheet for course: ${course.name}`);

                // Append class info to the copied sheet
                this.spreadsheetManager.appendClassInfo(copiedSheet.getId(), course.name, course.id);
            } catch (error) {
                console.error(`Failed to copy template for course '${course.name}': ${error.message}`);
            }
        });

        // Share the destination folder with all teachers
        DriveManager.shareFolder(this.destinationFolderId, teacherEmails);
    }

    /**
     * Creates Google Classrooms based on active courses in the sheet.
     */
    createGoogleClassrooms() {
        const courses = this.spreadsheetManager.getActiveCourses();
        const classroomsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Classrooms');
        const data = classroomsSheet.getDataRange().getValues();

        courses.forEach((course, index) => {
            const row = data[index + 1]; // Adjust for header row
            const ownerId = row[2]; // Assuming Owner email is in column C (index 2)
            const teacherEmails = row.slice(2, 6).filter(email => email && email.trim() !== '');
            if (!ownerId) {
                console.warn(`Owner email missing for course '${course.name}' at row ${index + 2}`);
                return;
            }

            try {
                const newCourse = ClassroomManager.createClassroom(course.name, ownerId, teacherEmails);
                // Update sheet with new course ID and enrollment code
                classroomsSheet.getRange(index + 2, 1).setValue(newCourse.id); // Column A
                classroomsSheet.getRange(index + 2, 7).setValue(newCourse.enrollmentCode || ''); // Column G
            } catch (error) {
                console.error(`Failed to create classroom for course '${course.name}': ${error.message}`);
            }
        });
    }

    /**
     * Updates existing Google Classrooms based on data in the sheet.
     */
    updateGoogleClassrooms() {
        const courses = this.spreadsheetManager.getActiveCourses();
        const classroomsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Classrooms');
        const data = classroomsSheet.getDataRange().getValues();

        courses.forEach((course, index) => {
            const row = data[index + 1]; // Adjust for header row
            const courseId = row[0];
            const newName = row[1];
            const newOwnerId = row[2];
            const newTeacherEmails = row.slice(2, 6).filter(email => email && email.trim() !== '');

            if (!courseId) {
                console.warn(`Course ID missing for course '${newName}' at row ${index + 2}`);
                return;
            }

            try {
                ClassroomManager.updateClassroom(courseId, newName, newOwnerId, newTeacherEmails);
            } catch (error) {
                console.error(`Failed to update classroom '${newName}' (${courseId}): ${error.message}`);
            }
        });
    }

    /**
     * Fetches Google Classrooms and writes their details to the sheet.
     */
    fetchGoogleClassrooms() {
        try {
            const classrooms = ClassroomManager.fetchClassrooms();
            const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
            const sheet = spreadsheet.getSheetByName('Classrooms') || spreadsheet.getActiveSheet();

            // Clear existing data and set headers
            sheet.clear();
            const headers = ['Classroom ID', 'Name', 'Teacher 1', 'Teacher 2', 'Teacher 3', 'Teacher 4', 'Enrollment Code'];
            sheet.appendRow(headers);

            // Populate sheet with classroom data
            classrooms.forEach(course => {
                const teachers = Classroom.Courses.Teachers.list(course.id).teachers || [];
                const teacherEmails = teachers.map(teacher => teacher.profile.emailAddress);
                const row = [
                    course.id || '',
                    course.name || '',
                    teacherEmails[0] || '',
                    teacherEmails[1] || '',
                    teacherEmails[2] || '',
                    teacherEmails[3] || '',
                    course.enrollmentCode || ''
                ];
                sheet.appendRow(row);
            });

            console.log('Classrooms fetched and written to sheet successfully.');
        } catch (error) {
            console.error(`Failed to fetch Google Classrooms: ${error.message}`);
        }
    }

    /**
     * Sets up assessment documents for active courses by copying templates.
     */
    setupAssessmentDocs() {
        this.copyTemplateForActiveCourses();
    }
}
