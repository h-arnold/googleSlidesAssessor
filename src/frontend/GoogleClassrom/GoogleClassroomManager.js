/**
 * Manages Google Classroom operations and associated tasks.
 */
class GoogleClassroomManager {
  constructor(sheet) {
    this.configManager = configurationManager;
    this.sheet = sheet;
    this.classrooms = [];
    this.templateSheetId = this.configManager.getAssessmentRecordTemplateId();
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
   * Adds "Year Group" and "Spreadsheet ID" columns (if missing) in one final batch update,
   * and updates the progress after each successfully copied template.
   * Finally, shares the destination folder with all teacher emails found in the sheet.
   */
  createAssessmentRecords() {

    // 0) Initialise progress tracker
    
    let step = 0 //initialise step variable for the Progress Tracker
    this.progressTracker.updateProgress(step, 'Creating Assessment Records');

    // 1) Retrieve all rows
    const data = this.sheet.getDataRange().getValues();


    // 2) Quick check that there's something to process
    if (data.length < 2) {
      const errorMessage = "`No classrooms in the classroom sheet. Please fetch or create them first.`";
      this.progressTracker.logError(errorMessage);
      throw new Error(errorMessage);
    }

    // 3) Identify the header row and find createAssessmentRecord column
    const headers = data[0];
    const createARIndex = headers.indexOf('createAssessmentRecord');
    if (createARIndex === -1) {
      const errorMessage = "No 'createAssessmentRecord' column found. Please ensure it exists.";
      this.progressTracker.logError(errorMessage);
      throw new Error(errorMessage);
    }

    // 4) Check if 'Template File Id' column exists
    let templateFileIdIndex = headers.indexOf('Template File Id');
    if (templateFileIdIndex === -1) {
      templateFileIdIndex = headers.length; // Add it to the end
      headers.push('Template File Id');
    }

    // 5) Check if 'Year Group' column exists
    let yearGroupIndex = headers.indexOf('Year Group');
    if (yearGroupIndex === -1) {
      yearGroupIndex = headers.length;
      headers.push('Year Group');
    }

    // 6) We'll store row updates in memory for a final single batch update
    //    rowUpdates = array of { rowIndex, templateFileIdValue, spreadsheetIdValue }
    const rowUpdates = [];

    // 6a) We'll also gather teacher emails from columns "Teacher 1" through "Teacher 4"
    //     (which are columns 2..5 if the header is [Classroom ID (0), Name (1), Teacher 1 (2) ...])
    //     Adjust indices if your sheet differs.
    const teacherEmailsSet = new Set();

    // 7) Loop over all data rows and copy the template if createAssessmentRecord = true
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Collect any teacher emails from columns 2..5
      for (let col = 2; col <= 5; col++) {
        if (row[col] && row[col].trim()) {
          teacherEmailsSet.add(row[col].trim());
        }
      }

      if (row[createARIndex] === true) {
        try {
          const classroomName = row[1]; // e.g., course name in column B
          // Copy the template using the updated DriveManager
          const copyResult = DriveManager.copyTemplateSheet(
            this.templateSheetId,
            this.destinationFolderId,
            classroomName
          );

          if (copyResult.status === 'copied') {
            const newFileId = copyResult.fileId; // definitely not null in 'copied' case
            // We'll store the new file's ID in both 'Template File Id' and 'Spreadsheet ID'
            // so we can apply them all together in a single batch update at the end.
            rowUpdates.push({
              rowIndex: i, // 0-based index in `data`
              templateFileIdValue: newFileId
            });

            // Update progress each time we successfully copy a template
            this.progressTracker.updateProgress(
              ++step,  
              `Created assessment record for: ${classroomName}`
            );
          } else if (copyResult.status === 'skipped') {
            console.log(copyResult.message);
            // Push the existing file ID to the readpsheet instead
            const existingFiledId = copyResult.fileId
            rowUpdates.push({
              rowIndex: i, // 0-based index in `data`
              templateFileIdValue: existingFiledId
            });

            this.progressTracker.updateProgress(
              ++step,
              `Skipping record for: ${classroomName} (already exists)`
            );
          }
        } catch (error) {
          const errMsg = `Failed to copy template for row ${i + 1}: ${error.message}`;
          this.progressTracker.logError(errMsg);
          console.error(errMsg);
        }
      }
    }

    // 8) Build our final batch requests array
    const requests = [];
    const sheetId = this.sheet.getSheetId();
    const spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();

    // 8a) Potentially add columns if needed
    const neededColumns = headers.length;
    const currentColumns = this.sheet.getMaxColumns();
    if (neededColumns > currentColumns) {
      requests.push({
        appendDimension: {
          sheetId,
          dimension: "COLUMNS",
          length: neededColumns - currentColumns
        }
      });
    }

    // 8b) Update the entire header row with the new headers
    const headerCells = headers.map(header => ({
      userEnteredValue: { stringValue: header }
    }));
    requests.push({
      updateCells: {
        rows: [{ values: headerCells }],
        fields: "userEnteredValue",
        start: { sheetId, rowIndex: 0, columnIndex: 0 }
      }
    });

    // 9) Update each row's 'Template File Id' (and optionally 'Spreadsheet ID') columns
    rowUpdates.forEach(({ rowIndex, templateFileIdValue, spreadsheetIdValue }) => {
      requests.push({
        updateCells: {
          rows: [{
            values: [{
              userEnteredValue: { stringValue: templateFileIdValue }
            }]
          }],
          fields: "userEnteredValue",
          start: {
            sheetId,
            rowIndex, // 0-based row in the API
            columnIndex: templateFileIdIndex
          }
        }
      });
    });

    // 10) Execute one final batchUpdate to apply new columns, headers, and row cell changes
    if (requests.length > 0) {
      Sheets.Spreadsheets.batchUpdate({ requests }, spreadsheetId);
      console.log("Batch update executed successfully for assessment records.");
    } else {
      console.log("No batch updates were needed (no new columns or flagged rows).");
    }

    console.log("Assessment records created successfully where flagged.");

    // 11) Finally, share the folder with all teacher emails
    // (assuming your DriveManager has the updated shareFolder method)
    if (teacherEmailsSet.size > 0) {
      try {
        const shareResult = DriveManager.shareFolder(this.destinationFolderId, teacherEmailsSet);
        // Use the shareResult status to update progress or log a message
        if (shareResult.status === 'complete') {
          this.progressTracker.updateProgress(++step, 
            `Folder shared with all ${teacherEmailsSet.size} teacher(s) successfully.`
          );
        } else if (shareResult.status === 'partial') {
          this.progressTracker.updateProgress(null, 
            `Some teachers shared, some failed. Check logs.`
          );
        } else if (shareResult.status === 'none') {
          this.progressTracker.updateProgress(null, 
            `No teacher emails provided; folder sharing skipped.`
          );
        }
        console.log(shareResult.message);
      } catch (error) {
        // If we throw on an error (folder not found, etc.)
        this.progressTracker.logError(`Failed to share folder: ${error.message}`);
        console.error(`Failed to share folder: ${error.message}`);
      }
    } else {
      console.log('No teacher emails were found. Folder not shared with anyone.');
    }
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