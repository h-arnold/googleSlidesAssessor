// Main.gs

// This file contains the global functions needed to for various GUI and Trigger based elements of the code to be executed.

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
 * Opens the progress modal dialog.
 */
function showProgressModal() {
  mainController.showProgressModal();
}

/**
 * Processes the selected assignment by retrieving parameters and executing the workflow.
 */
function triggerProcessSelectedAssignment() {
  mainController.processSelectedAssignment();
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
 * Adds custom menus when the spreadsheet is opened.
 */
function onOpen() {
  mainController.onOpen();
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
 * Opens the reference slide modal with assignment data.
 *
 * @param {string} assignmentData - The JSON string containing assignment data.
 */
function openReferenceSlideModal(assignmentData) {
  mainController.openReferenceSlideModal(assignmentData);
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
 * Retrieves the current progress status.
 *
 * @returns {Object} The current progress data.
 */
function requestStatus() {
  return mainController.requestStatus();
}

/**
 * Test workflow function for debugging purposes.
 */
function testWorkflow() {
  mainController.testWorkflow();
}
