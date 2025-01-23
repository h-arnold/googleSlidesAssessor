// UIManager.gs

class UIManager {
  constructor(sheet) {
    this.ui = SpreadsheetApp.getUi();
    this.classroomManager = new GoogleClassroomManager(sheet);
  }

  /**
   * Adds custom menus to the Google Sheets UI when the spreadsheet is opened.
   */
  addCustomMenus() {
    const ui = this.ui;

    // Create the root menu
    const menu = ui.createMenu('Assessment Bot')
    .addItem('Analyse Cohorts', 'analyseCohorts')



    // Add a sub-menu for Google Classrooms operations
    const classroomsSubMenu = ui.createMenu('Google Classrooms')
      .addItem('Fetch Classrooms', 'handleFetchGoogleClassrooms')
      .addItem('Create Classrooms', 'handleCreateGoogleClassrooms')
      //.addItem('Update Classrooms', 'handleUpdateGoogleClassrooms'); // This didn't survive the refactor and will need to be re-implemented
      .addItem('Create Assessment Records', 'createAssessmentRecords')
    menu.addSubMenu(classroomsSubMenu);   


    // Add a sub-menu for Settings
    const settingsSubMenu = ui.createMenu('Settings')
      .addItem('Backend Settings', 'showConfigurationDialog')
      .addItem('Change Classroom', 'showClassroomDropdown');
    menu.addSubMenu(settingsSubMenu);



    // Add a sub-menu for Debug operations
    const debugSubMenu = ui.createMenu('Debug')
      .addItem('Assess Student Work', 'showAssignmentDropdown')
      .addItem('Check Progress', 'showProgressModal');
    menu.addSubMenu(debugSubMenu);

    // Add the menu to the UI
    menu.addToUi();
  }

  /**
   * Shows the configuration dialog modal.
   */
  showConfigurationDialog() {
    const html = HtmlService.createHtmlOutputFromFile('ui/ConfigurationDialog')
      .setWidth(500)
      .setHeight(600); // Adjust the size as needed

    this.ui.showModalDialog(html, 'Configure Script Properties');
    console.log('Configuration dialog displayed.');
  }

  /**
   * Shows a modal dialog with a dropdown of assignments to choose from.
   */
  showAssignmentDropdown() {
    try {
      const courseId = this.classroomManager.getCourseId();
      const assignments = this.classroomManager.getAssignments(courseId);
      const maxTitleLength = this.getMaxTitleLength(assignments);
      const modalWidth = Math.max(300, maxTitleLength * 10); // Minimum width 300px, approx 10px per character

      // Instead of embedded HTML, load the templated HTML file:
      const template = HtmlService.createTemplateFromFile('ui/AssignmentDropdown');
      template.assignments = assignments; // Pass data to the HTML template

      const htmlOutput = template.evaluate()
        .setWidth(modalWidth)
        .setHeight(250); // Adjust height as needed

      this.ui.showModalDialog(htmlOutput, 'Select Assignment');
      console.log('Assignment dropdown modal displayed.');
    } catch (error) {
      console.error('Error showing assignment dropdown:', error);
      Utils.toastMessage('Failed to load assignments: ' + error.message, 'Error', 5);
    }
  }

  /**
   * Gets the maximum length of assignment titles.
   *
   * @param {Object[]} assignments - The list of assignments.
   * @returns {number} The maximum length of assignment titles.
   */
  getMaxTitleLength(assignments) {
    let maxLength = 0;
    assignments.forEach(assignment => {
      if (assignment.title.length > maxLength) {
        maxLength = assignment.title.length;
      }
    });
    return maxLength;
  }

  /**
   * Opens a modal dialog to get the reference and empty slide IDs.
   *
   * @param {string} assignmentData - The assignment data (JSON string).
   */
  openReferenceSlideModal(assignmentData) {
    try {
      const assignmentDataObj = JSON.parse(assignmentData);
      const savedSlideIds = AssignmentPropertiesManager.getSlideIdsForAssignment(assignmentDataObj.name);

      // Load templated HTML file instead of a string
      const template = HtmlService.createTemplateFromFile('ui/SlideIdsModal');
      template.assignmentDataObj = assignmentDataObj;
      template.savedSlideIds = savedSlideIds;

      const htmlOutput = template.evaluate()
        .setWidth(400)
        .setHeight(350);

      this.ui.showModalDialog(htmlOutput, 'Enter Slide IDs');
      console.log('Reference slide IDs modal displayed.');
    } catch (error) {
      console.error('Error opening reference slide modal:', error);
      Utils.toastMessage('Failed to open slide IDs modal: ' + error.message, 'Error', 5);
    }
  }

