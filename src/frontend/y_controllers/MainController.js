// MainController.js

/**
 * MainController Class
 *
 * Encapsulates global functions and coordinates various components.
 */
class MainController {
  constructor() {
    // Retain Utils for general utility methods not related to Classroom
    this.utils = Utils;

    // Access the singleton instance of ProgressTracker
    this.progressTracker = ProgressTracker.getInstance();

    // Instantiate TriggerController
    this.triggerController = new TriggerController();

    // Instantiate other components
    this.llmRequestManager = new LLMRequestManager();

    // Instantiate GoogleClassroomManager with necessary parameters
    this.classroomManager = new GoogleClassroomManager();

    // Attempt to instantiate UIManager only in user context to avoid issues with triggers
    try {
      this.uiManager = new UIManager();
      console.log("UIManager instantiated successfully.");
    } catch (error) {
      console.error("UIManager cannot be instantiated: " + error);
      this.uiManager = null; // UIManager is not available in this context
    }

  }

  /** 
   * === UI Wrapper Methods ===
   */

  /**
   * Handles the open event of the Google Sheets document.
   * Adds custom menus to the UI when the document is opened.
   * @param {GoogleAppsScript.Events.Sheets.OnOpen} e - The event object passed when the document is opened
   * @throws {Error} Logs error if UIManager is not initialized
   */
  onOpen(e) {
    if (this.uiManager) {
      this.uiManager.addCustomMenus(e);
    } else {
      console.error("UIManager is not available to add custom menus.");
    }
  }

  showConfigurationDialog() {
    if (this.uiManager) {
      this.uiManager.showConfigurationDialog();
    } else {
      this.utils.toastMessage("Configuration dialog cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to show configuration dialog.");
    }
  }

  showAssignmentDropdown() {
    if (this.uiManager) {
      return this.uiManager.showAssignmentDropdown();
    } else {
      this.utils.toastMessage("Assignment dropdown cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to show assignment dropdown.");
    }
  }

  openReferenceSlideModal(assignmentData) {
    if (this.uiManager) {
      return this.uiManager.openReferenceSlideModal(assignmentData);
    } else {
      this.utils.toastMessage("Reference slide modal cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to open reference slide modal.");
    }
  }

  requestStatus() {
    return this.progressTracker.getStatus();
  }

  getAssignments(courseId) {
    try {
      return this.classroomManager.getAssignments(courseId);
    } catch (error) {
      this.utils.toastMessage("Failed to retrieve assignments: " + error.message, "Error", 5);
      console.error("Error in getAssignments:", error);
      return [];
    }
  }

  showClassroomDropdown() {
    if (this.uiManager) {
      this.uiManager.showClassroomDropdown();
    } else {
      this.utils.toastMessage("Classroom dropdown cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to show classroom dropdown.");
    }
  }

  saveSlideIdsForAssignment(assignmentTitle, slideIds) {
    try {
      AssignmentPropertiesManager.saveSlideIdsForAssignment(assignmentTitle, slideIds);
      console.log(`Slide IDs saved for assignmentTitle: ${assignmentTitle}`);
    } catch (error) {
      this.progressTracker.logError(`Failed to save slide IDs for assignmentTitle ${assignmentTitle}: ${error.message}`);
      console.error(`Error in saveSlideIdsForAssignment: ${error}`);
      throw error;
    }
  }

  getClasroomData() {
    if (this.uiManager) {
      return this.uiManager.getClassroomData();
    } else {
      this.utils.toastMessage('Failed to get classroom data', 'Error', 5);
      console.error("Failed to get classroom data");
    }
  }

  saveClasroomData(rows) {
    if (this.uiManager) {
      this.uiManager.saveClassroomData(rows);
    } else {
      this.utils.toastMessage('Failed to get classroom data', 'Error', 5);
      console.error("Failed to get classroom data");
    }
  }

