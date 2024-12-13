/**
 * Manages Google Classroom operations and associated tasks.
 */
class GoogleClassroomManager {
    constructor(sheet) {
        this.sheet = sheet;
        this.classrooms = [];
        this.templateSheetId; //Get this via the configuration manager at some point
        this.destinationFolderId; //Get this via the configuration manager at some point
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
        const data = ClassroomSheetManager.getData(this.sheet);
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
                    ClassroomSheetManager.appendClassInfoValues(
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
        const teacherEmails = ClassroomSheetManager.getTeacherEmails(this.sheet);
        DriveManager.shareFolder(this.destinationFolderId, teacherEmails);
    }

    /**
     * Retrieves assignments for a given course.
     *
     * @param {string} courseId - The ID of the course.
     * @returns {Object[]} The list of assignments.
     */
    getAssignments(courseId) {
        try {
            const courseWork = Classroom.Courses.CourseWork.list(courseId);
            let assignments = [];

            if (courseWork.courseWork && courseWork.courseWork.length > 0) {
                assignments = courseWork.courseWork.map((assignment) => {
                    return {
                        id: assignment.id,
                        title: assignment.title,
                        updateTime: new Date(assignment.updateTime),
                    };
                });

                // Sort assignments by update time in descending order
                assignments.sort((a, b) => b.updateTime - a.updateTime);
            }

            console.log(
                `${assignments.length} assignments retrieved for courseId: ${courseId}`
            );
            return assignments;
        } catch (error) {
            console.error(
                `Error retrieving assignments for courseId ${courseId}: ${error}`
            );
            throw error;
        }
    }

    /**
     * Retrieves all active Google Classroom courses available to the user.
     *
     * @return {Object[]} An array of objects containing course IDs and names.
     */
    getActiveClassrooms() {
        try {
            let courses = [];
            let pageToken;
            do {
                const response = Classroom.Courses.list({
                    pageToken: pageToken,
                    courseStates: ['ACTIVE']
                });
                if (response.courses && response.courses.length > 0) {
                    const activeCourses = response.courses.map(course => ({
                        id: course.id,
                        name: course.name
                    }));
                    courses = courses.concat(activeCourses);
                }
                pageToken = response.nextPageToken;
            } while (pageToken);

            console.log(`${courses.length} active classrooms retrieved.`);
            return courses;
        } catch (error) {
            console.error('Error fetching active classrooms:', error);
            throw new Error('Failed to retrieve active classrooms. Please ensure that the Classroom API is enabled and you have the necessary permissions.');
        }
    }

    /**
     * Retrieves the course ID from the 'ClassInfo' sheet.
     *
     * @returns {string} The course ID.
     */
    getCourseId() {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = spreadsheet.getSheetByName("ClassInfo");
        if (!sheet) {
            console.error("ClassInfo sheet not found.");
            throw new Error("ClassInfo sheet not found.");
        }
        const courseId = sheet.getRange("B2").getValue();
        if (!courseId) {
            console.error("Course ID not found in ClassInfo sheet.");
            throw new Error("Course ID not found in ClassInfo sheet.");
        }
        return courseId.toString();
    }
}