  /**
   * Shows a modal dialog with a dropdown list of active Google Classroom courses.
   */
  showClassroomDropdown() {
    try {
      // Retrieve active classrooms using GoogleClassroomManager
      const classrooms = this.classroomManager.getActiveClassrooms();

      // Sort classrooms alphabetically by name
      classrooms.sort((a, b) => a.name.localeCompare(b.name));

      // Create a template from the HTML file and pass the classrooms data
      const htmlTemplate = HtmlService.createTemplateFromFile('ui/ClassroomDropdown');
      htmlTemplate.classrooms = classrooms; // Pass data to the template

      // Evaluate the template to HTML
      const htmlOutput = htmlTemplate.evaluate()
        .setWidth(500)
        .setHeight(300);

      // Display the modal dialog
      this.ui.showModalDialog(htmlOutput, 'Select Classroom');
      console.log('Classroom dropdown modal displayed.');
    } catch (error) {
      console.error('Error displaying classroom dropdown modal:', error);
      Utils.toastMessage('Failed to load classrooms: ' + error.message, 'Error', 5);
    }
  }

  /**
   * Opens the progress modal.
   */
  showProgressModal() {
    const html = HtmlService.createHtmlOutputFromFile('ui/ProgressModal')
      .setWidth(400)
      .setHeight(200);
    this.ui.showModalDialog(html, 'Progress');
    console.log('Progress modal displayed.');
  }

  /**
   * Retrieves the classroom data from the 'Classroom' sheet.
   * Returns an array of objects representing rows.
   */
  getClassroomData() {
    const sheet = this.classroomManager.sheet;
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return []; // No data rows
    }

    // Expected headers: Classroom ID, Name, Teacher 1, Teacher 2, Teacher 3, Teacher 4, Enrollment Code, createAssessmentRecord, Template File Id
    const result = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Safely read columns by index
      const classroomID = row[0];
      const name = row[1];
      const teacher1 = row[2];
      const teacher2 = row[3];
      const teacher3 = row[4];
      const teacher4 = row[5];
      const enrollmentCode = row[6];
      const createAssessmentRecord = row[7];
      const templateFileId = row[8];

      result.push({
        ClassroomID: classroomID,
        Name: name,
        Teacher1: teacher1,
        Teacher2: teacher2,
        Teacher3: teacher3,
        Teacher4: teacher4,
        EnrollmentCode: enrollmentCode,
        createAssessmentRecord: (createAssessmentRecord === true || createAssessmentRecord === 'true'),
        TemplateFileId: templateFileId
      });
    }

    return result;
  }

  /**
   * Saves the updated classroom data back to the 'Classroom' sheet.
   * @param {Object[]} rows - The updated rows of data.
   */
  saveClassroomData(rows) {
    const sheet = this.classroomManager.sheet;
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      throw new Error('No data to save to. The sheet is empty.');
    }

    // We assume the header row is fixed in the format:
    // Classroom ID | Name | Teacher 1 | Teacher 2 | Teacher 3 | Teacher 4 | Enrollment Code | createAssessmentRecord | Template File Id
    const headerMap = {
      'ClassroomID': 0,
      'Name': 1,
      'Teacher1': 2,
      'Teacher2': 3,
      'Teacher3': 4,
      'Teacher4': 5,
      'EnrollmentCode': 6,
      'createAssessmentRecord': 7,
      'TemplateFileId': 8
    };

    // Build a lookup map from ClassroomID to row index
    const idToRow = {};
    for (let i = 1; i < data.length; i++) {
      const classroomID = data[i][0];
      if (classroomID) {
        idToRow[classroomID.toString()] = i; // Store the row index in the data array
      }
    }

    // Update data array with new values
    rows.forEach(rowObj => {
      const rowIndex = idToRow[rowObj.ClassroomID];
      if (rowIndex === undefined) {
        // If ClassroomID not found, we skip or could throw an error
        console.warn(`ClassroomID ${rowObj.ClassroomID} not found in the sheet. Skipping update.`);
        return;
      }

      // Update only editable fields
      data[rowIndex][headerMap['Name']] = rowObj.Name;
      data[rowIndex][headerMap['Teacher1']] = rowObj.Teacher1;
      data[rowIndex][headerMap['Teacher2']] = rowObj.Teacher2;
      data[rowIndex][headerMap['Teacher3']] = rowObj.Teacher3;
      data[rowIndex][headerMap['Teacher4']] = rowObj.Teacher4;
      data[rowIndex][headerMap['EnrollmentCode']] = rowObj.EnrollmentCode;
      data[rowIndex][headerMap['createAssessmentRecord']] = rowObj.createAssessmentRecord === true;
      // TemplateFileId and ClassroomID remain unchanged
    });

    // Write updated data back to the sheet
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }

  /**
   * Shows a modal dialog for editing classroom data. 
   */
  showClassroomEditorModal() {
    const html = HtmlService.createHtmlOutputFromFile('ui/ClassroomEditorModal')
      .setWidth(900)
      .setHeight(600); // Adjust width and height as needed

    this.ui.showModalDialog(html, 'Edit Classrooms');
    console.log('Classroom editor modal displayed.');
  }
}
