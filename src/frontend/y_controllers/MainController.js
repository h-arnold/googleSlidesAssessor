// MainController.gs

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
   * These methods call the various methods from other classes needed for the GUI elements of the script. Most of these are called from global functions in z_main.gs
   */

  /**
   * Adds custom menus when the spreadsheet is opened.
   */
  onOpen() {
    if (this.uiManager) {
      this.uiManager.addCustomMenus();
    } else {
      console.error("UIManager is not available to add custom menus.");
    }
  }

  /**
   * Shows the configuration dialog modal.
   */
  showConfigurationDialog() {
    if (this.uiManager) {
      this.uiManager.showConfigurationDialog();
    } else {
      this.utils.toastMessage("Configuration dialog cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to show configuration dialog.");
    }
  }

  /**
   * Shows the assignment dropdown modal.
   */
  showAssignmentDropdown() {
    if (this.uiManager) {
      this.uiManager.showAssignmentDropdown();
    } else {
      this.utils.toastMessage("Assignment dropdown cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to show assignment dropdown.");
    }
  }

  /**
   * Opens the reference slide modal with assignment data.
   *
   * @param {string} assignmentData - The JSON string containing assignment data.
   */
  openReferenceSlideModal(assignmentData) {
    if (this.uiManager) {
      this.uiManager.openReferenceSlideModal(assignmentData);
    } else {
      this.utils.toastMessage("Reference slide modal cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to open reference slide modal.");
    }
  }

  /**
   * Retrieves the current progress status.
   *
   * @returns {Object} The current progress data.
   */
  requestStatus() {
    return this.progressTracker.getStatus();
  }

  /**
   * Retrieves assignments for a given course.
   *
   * @param {string} courseId - The ID of the course.
   * @returns {Array} List of assignments.
   */
  getAssignments(courseId) {
    try {
      return this.classroomManager.getAssignments(courseId);
    } catch (error) {
      this.utils.toastMessage("Failed to retrieve assignments: " + error.message, "Error", 5);
      console.error("Error in getAssignments:", error);
      return [];
    }
  }

  /**
   * Shows the Google Classroom Selection Dropdown
   */
  showClassroomDropdown() {
    if (this.uiManager) {
      this.uiManager.showClassroomDropdown();
    } else {
      this.utils.toastMessage("Classroom dropdown cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to show classroom dropdown.");
    }
  }

  /**
   * Saves slide IDs for a specific assignment.
   *
   * @param {string} assignmentId - The ID of the assignment.
   * @param {Object} slideIds - An object containing referenceSlideId and emptySlideId.
   */
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

  /**
   * Saves the provided configuration properties.
   * @param {Object} config - An object containing key-value pairs of configurations.
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

  /**
   * Fetches Google Classrooms and populates them as needed.
   */
  fetchGoogleClassrooms() {
    try {
      const classrooms = this.classroomManager.getActiveClassrooms();
      // Implement logic to handle fetched classrooms, e.g., populate a sheet or UI
      console.log(`${classrooms.length} Google Classrooms fetched successfully.`);
      this.utils.toastMessage(`${classrooms.length} Google Classrooms fetched successfully.`, "Success", 5);
      // Example: Populate 'ClassInfo' sheet with fetched classrooms
      ClassroomSheetManager.populateClassInfoSheet(classrooms);
    } catch (error) {
      console.error("Error fetching Google Classrooms:", error);
      this.utils.toastMessage("Failed to fetch classrooms: " + error.message, "Error", 5);
      throw error;
    }
  }

  /**
   * Creates Google Classrooms based on provided data.
   */
  createGoogleClassrooms() {
    try {
      // Implement the logic to create Google Classrooms
      this.classroomManager.createClassroomsAndTemplates();
      this.utils.toastMessage("Google Classrooms created successfully.", "Success", 5);
      console.log("Google Classrooms created successfully.");
    } catch (error) {
      console.error("Error creating Google Classrooms:", error);
      this.utils.toastMessage("Failed to create classrooms: " + error.message, "Error", 5);
      throw error;
    }
  }

  /**
   * Updates existing Google Classrooms as needed.
   */
  updateGoogleClassrooms() {
    try {
      // Implement the logic to update Google Classrooms
      this.classroomManager.updateClassrooms();
      this.utils.toastMessage("Google Classrooms updated successfully.", "Success", 5);
      console.log("Google Classrooms updated successfully.");
    } catch (error) {
      console.error("Error updating Google Classrooms:", error);
      this.utils.toastMessage("Failed to update classrooms: " + error.message, "Error", 5);
      throw error;
    }
  }

  /**
   * Sets up assessment documents in Google Classrooms.
   */
  setupAssessmentDocs() {
    try {
      // Implement the logic to set up assessment documents
      this.classroomManager.setupAssessmentDocuments();
      this.utils.toastMessage("Assessment documents set up successfully.", "Success", 5);
      console.log("Assessment documents set up successfully.");
    } catch (error) {
      console.error("Error setting up assessment documents:", error);
      this.utils.toastMessage("Failed to set up assessment documents: " + error.message, "Error", 5);
      throw error;
    }
  }

  /**
   * Saves the selected classroom's name and ID to the 'ClassInfo' sheet.
   *
   * @param {string} courseName - The name of the selected classroom.
   * @param {string} courseId - The ID of the selected classroom.
   */
  saveClassroom(courseName, courseId) {
    try {
      this.classroomManager.saveClassroomInfo(courseName, courseId);
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

  /**
   * Initiates the processing of an assignment asynchronously by setting up a trigger
   * and opens the progress modal.
   *
   * @param {string} assignmentTitle - The title of the assignment.
   * @param {Object} slideIds - An object containing referenceSlideId and emptySlideId.
   * @param {string} assignmentId - The ID of the assignment.
   * @param {string} referenceSlideId - The ID of the reference slide.
   * @param {string} emptySlideId - The ID of the empty slide.
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

  /**
   * Initiates the processing of an assignment asynchronously by setting up a trigger.
   *
   * @param {string} assignmentId - The ID of the assignment.
   * @param {string} referenceSlideId - The ID of the reference slide.
   * @param {string} emptySlideId - The ID of the empty slide.
   * @returns {void}
   */
  startProcessing(assignmentId, referenceSlideId, emptySlideId) {
    const properties = PropertiesService.getDocumentProperties();
    let triggerId;

    try {
      // Changed delay to 1 minute (60 seconds) for better reliability
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

  /**
   * Opens the progress modal dialog.
   */
  showProgressModal() {
    if (this.uiManager) {
      this.uiManager.showProgressModal();
    } else {
      this.utils.toastMessage("Progress modal cannot be displayed in this context.", "Error", 5);
      console.error("UIManager is not available to show progress modal.");
    }
  }

  /**
   * Processes the selected assignment by retrieving parameters and executing the workflow.
   */
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
        // Clean up triggers to prevent accumulation of disabled triggers
        this.triggerController.removeTriggers('triggerProcessSelectedAssignment');
        throw new Error("Missing parameters for processing.");
      }

      // Delete the trigger as it's no longer needed
      this.triggerController.deleteTriggerById(triggerId);
      console.log("Trigger deleted after processing.");

      // Initialize progress tracking
      this.progressTracker.startTracking();
      this.progressTracker.updateProgress(step++, "Assessment run starting.");
      // this.utils.toastMessage("Assessment run starting...");

      // Retrieve Course ID using GoogleClassroomManager
      const courseId = this.classroomManager.getCourseId();
      console.log('Course ID retrieved: ' + courseId);
      this.progressTracker.updateProgress(step++, `Course ID retrieved: ${courseId}`);

      // Create an Assignment instance
      this.progressTracker.updateProgress(step++, "Creating Assignment instance.");
      const assignment = new Assignment(courseId, assignmentId, referenceSlideId, emptySlideId);
      this.progressTracker.updateProgress(null, "Assignment instance created.");

      // Fetch all students and add them to the assignment
      this.progressTracker.updateProgress(step++, "Fetching all students.");
      const students = Student.fetchAllStudents(courseId);
      this.progressTracker.updateProgress(null, `${students.length} students fetched.`);

      this.progressTracker.updateProgress(step++, "Adding students to the assignment.");
      students.forEach(student => assignment.addStudent(student));
      this.progressTracker.updateProgress(null, "All students added to the assignment.");

      // Process the assignment
      this.progressTracker.updateProgress(step++, "Getting the tasks from the reference slides.");
      assignment.populateTasksFromSlides();
      this.progressTracker.updateProgress(null, "Tasks populated from reference slides.");

      this.progressTracker.updateProgress(step++, "Fetching submitted slides from students.");
      assignment.fetchSubmittedSlides();
      this.progressTracker.updateProgress(null, "Submitted slides fetched.");

      this.progressTracker.updateProgress(step++, "Extracting student work from slides.");
      assignment.processAllSubmissions();
      this.progressTracker.updateProgress(null, "All student work extracted.");

      // Process images
      this.progress_tracker.updateProgress(step++, "Processing Images.");
      assignment.processImages();
      this.progressTracker.updateProgress(null, "Images uploaded.");

      // Assess responses
      this.progress_tracker.updateProgress(step++, "Assessing student responses.");
      assignment.assessResponses();
      this.progress_tracker.updateProgress(null, "Responses assessed.");

      // Create the analysis sheet
      this.progress_tracker.updateProgress(step++, "Creating the analysis sheet.");
      const analysisSheetManager = new AnalysisSheetManager(assignment);
      analysisSheetManager.createAnalysisSheet();
      this.progress_tracker.updateProgress(null, "Analysis sheet created.");

      // Update the overview sheet
      this.progress_tracker.updateProgress(step++, "Updating the overview sheet.");
      const overviewSheetManager = new OverviewSheetManager();
      overviewSheetManager.createOverviewSheet();
      this.progress_tracker.updateProgress(null, "Overview sheet updated.");

      // Mark the task as complete
      this.progress_tracker.updateProgress(null, "Assessment run completed successfully.");
      this.progress_tracker.complete();

      this.utils.toastMessage("Assessment run completed successfully.", "Success", 5);
      console.log("Assessment run completed successfully.");

    } catch (error) {
      this.progress_tracker.logError(error.message);
      console.error("Error during assessment process:", error);
      this.utils.toastMessage("An error occurred: " + error.message, "Error", 5);
      throw error;
    } finally {
      lock.releaseLock();
      console.log("Lock released.");

      // Clean up document properties.
      try {
        const properties = PropertiesService.getDocumentProperties();
        properties.deleteProperty('assignmentId');
        properties.deleteProperty('referenceSlideId');
        properties.deleteProperty('emptySlideId');
        properties.deleteProperty('triggerId');
        console.log("Document properties cleaned up.");
      } catch (cleanupError) {
        this.progress_tracker.logError(`Failed to clean up properties: ${cleanupError.message}`);
        console.error(`Error during property cleanup: ${cleanupError}`);
      }
    }
  }

  /**
   * Test workflow function for debugging purposes.
   */
  testWorkflow() {
    this.processSelectedAssignment();
  }
}
// Instantiate the MainController as a singleton
const mainController = new MainController();
