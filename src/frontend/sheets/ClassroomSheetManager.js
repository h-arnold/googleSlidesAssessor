class GoogleClassroomManagerController {
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

        this.ClassroomSheetManager = new ClassroomSheetManager(classroomsSheet.getName());
    }

    copyTemplateForActiveCourses() {
        const courses = this.ClassroomSheetManager.getActiveCourses();
        const teacherEmails = this.ClassroomSheetManager.getTeacherEmails();
        const rowsToAppend = [];

        courses.forEach(course => {
            try {
                const copiedSheet = DriveManager.copyTemplateSheet(
                    this.templateSheetId,
                    this.destinationFolderId,
                    course.name
                );
                console.log(`Copied and renamed template sheet for course: ${course.name}`);

                rowsToAppend.push([copiedSheet.getId(), course.name, course.id]);
            } catch (error) {
                console.error(`Failed to copy template for course '${course.name}': ${error.message}`);
            }
        });

        if (rowsToAppend.length > 0) {
            this.ClassroomSheetManager.appendRows(rowsToAppend);
        }

        DriveManager.shareFolder(this.destinationFolderId, teacherEmails);
    }

    createGoogleClassrooms() {
        const courses = this.ClassroomSheetManager.getActiveCourses();
        const classroomsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Classrooms');
        const data = classroomsSheet.getDataRange().getValues();
        const rowsToUpdate = [];

        courses.forEach((course, index) => {
            const row = data[index + 1];
            const ownerId = row[2];
            const teacherEmails = row.slice(2, 6).filter(email => email && email.trim() !== '');

            if (!ownerId) {
                console.warn(`Owner email missing for course '${course.name}' at row ${index + 2}`);
                return;
            }

            try {
                const newCourse = ClassroomManager.createClassroom(course.name, ownerId, teacherEmails);
                rowsToUpdate.push([newCourse.id, '', '', '', '', '', newCourse.enrollmentCode || '']);
            } catch (error) {
                console.error(`Failed to create classroom for course '${course.name}': ${error.message}`);
            }
        });

        if (rowsToUpdate.length > 0) {
            this.ClassroomSheetManager.appendRows(rowsToUpdate);
        }
    }

    updateGoogleClassrooms() {
        const courses = this.ClassroomSheetManager.getActiveCourses();
        const classroomsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Classrooms');
        const data = classroomsSheet.getDataRange().getValues();
        const updateRequests = [];

        courses.forEach((course, index) => {
            const row = data[index + 1];
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
                updateRequests.push([courseId, newName, newOwnerId, ...newTeacherEmails]);
            } catch (error) {
                console.error(`Failed to update classroom '${newName}' (${courseId}): ${error.message}`);
            }
        });

        if (updateRequests.length > 0) {
            this.ClassroomSheetManager.writeData(updateRequests);
        }
    }

    fetchGoogleClassrooms() {
        try {
            const classrooms = ClassroomManager.fetchClassrooms();
            const headers = ['Classroom ID', 'Name', 'Teacher 1', 'Teacher 2', 'Teacher 3', 'Teacher 4', 'Enrollment Code'];
            const rows = classrooms.map(course => {
                const teachers = Classroom.Courses.Teachers.list(course.id).teachers || [];
                const teacherEmails = teachers.map(teacher => teacher.profile.emailAddress);
                return [
                    course.id || '',
                    course.name || '',
                    teacherEmails[0] || '',
                    teacherEmails[1] || '',
                    teacherEmails[2] || '',
                    teacherEmails[3] || '',
                    course.enrollmentCode || ''
                ];
            });

            this.ClassroomSheetManager.clearSheet();
            this.ClassroomSheetManager.writeHeaders(headers);
            this.ClassroomSheetManager.appendRows(rows);

            console.log('Classrooms fetched and written to sheet successfully.');
        } catch (error) {
            console.error(`Failed to fetch Google Classrooms: ${error.message}`);
        }
    }

    setupAssessmentDocs() {
        this.copyTemplateForActiveCourses();
    }
}
