// MainController.gs

/**
 * MainController Class
 *
 * Encapsulates global functions and coordinates various components.
 */
class MainController {
  constructor() {
    // Utils contains static utility methods
    this.utils = Utils;
    // Access the singleton instance of ProgressTracker
    this.progressTracker = ProgressTracker.getInstance();
    this.triggerController = new TriggerController();

    // Instantiate other components
    this.llmRequestManager = new LLMRequestManager();

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
   * === Ui Wrapper Methods ===
   * These methods call the various methods from other classes needed for the GUI elements of the script. Most of these are called from global functions in z_main.js
   */

  /**
   * Adds custom menus when the spreadsheet is opened.
   */
  onOpen() {
    this.uiManager.addCustomMenus();
  }

  /**
   * Shows the configuration dialog modal.
   */
  showConfigurationDialog() {
    this.uiManager.showConfigurationDialog();
  }

  /**
   * Shows the assignment dropdown modal.
   */
  showAssignmentDropdown() {
    this.uiManager.showAssignmentDropdown();
  }

  /**
   * Opens the reference slide modal with assignment data.
   *
   * @param {string} assignmentData - The JSON string containing assignment data.
   */
  openReferenceSlideModal(assignmentData) {
    this.uiManager.openReferenceSlideModal(assignmentData);
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
    return Utils.getAssignments(courseId);
  }

  /**
 * Saves slide IDs for a specific assignment.
 *
 * @param {string} assignmentId - The ID of the assignment.
 * @param {Object} slideIds - An object containing referenceSlideId and emptySlideId.
 */
  saveSlideIdsForAssignment(assignmentId, slideIds) {
    AssignmentPropertiesManager.saveSlideIdsForAssignment(assignmentId, slideIds);
    console.log(`Slide IDs saved for assignmentId: ${assignmentId}`);
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
    this.saveSlideIdsForAssignment(assignmentTitle, slideIds);
    const processId = this.startProcessing(assignmentId, referenceSlideId, emptySlideId);
    this.progressTracker.startTracking();
    this.showProgressModal();
  }

  /**
   * Initiates the processing of an assignment asynchronously by setting up a trigger.
   *
   * @param {string} assignmentId - The ID of the assignment.
   * @param {string} referenceSlideId - The ID of the reference slide.
   * @param {string} emptySlideId - The ID of the empty slide.
   * @returns {string} The unique process ID.
   */
  startProcessing(assignmentId, referenceSlideId, emptySlideId) {
    const properties = PropertiesService.getDocumentProperties();
    const processId = `process_${new Date().getTime()}`;

    properties.setProperty('assignmentId', assignmentId);
    properties.setProperty('referenceSlideId', referenceSlideId);
    properties.setProperty('emptySlideId', emptySlideId);
    properties.setProperty('processId', processId);

    console.log(`Starting processing with processId: ${processId}`);

    try {
      this.triggerController.createTimeBasedTrigger('triggerProcessSelectedAssignment', 1000); // 1 second delay
      console.log(`Trigger created for triggerProcessSelectedAssignment with processId: ${processId}`);
    } catch (error) {
      console.error(`Error creating trigger: ${error}`);
      throw error;
    }

    return processId;
  }

  /**
   * Opens the progress modal dialog.
   */
  showProgressModal() {
    this.uiManager.showProgressModal();
  }

  /**
   * Processes the selected assignment by retrieving parameters and executing the workflow.
   */
  processSelectedAssignment() {
    const lock = LockService.getDocumentLock();

    if (!lock.tryLock(5000)) {
      this.progressTracker.logError(`Script is already running. Please try again later.`);
      return;
    }

    try {
      const properties = PropertiesService.getDocumentProperties();
      const assignmentId = properties.getProperty('assignmentId');
      const referenceSlideId = properties.getProperty('referenceSlideId');
      const emptySlideId = properties.getProperty('emptySlideId');
      const processId = properties.getProperty('processId');
      let step = 1;

      if (!assignmentId || !referenceSlideId || !emptySlideId || !processId) {
        throw new Error("Missing parameters for processing.");
      }

      this.progressTracker.startTracking();
      this.progressTracker.updateProgress(step, "Assessment run starting.");

      const courseId = this.utils.getCourseId();
      this.progressTracker.updateProgress(++step, `Course ID retrieved: ${courseId}`);

      const assignment = new Assignment(courseId, assignmentId, referenceSlideId, emptySlideId);
      this.progressTracker.updateProgress(++step, "Assignment instance created.");

      const students = Student.fetchAllStudents(courseId);
      this.progressTracker.updateProgress(++step, `${students.length} students fetched.`);

      students.forEach(student => assignment.addStudent(student));
      this.progressTracker.updateProgress(null, "All students added to the assignment.");

      assignment.populateTasksFromSlides();
      assignment.fetchSubmittedSlides();
      assignment.processAllSubmissions();
      assignment.processImages();
      assignment.assessResponses();

      const analysisSheetManager = new AnalysisSheetManager(assignment);
      analysisSheetManager.createAnalysisSheet();

      const overviewSheetManager = new OverviewSheetManager();
      overviewSheetManager.createOverviewSheet();

      this.progressTracker.updateProgress(null, "Assessment run completed successfully.");
      this.progressTracker.complete();
    } catch (error) {
      this.progressTracker.logError(error.message);
      console.error("Error during assessment process:", error);
      this.utils.toastMessage("An error occurred: " + error.message, "Error", 3);
      throw error;
    } finally {
      lock.releaseLock();
      const properties = PropertiesService.getDocumentProperties();
      properties.deleteProperty('assignmentId');
      properties.deleteProperty('referenceSlideId');
      properties.deleteProperty('emptySlideId');
      properties.deleteProperty('processId');

      this.triggerController.removeTriggers('processSelectedAssignment');
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