  showClassroomEditorModal() {
    this.uiManager.showClassroomEditorModal();
  }

  showVersionSelector() {
    this.uiManager.showVersionSelector();
  }

  /**
   * === Configuration Management ===
   */
  saveConfiguration(config) {
    try {
      // Delegate configuration saving to ConfigurationManager
      if (config.batchSize !== undefined) {
        configurationManager.setBatchSize(config.batchSize);
      }
      if (config.langflowApiKey !== undefined) {
        configurationManager.setLangflowApiKey(config.langflowApiKey);
      }
      if (config.langflowUrl !== undefined) {
        configurationManager.setLangflowUrl(config.langflowUrl);
      }
      if (config.imageFlowUid !== undefined) {
        configurationManager.setImageFlowUid(config.imageFlowUid);
      }

      // Handle Tweak IDs
      if (config.textAssessmentTweakId !== undefined) {
        configurationManager.setTextAssessmentTweakId(config.textAssessmentTweakId);
      }
      if (config.tableAssessmentTweakId !== undefined) {
        configurationManager.setTableAssessmentTweakId(config.tableAssessmentTweakId);
      }
      if (config.imageAssessmentTweakId !== undefined) {
        configurationManager.setImageAssessmentTweakId(config.imageAssessmentTweakId);
      }

      // Handle Assessment Record values
      if (config.assessmentRecordTemplateId !== undefined) {
        configurationManager.setAssessmentRecordTemplateId(config.assessmentRecordTemplateId);
      }
      if (config.assessmentRecordDestinationFolder !== undefined) {
        configurationManager.setAssessmentRecordDestinationFolder(config.assessmentRecordDestinationFolder);
      }

      this.utils.toastMessage("Configuration saved successfully.", "Success", 5);
      console.log("Configuration saved successfully.");
    } catch (error) {
      console.error("Error saving configuration:", error);
      this.utils.toastMessage("Failed to save configuration: " + error.message, "Error", 5);
      throw new Error("Failed to save configuration. Please check the inputs.");
    }
  }


  /** 
   * === Classroom Management ===
   */

