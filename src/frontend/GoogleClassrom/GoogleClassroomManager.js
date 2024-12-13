/**
 * Manages Google Classroom operations and associated tasks.
 */
class GoogleClassroomManager {
  constructor(sheet) {
    this.configManager = configurationManager;
    this.sheet = sheet;
    this.classrooms = [];
    this.templateSheetId =  this.configManager.getAssessmentRecordTemplateId();
    this.destinationFolderId = this.configManager.getAssessmentRecordDestinationFolder();
    this.progressTracker = ProgressTracker.getInstance();
  }



  /**
   * Fetches Google Classrooms and writes their details to the provided sheet.
   * Ensures the `createAssessmentRecord` column exists and sets its default value to `FALSE`.
   */
  fetchGoogleClassrooms() {
    try {
      // Retrieve all active classrooms
      const classrooms = this.getActiveClassrooms();

      // Clear existing data
      this.sheet.clear();

      // Initialize ClassroomSheetManager for batch operations
      const csm = new ClassroomSheetManager(this.sheet.getName());

      // Set the headers
      const headers = [
        'Classroom ID',
        'Name',
        'Teacher 1',
        'Teacher 2',
        'Teacher 3',
        'Teacher 4',
        'Enrollment Code',
        'createAssessmentRecord'
      ];
      csm.writeHeaders(headers);

      // Prepare all rows in memory before appending
      const rows = classrooms.map(course => {
        // Fetch teachers for the course
        const teachers = Classroom.Courses.Teachers.list(course.id).teachers || [];
        const teacherEmails = teachers.map(teacher => teacher.profile.emailAddress);

        return [
          course.id || '',
          course.name || '',
          teacherEmails[0] || '',
          teacherEmails[1] || '',
          teacherEmails[2] || '',
          teacherEmails[3] || '',
          course.enrollmentCode || '',
          false // Default value for createAssessmentRecord
        ];
      });

      // Append all rows in one go using batch update
      csm.appendRows(rows);

      console.log('Classrooms fetched and written to sheet successfully with createAssessmentRecord column.');
    } catch (error) {
      console.error(`Failed to fetch Google Classrooms: ${error.message}`);
      throw error;
    }
  }

  /**
 * Creates Google Classrooms for rows missing a `Classroom ID`.
 * Ensures necessary values are stored in the sheet.
 */
  createGoogleClassrooms() {
    const data = ClassroomSheetManager.getData(this.sheet);

    // Ensure the `createAssessmentRecord` column exists
    let hasCreateAssessmentRecord = data[0].includes('createAssessmentRecord');
    if (!hasCreateAssessmentRecord) {
      this.sheet.getRange(1, data[0].length + 1).setValue('createAssessmentRecord');
      hasCreateAssessmentRecord = true;
    }

    // Process rows without Classroom IDs
    data.forEach((row, index) => {
      if (index === 0 || row[0]) return; // Skip header row and rows with existing Classroom IDs

      try {
        const classroom = new GoogleClassroom({
          name: row[1],
          ownerId: row[2],
          teachers: row.slice(2, 6).filter(email => email) // Teacher emails
        });
        classroom.create();
        this.progressTracker.logInfo(`Classroom created: ${row[1]}`);

        // Update Classroom ID in the sheet
        this.sheet.getRange(index + 1, 1).setValue(classroom.id);

        // Set default `createAssessmentRecord` to `FALSE`
        this.sheet.getRange(index + 1, row.length + 1).setValue(false);

      } catch (error) {
        this.progressTracker.logError(`Failed to create classroom for row ${index + 1}: ${error.message}`);
      }
    });

    console.log('Google Classrooms created successfully with createAssessmentRecord column updated.');
  }

  /**
 * Copies templates for classrooms flagged with `createAssessmentRecord` set to `TRUE`.
 * Updates the sheet with the copied template's Google Drive FileId.
 */
  createAssessmentRecords() {
    let data = this.sheet.getDataRange().getValues()

    // Check that there is some data to process.
    if (data.length[0] < 2) {
      const errorMessage = "`No classrooms in the classroom sheet. Please fetch or create them first.`"
      this.progressTracker.logError(errorMessage)
      throw new Error(errorMessage)
    }

    // Ensure the `Template FileId` column exists
    let hasTemplateFileId = data[0].includes('Template File Id');
    let increment = 0 // If the Template File Id column already exists no need to increment the index when adding the file IDs of the spreadsheet
    if (!hasTemplateFileId) {
      this.sheet.getRange(1, data[0].length + 1).setValue('Template File Id');
      increment = 1
      hasTemplateFileId = true;
    } 

    // Process rows with `createAssessmentRecord` set to `TRUE`
    data.forEach((row, index) => {
      if (index === 0 || row[data[0].indexOf('createAssessmentRecord')] !== true) return; // Skip header and rows not flagged

      try {
        const classroomName = row[1];
        const destinationFolderId = this.destinationFolderId;

        // Copy the template sheet to the destination folder
        const copiedSheetFile = DriveManager.copyTemplateSheet(
          this.templateSheetId,
          destinationFolderId,
          classroomName
        );

        // Update the `Template FileId` column in the sheet
        this.sheet.getRange(index + 1, data[0].length + increment).setValue(copiedSheetFile.getId());

        console.log(`Template copied and FileId stored for classroom: ${classroomName}`);
      } catch (error) {
        this.progressTracker.logError(`Failed to copy template for row ${index + 1}: ${error.message}`);
      }
    });

    console.log('Assessment records created successfully where flagged.');
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