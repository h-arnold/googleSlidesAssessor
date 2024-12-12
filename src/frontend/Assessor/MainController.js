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
    this.startProcessing(assignmentId, referenceSlideId, emptySlideId);
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
    let triggerId;

    try {
      triggerId = this.triggerController.createTimeBasedTrigger('triggerProcessSelectedAssignment', 1000); // 1 second delay
      console.log(`Trigger created for triggerProcessSelectedAssignment with triggerId: ${triggerId}`);
    } catch (error) {
      console.error(`Error creating trigger: ${error}`);
      throw error;
    }

    properties.setProperty('assignmentId', assignmentId);
    properties.setProperty('referenceSlideId', referenceSlideId);
    properties.setProperty('emptySlideId', emptySlideId);
    properties.setProperty('triggerId', triggerId);

    return;
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
      const triggerId = properties.getProperty('triggerId');
      let step = 1;

      if (!assignmentId || !referenceSlideId || !emptySlideId || !triggerId) {
        //Clean up triggers so that we don't end up filling our allocation with disabled triggers.
        this.triggerController.removeTriggers('triggerProcessSelectedAssignment');
        throw new Error("Missing parameters for processing.");
      }

      this.triggerController.deleteTriggerById(triggerId);

      // Initialize progress tracking
      this.progressTracker.startTracking();
      this.progressTracker.updateProgress(step, "Assessment run starting.");
      //this.utils.toastMessage("Assessment run starting...");

      const courseId = this.utils.getCourseId();
      console.log('Assignment Id: ' + assignmentId);
      this.progressTracker.updateProgress(++step, `Course ID retrieved: ${courseId}`);

      // Create an Assignment instance
      this.progressTracker.updateProgress(++step, "Creating Assignment instance.");
      const assignment = new Assignment(courseId, assignmentId, referenceSlideId, emptySlideId);
      this.progressTracker.updateProgress(null, "Assignment instance created.");

      // Fetch all students and add them to the assignment
      this.progressTracker.updateProgress(++step, "Fetching all students.");
      const students = Student.fetchAllStudents(courseId);
      this.progressTracker.updateProgress(null, `${students.length} students fetched.`);

      this.progressTracker.updateProgress(++step, "Adding students to the assignment.");
      students.forEach(student => assignment.addStudent(student));
      this.progressTracker.updateProgress(null, "All students added to the assignment.");

      // Process the assignment
      this.progressTracker.updateProgress(++step, "Getting the tasks from the reference slides.");
      assignment.populateTasksFromSlides();
      this.progressTracker.updateProgress(null, "Tasks populated from reference slides.");

      this.progressTracker.updateProgress(++step, "Fetching submitted slides from students.");
      assignment.fetchSubmittedSlides();
      this.progressTracker.updateProgress(null, "Submitted slides fetched.");

      this.progressTracker.updateProgress(++step, "Extracting student work from slides.");
      assignment.processAllSubmissions();
      this.progressTracker.updateProgress(null, "All student work extracted.");
      
      // Process images
      this.progressTracker.updateProgress(++step, "Processing Images");
      assignment.processImages();
      this.progressTracker.updateProgress(null, "Images uploaded.");


      // Assess responses
      this.progressTracker.updateProgress(++step, "Assessing student responses");
      assignment.assessResponses();
      this.progressTracker.updateProgress(null, "Responses assessed.");

      this.progressTracker.updateProgress(++step, "Processing and updating all the data.");
      // Create the analysis sheet
      const analysisSheetManager = new AnalysisSheetManager(assignment);
      analysisSheetManager.createAnalysisSheet();
      this.progressTracker.updateProgress(null, "Analysis sheet created.");

      this.progressTracker.updateProgress(++step, "Updating the overview sheet.");
      // Update the overview sheet
      const overviewSheetManager = new OverviewSheetManager();
      overviewSheetManager.createOverviewSheet();
      this.progressTracker.updateProgress(null, "Overview sheet updated.");

      // Mark the task as complete
      this.progressTracker.updateProgress(null, "Assessment run completed successfully.");
      this.progressTracker.complete();
      
    } catch (error) {
      this.progressTracker.logError(error.message);
      console.error("Error during assessment process:", error);
      this.utils.toastMessage("An error occurred: " + error.message, "Error", 3);
      throw error;
    } finally {
      lock.releaseLock();

      //Clean up document properties.
      
      const properties = PropertiesService.getDocumentProperties();
      properties.deleteProperty('assignmentId');
      properties.deleteProperty('referenceSlideId');
      properties.deleteProperty('emptySlideId');
      properties.deleteProperty('processId');

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