  fetchGoogleClassrooms() {
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let classroomSheet = spreadsheet.getSheetByName("Classrooms");

      // If 'Classroom' sheet doesn't exist, create it
      if (!classroomSheet) {
        classroomSheet = spreadsheet.insertSheet("Classrooms");
      }

      // Ensure that the GoogleClassroomManager uses the 'Classroom' sheet
      this.classroomManager.sheet = classroomSheet;

      // Now call the manager's fetchGoogleClassrooms method, which writes data to the sheet
      this.classroomManager.fetchGoogleClassrooms();

      this.utils.toastMessage("Google Classrooms fetched and written to 'Classroom' sheet successfully.", "Success", 5);
      console.log("Google Classrooms fetched successfully.");
    } catch (error) {
      console.error("Error fetching Google Classrooms:", error);
      this.utils.toastMessage("Failed to fetch classrooms: " + error.message, "Error", 5);
      throw error;
    }
  }


  createGoogleClassrooms() {
    try {
      this.classroomManager.createGoogleClassrooms();
      this.utils.toastMessage("Google Classrooms created successfully.", "Success", 5);
      console.log("Google Classrooms created successfully.");
    } catch (error) {
      console.error("Error creating Google Classrooms:", error);
      this.utils.toastMessage("Failed to create classrooms: " + error.message, "Error", 5);
      throw error;
    }
  }

  updateGoogleClassrooms() {
    try {
      // Assuming `updateClassrooms` was a method that might need to be implemented similarly to create.
      this.classroomManager.updateClassrooms(); // This method is not defined in the snippet, consider implementing.
      this.utils.toastMessage("Google Classrooms updated successfully.", "Success", 5);
      console.log("Google Classrooms updated successfully.");
    } catch (error) {
      console.error("Error updating Google Classrooms:", error);
      this.utils.toastMessage("Failed to update classrooms: " + error.message, "Error", 5);
      throw error;
    }
  }

  createAssessmentRecords() {
    try {
      // Start progress tracking
      this.progressTracker.startTracking();

      // Show the progress modal (if the UI is available)
      if (this.uiManager) {
        this.uiManager.showProgressModal();
      } else {
        console.warn("UIManager is not available; cannot show the progress modal.");
      }

      // Perform the actual record creation (in GoogleClassroomManager)
      this.classroomManager.createAssessmentRecords();

      // If everything went well, complete the progress
      this.progressTracker.complete();
      this.utils.toastMessage("Assessment documents set up successfully.", "Success", 5);
      console.log("Assessment documents set up successfully.");
    } catch (error) {
      // Log and display any errors
      console.error("Error setting up assessment documents:", error);
      this.progressTracker.logError(error.message);
      this.utils.toastMessage("Failed to set up assessment documents: " + error.message, "Error", 5);
      throw error;
    }
  }


  saveClassroom(courseName, courseId) {
    try {
      // Directly update ClassInfo sheet
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
      this.utils.toastMessage("Classroom saved successfully.", "Success", 5);
    } catch (error) {
      console.error("Error saving classroom:", error);
      this.utils.toastMessage("Failed to save classroom: " + error.message, "Error", 5);
      throw error;
    }
  }

  /** 
   * === Workflow Methods ===
   */

  saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId) {
    try {
      this.saveSlideIdsForAssignment(assignmentTitle, slideIds);
      this.startProcessing(assignmentId, referenceSlideId, emptySlideId);
      this.progressTracker.startTracking();
      this.showProgressModal();
    } catch (error) {
      this.utils.toastMessage("Failed to start processing: " + error.message, "Error", 5);
      console.error("Error in saveStartAndShowProgress:", error);
    }
  }

  startProcessing(assignmentId, referenceSlideId, emptySlideId) {
    const properties = PropertiesService.getDocumentProperties();
    let triggerId;

    try {
      triggerId = this.triggerController.createTimeBasedTrigger('triggerProcessSelectedAssignment', 1); // 1-minute delay
      console.log(`Trigger created for triggerProcessSelectedAssignment with triggerId: ${triggerId}`);
    } catch (error) {
      console.error(`Error creating trigger: ${error}`);
      this.utils.toastMessage("Failed to create trigger: " + error.message, "Error", 5);
      throw error;
    }

    try {
      properties.setProperty('assignmentId', assignmentId);
      properties.setProperty('referenceSlideId', referenceSlideId);
      properties.setProperty('emptySlideId', emptySlideId);
      properties.setProperty('triggerId', triggerId);
      console.log("Properties set for processing.");
    } catch (error) {
      console.error(`Error setting properties: ${error}`);
      this.utils.toastMessage("Failed to set processing properties: " + error.message, "Error", 5);
      throw error;
    }
  }

  showProgressModal() {
    if (this.uiManager) {
      this.uiManager.showProgressModal();
    } else {
      this.utils.toastMessage("Progress modal cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to show progress modal.");
    }
  }

  processSelectedAssignment() {
    const lock = LockService.getDocumentLock();

    if (!lock.tryLock(5000)) {
      this.progressTracker.logError(`Script is already running. Please try again later.`);
      this.utils.toastMessage("Another process is currently running. Please wait.", "Error", 5);
      return;
    }

    try {
      const properties = PropertiesService.getDocumentProperties();
      const assignmentId = properties.getProperty('assignmentId');
      const referenceSlideId = properties.getProperty('referenceSlideId');
      const emptySlideId = properties.getProperty('emptySlideId');
      const triggerId = properties.getProperty('triggerId');
      let step = 1;

      if (!assignmentId || !referenceSlideId || !emptySlideId || !triggerId) {
        this.triggerController.removeTriggers('triggerProcessSelectedAssignment');
        throw new Error("Missing parameters for processing.");
      }

      this.triggerController.deleteTriggerById(triggerId);
      console.log("Trigger deleted after processing.");

      this.progressTracker.startTracking();
      this.progressTracker.updateProgress(step++, "Assessment run starting.");

      const courseId = this.classroomManager.getCourseId();
      console.log('Course ID retrieved: ' + courseId);
      this.progressTracker.updateProgress(step++, `Course ID retrieved: ${courseId}`);

      this.progressTracker.updateProgress(step++, "Creating Assignment instance.");
      const assignment = new Assignment(courseId, assignmentId, referenceSlideId, emptySlideId);
      this.progressTracker.updateProgress(null, "Assignment instance created.");

      this.progressTracker.updateProgress(step++, "Fetching all students.");
      const students = Student.fetchAllStudents(courseId);
      this.progressTracker.updateProgress(null, `${students.length} students fetched.`);

      this.progressTracker.updateProgress(step++, "Adding students to the assignment.");
      students.forEach(student => assignment.addStudent(student));
      this.progressTracker.updateProgress(null, "All students added to the assignment.");

      this.progressTracker.updateProgress(step++, "Getting the tasks from the reference slides.");
      assignment.populateTasksFromSlides();
      this.progressTracker.updateProgress(null, "Tasks populated from reference slides.");

      this.progressTracker.updateProgress(step++, "Fetching submitted slides from students.");
      assignment.fetchSubmittedSlides();
      this.progressTracker.updateProgress(null, "Submitted slides fetched.");

      this.progressTracker.updateProgress(step++, "Extracting student work from slides.");
      assignment.processAllSubmissions();
      this.progressTracker.updateProgress(null, "All student work extracted.");

      this.progressTracker.updateProgress(step++, "Processing Images.");
      assignment.processImages();
      this.progressTracker.updateProgress(null, "Images uploaded.");

      this.progressTracker.updateProgress(step++, "Assessing student responses.");
      assignment.assessResponses();
      this.progressTracker.updateProgress(null, "Responses assessed.");

      this.progressTracker.updateProgress(step++, "Creating the analysis sheet.");
      const analysisSheet = new AnalysisSheetManager(assignment);
      analysisSheet.createAnalysisSheet();
      this.progressTracker.updateProgress(null, "Analysis sheet created.");

      this.progressTracker.updateProgress(step++, "Updating the overview sheet.");
      const overviewSheetManager = new OverviewSheetManager();
      overviewSheetManager.createOverviewSheet();
      this.progressTracker.updateProgress(null, "Overview sheet updated.");

      this.progressTracker.updateProgress(null, "Assessment run completed successfully.");
      this.progressTracker.complete();

      this.utils.toastMessage("Assessment run completed successfully.", "Success", 5);
      console.log("Assessment run completed successfully.");

    } catch (error) {
      this.progressTracker.logError(error.message);
      console.error("Error during assessment process:", error);
      this.utils.toastMessage("An error occurred: " + error.message, "Error", 5);
      throw error;
    } finally {
      lock.releaseLock();
      console.log("Lock released.");

      try {
        const properties = PropertiesService.getDocumentProperties();
        properties.deleteProperty('assignmentId');
        properties.deleteProperty('referenceSlideId');
        properties.deleteProperty('emptySlideId');
        properties.deleteProperty('triggerId');
        console.log("Document properties cleaned up.");
      } catch (cleanupError) {
        this.progressTracker.logError(`Failed to clean up properties: ${cleanupError.message}`);
        console.error(`Error during property cleanup: ${cleanupError}`);
      }
    }
  }

  testWorkflow() {
    this.processSelectedAssignment();
  }

  //*
  // === Cohort Analysis ===
  //*/

  /**
   * Analyses cohort data by extracting information from assessment records and creating summary sheets.
   * This method performs the following operations:
   * 1. Extracts data from 'Overview' sheets across all assessment records
   * 2. Creates aggregated sheets for each year group
   * 3. Generates a summary sheet with year group averages
   * 
   * @throws {Error} If any step in the analysis process fails
   * 
   */
  analyseCohorts() {
    let step = 0;

    try {
      // Start progress tracking
      this.progressTracker.startTracking();

      // Show the progress modal (if the UI is available)
      if (this.uiManager) {
        this.uiManager.showProgressModal();
      } else {
        console.warn("UIManager is not available; cannot show the progress modal.");
      }

      // Extract data from the 'Overview' sheet in each assessment record and aggregate into a JSON object
      this.progressTracker.updateProgress(step++, "Extracting data from all assessment records.");

      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const classroomsSheet = spreadsheet.getSheetByName('Classrooms');

      const sheetExtractor = new MultiSheetExtractor(classroomsSheet);
      const overviewData = sheetExtractor.processAllOverviewSheets();

      // Create aggregated sheets for each year group
      this.progressTracker.updateProgress(step++, "Creating year group sheets.");

      const cohortAnalysis = new CohortAnalysisSheetManager();
      cohortAnalysis.createYearGroupSheets(overviewData, spreadsheet.getId());

      // Create the 'Summary' sheet to display year group averages
      this.progressTracker.updateProgress(step++, "Creating the summary sheet.");

      const summarySheet = new SummarySheetManager();
      summarySheet.createSummarySheet(overviewData, spreadsheet.getId());

      // If everything went well, complete the progress
      this.progressTracker.complete();

      console.log("Cohort analysis completed successfully.");
    } catch (error) {
      // Log and display any errors
      console.error("Error during cohort analysis:", error);
      this.progressTracker.logError(error.message);
      throw error;
    }
  }
  /**
* Handles the version update request from the UI
* @param {Object} versionData - Contains version number and file IDs
*/
  updateAdminSheet(versionData) {
    let adminSheetUrl;
    console.log(JSON.stringify(versionData));
    
    try {
      const updateManager = new UpdateManager();
      updateManager.versionNo = versionData.version;
      updateManager.assessmentRecordTemplateId = versionData.assessmentRecordTemplateFileId;
      updateManager.adminSheetTemplateId = versionData.adminSheetFileId;
      console.log(JSON.stringify(versionData))

      adminSheetUrl = updateManager.updateAdminSheet();
    } catch (error) {
      console.error('Error in handleVersionUpdate:', error);
      throw new Error(`Update failed: ${error.message}`);
    }
    const ui = this.uiManager.ui
    ui.alert(`Update Successful`, `Your new Admin Sheet has opened and you can access it at: ${adminSheetUrl}. Please close this window.`, ui.ButtonSet.OK)
  }

   /**
   * Handles the authorisation flow when user clicks authorise. This method ensures that the authorised menu appears after the auth process has taken place.
   */
  handleAuthorisation() { 
    const scriptAppManager = new ScriptAppManager();
    const authResult = scriptAppManager.handleAuthFlow();
    const updateStage = configurationManager.getUpdateStage();

    // Checks if the update needs finishing.
    if (updateStage == 1) 
      {

      if (authResult.needsAuth) 
      {
      //Get the script authorised.
      this.uiManager.showAuthorisationModal(authResult.authUrl);
      }

      // Finish the update
      this.finishUpdate();

      //Create the regular authorised menu.
      this.uiManager.createAuthorisedMenu();

    } 
    else if (authResult.needsAuth) 
    {
      this.uiManager.showAuthorisationModal();

      //Update the menu after authorisation so that it give the user access to all functions without having to refresh the page.
      this.uiManager.createAuthorisedMenu();
    
    } 
    else 
    {
      this.uiManager.createAuthorisedMenu()
    }
  }

  finishUpdate() {
    const updateManager = new UpdateManager();
    updateManager.runAssessmentRecordUpdateWizard();
  }
}


