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

    // Retrieve the 'ClassInfo' sheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("ClassInfo");
    if (!sheet) {
      throw new Error("ClassInfo sheet not found in the active spreadsheet.");
    }

    // Instantiate GoogleClassroomManager with necessary parameters
    this.classroomManager = new GoogleClassroomManager(sheet);

    // Attempt to instantiate UIManager only in user context to avoid issues with triggers
    try {
      this.uiManager = new UIManager(sheet);
      console.log("UIManager instantiated successfully.");
    } catch (error) {
      console.error("UIManager cannot be instantiated: " + error);
      this.uiManager = null; // UIManager is not available in this context
    }

    // Instantiate ConfigurationManager if needed
    this.configurationManager = new ConfigurationManager();
  }

  /** 
   * === UI Wrapper Methods ===
   */

  onOpen() {
    if (this.uiManager) {
      this.uiManager.addCustomMenus();
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
      this.uiManager.showAssignmentDropdown();
    } else {
      this.utils.toastMessage("Assignment dropdown cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to show assignment dropdown.");
    }
  }

  openReferenceSlideModal(assignmentData) {
    if (this.uiManager) {
      this.uiManager.openReferenceSlideModal(assignmentData);
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

  saveSlideIdsForAssignment(assignmentId, slideIds) {
    try {
      AssignmentPropertiesManager.saveSlideIdsForAssignment(assignmentId, slideIds);
      console.log(`Slide IDs saved for assignmentId: ${assignmentId}`);
    } catch (error) {
      this.progressTracker.logError(`Failed to save slide IDs for assignmentId ${assignmentId}: ${error.message}`);
      console.error(`Error in saveSlideIdsForAssignment: ${error}`);
      throw error;
    }
  }

  /** 
   * === Configuration Management ===
   */
  saveConfiguration(config) {
    try {
      // Delegate configuration saving to ConfigurationManager
      if (config.batchSize !== undefined) {
        this.configurationManager.setBatchSize(config.batchSize);
      }
      if (config.langflowApiKey !== undefined) {
        this.configurationManager.setLangflowApiKey(config.langflowApiKey);
      }
      if (config.langflowUrl !== undefined) {
        this.configurationManager.setLangflowUrl(config.langflowUrl);
      }
      if (config.imageFlowUid !== undefined) {
        this.configurationManager.setImageFlowUid(config.imageFlowUid);
      }

      // Handle Tweak IDs
      if (config.textAssessmentTweakId !== undefined) {
        this.configurationManager.setTextAssessmentTweakId(config.textAssessmentTweakId);
      }
      if (config.tableAssessmentTweakId !== undefined) {
        this.configurationManager.setTableAssessmentTweakId(config.tableAssessmentTweakId);
      }
      if (config.imageAssessmentTweakId !== undefined) {
        this.configurationManager.setImageAssessmentTweakId(config.imageAssessmentTweakId);
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
      const classrooms = this.classroomManager.getActiveClassrooms();
      console.log(`${classrooms.length} Google Classrooms fetched successfully.`);
      this.utils.toastMessage(`${classrooms.length} Google Classrooms fetched successfully.`, "Success", 5);
      // Below method was originally called but not defined, removing it or implementing it is needed.
      // For now, removing this call:
      // ClassroomSheetManager.populateClassInfoSheet(classrooms);
    } catch (error) {
      console.error("Error fetching Google Classrooms:", error);
      this.utils.toastMessage("Failed to fetch classrooms: " + error.message, "Error", 5);
      throw error;
    }
  }

  createGoogleClassrooms() {
    try {
      this.classroomManager.createClassroomsAndTemplates();
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

  setupAssessmentDocs() {
    try {
      // Similarly, `setupAssessmentDocuments` not defined. Needs to be implemented or removed.
      this.classroomManager.setupAssessmentDocuments(); 
      this.utils.toastMessage("Assessment documents set up successfully.", "Success", 5);
      console.log("Assessment documents set up successfully.");
    } catch (error) {
      console.error("Error setting up assessment documents:", error);
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
      this.saveSlideIdsForAssignment(assignmentId, slideIds);
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
      const analysisSheetManager = new AnalysisSheetManager(assignment);
      analysisSheetManager.createAnalysisSheet();
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
}

// Instantiate the MainController as a singleton
const mainController = new MainController();
