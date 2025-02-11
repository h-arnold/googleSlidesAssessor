// z_main.js
// Global functions that bind UI actions and triggers to MainController methods.

const mainController = new MainController();

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
function saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId) {
  return mainController.saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId);
}

/**
 * Initiates the processing of an assignment asynchronously by setting up a trigger.
 *
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} referenceSlideId - The ID of the reference slide.
 * @param {string} emptySlideId - The ID of the empty slide.
 * @returns {string} The unique process ID.
 */
function startProcessing(assignmentId, referenceSlideId, emptySlideId) {
  return mainController.startProcessing(assignmentId, referenceSlideId, emptySlideId);
}

/**
 * Processes the selected assignment by retrieving parameters and executing the workflow.
 */
function triggerProcessSelectedAssignment() {
  return mainController.processSelectedAssignment();
}

/**
 * Saves slide IDs for a specific assignment.
 *
 * @param {string} assignmentId - The ID of the assignment.
 * @param {Object} slideIds - An object containing referenceSlideId and emptySlideId.
 */
function saveSlideIdsForAssignment(assignmentId, slideIds) {
  return mainController.saveSlideIdsForAssignment(assignmentId, slideIds);
}

/**
 * Opens the reference slide modal with assignment data.
 *
 * @param {string} assignmentData - The JSON string containing assignment data.
 */
function openReferenceSlideModal(assignmentData) {
  return mainController.openReferenceSlideModal(assignmentData);
}

/**
 * Opens the progress modal dialog.
 */
function showProgressModal() {
  mainController.showProgressModal();
}

/**
 * Shows the configuration dialog modal.
 */
function showConfigurationDialog() {
  return mainController.showConfigurationDialog();
}

/**
 * Shows the assignment dropdown modal.
 */
function showAssignmentDropdown() {
  return mainController.showAssignmentDropdown();
}

/**
 * Shows the classroom dropdown modal.
 */
function showClassroomDropdown() {
  return mainController.showClassroomDropdown();
}

/**
 * Displays the version selector interface by delegating to the main controller.
 * @returns {void}
 * @public
 */
function showVersionSelector() {
  return mainController.showVersionSelector();
}

/**
 * Saves the provided configuration properties.
 * @param {Object} config - An object containing key-value pairs of configurations.
 */
function saveConfiguration(config) {
  try {
    mainController.saveConfiguration(config);
  } catch (error) {
    console.error("Error saving configuration:", error);
    mainController.utils.toastMessage("Failed to save configuration: " + error.message, "Error", 5);
    throw new Error("Failed to save configuration. Please check the inputs.");
  }
}

/**
 * Fetches Google Classrooms and populates them as needed.
 */
function handleFetchGoogleClassrooms() {
  try {
    mainController.fetchGoogleClassrooms();
  } catch (error) {
    console.error("Error fetching Google Classrooms:", error);
    mainController.utils.toastMessage("Failed to fetch classrooms: " + error.message, "Error", 5);
  }
}

/**
 * Creates Google Classrooms based on provided data.
 */
function handleCreateGoogleClassrooms() {
  try {
    mainController.createGoogleClassrooms();
  } catch (error) {
    console.error("Error creating Google Classrooms:", error);
    mainController.utils.toastMessage("Failed to create classrooms: " + error.message, "Error", 5);
  }
}

/**
 * Sets up assessment documents in Google Classrooms.
 */
function createAssessmentRecords() {
  try {
    mainController.createAssessmentRecords();
  } catch (error) {
    console.error("Error setting up assessment documents:", error);
    mainController.utils.toastMessage("Failed to set up assessment documents: " + error.message, "Error", 5);
  }
}

/**
 * Saves the selected classroom's name and ID to the 'ClassInfo' sheet.
 *
 * @param {string} courseName - The name of the selected classroom.
 * @param {string} courseId - The ID of the selected classroom.
 */
function saveClassroom(courseName, courseId) {
  try {
    mainController.saveClassroom(courseName, courseId);
  } catch (error) {
    console.error('Error saving classroom:', error);
    throw new Error('Failed to save classroom. Please try again.');
  }
}

function getClassroomData() {
  return mainController.getClasroomData();
}

function saveClassromData(rows) {
  mainController.saveClasroomData(rows)
}

function showClassroomEditorModal() {
  mainController.showClassroomEditorModal()
}
/**
 * Gets the Google Classroom assignments for a given class.
 * @param {string} courseId 
 * @returns {object}
 */
function getAssignments(courseId) {
  return mainController.getAssignments(courseId);
}

/**
 * Removes a specific trigger by function name.
 *
 * @param {string} functionName - The name of the function whose triggers are to be removed.
 */
function removeTrigger(functionName) {
  mainController.triggerController.removeTriggers(functionName);
}

/**
 * Retrieves the current progress status.
 *
 * @returns {Object} The current progress data.
 */
function requestStatus() {
  return mainController.requestStatus();
}

/**
 * Clears all cache keys from the script cache.
 */
function clearAllCacheKeys() {
  const cache = CacheService.getScriptCache();
  cache.removeAll(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
}

/**
 * Adds custom menus when the spreadsheet is opened.
 */
/**
 * Trigger function that runs when the Google Sheets document is opened.
 * Acts as an entry point wrapper for the main controller's onOpen functionality.
 * Used for initialisation and setting up the custom menus.
 * @param {Object} e - The event object passed by Google Apps Script runtime
 */
function onOpen(e) {
  mainController.onOpen(e);
}

/**
 * Starts the cohort analysis
 */

function analyseCohorts() {
  mainController.analyseCohorts();
}

/**
 * Global function to handle version updates.
 * @param {Object} versionData Object containing version and file IDs
 * @return {Object} Result of the update operation
 */
function handleVersionUpdate(versionData) {
    return mainController.updateAdminSheet(versionData);
}

/**
 * Test workflow function for debugging purposes.
 */
function testWorkflow() {
  mainController.testWorkflow();
}

function handleAuthorisation() {
  mainController.handleAuthorisation();
}

function revokeAuthorisation() {
  const sa = new ScriptAppManager()
  sa.revokeAuthorisation();
}

/**
 * Global function to launch the Update Assessment Records Wizard.
 * Google Apps Script cannot call class methods directly so this function creates an instance
 * of UpdateManager and then calls the runAssessmentRecordUpdateWizard method.
 */
function showUpdateAssessmentRecordWizard() {
  const updateManager = new UpdateManager();
  updateManager.runAssessmentRecordUpdateWizard();
}

/**
 * Global function called from the wizard when the user clicks "Finish".
 * This creates a new UpdateManager instance, loads the saved state, and then calls its updateAssessmentRecords method.
 */
function updateAssessmentRecordsFromWizard() {
  const updateManager = new UpdateManager();
  updateManager.loadState();
  updateManager.updateAssessmentRecords();
}