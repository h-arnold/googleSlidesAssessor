// z_main.gs
// This file needs to be prefixed with a Z so that when clasp uploads the script files, this is the last one in the list. 
// Otherwise, you'll get lots of 'xx class is undefined' errors.

/**
 * ======== Assignment Management ========
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
function saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId) {
  mainController.saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId);
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
  mainController.processSelectedAssignment();
}

/**
 * Saves slide IDs for a specific assignment.
 *
 * @param {string} assignmentId - The ID of the assignment.
 * @param {Object} slideIds - An object containing referenceSlideId and emptySlideId.
 */
function saveSlideIdsForAssignment(assignmentId, slideIds) {
  mainController.saveSlideIdsForAssignment(assignmentId, slideIds);
}

/**
 * Opens the reference slide modal with assignment data.
 *
 * @param {string} assignmentData - The JSON string containing assignment data.
 */
function openReferenceSlideModal(assignmentData) {
  mainController.openReferenceSlideModal(assignmentData);
}

/**
 * ======== Modal and UI Management ========
 */

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
  mainController.showConfigurationDialog();
}

/**
 * Shows the assignment dropdown modal.
 */
function showAssignmentDropdown() {
  mainController.showAssignmentDropdown();
}

/**
 * Shows the classroom dropdown modal.
 */
function showClassroomDropdown() {
  mainController.showClassroomDropdown();
}

/**
 * ======== Configuration Management ========
 */

/**
 * Saves the provided configuration properties.
 * @param {Object} config - An object containing key-value pairs of configurations.
 */
function saveConfiguration(config) {
  try {
    // Delegate configuration saving to MainController
    mainController.saveConfiguration(config);
  } catch (error) {
    console.error("Error saving configuration:", error);
    mainController.utils.toastMessage("Failed to save configuration: " + error.message, "Error", 5);
    throw new Error("Failed to save configuration. Please check the inputs.");
  }
}

/**
 * ======== Classroom Management ========
 */

/**
 * Handler functions to bridge menu items to MainController methods.
 */

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
 * Updates existing Google Classrooms as needed.
 */
function handleUpdateGoogleClassrooms() {
  try {
    mainController.updateGoogleClassrooms();
  } catch (error) {
    console.error("Error updating Google Classrooms:", error);
    mainController.utils.toastMessage("Failed to update classrooms: " + error.message, "Error", 5);
  }
}

/**
 * Sets up assessment documents in Google Classrooms.
 */
function handleSetupAssessmentDocs() {
  try {
    mainController.setupAssessmentDocs();
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
  } catch (error) {
    console.error('Error saving classroom:', error);
    throw new Error('Failed to save classroom. Please try again.');
  }
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
 * ======== Utility Functions ========
 */

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
function onOpen() {
  mainController.onOpen();
}

/**
 * Test workflow function for debugging purposes.
 */
function testWorkflow() {
  mainController.testWorkflow();
}
