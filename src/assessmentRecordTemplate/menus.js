function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Assessment Bot')
    .addItem('Assess Assignment', 'assessAssignment')
    .addItem('Check Progress', 'showProgressModal')
    .addItem('Change Class', 'showClassroomDropdown')
    .addToUi();
}

//Placeholder functions which call the library functions as the modal dialogue boxes can only execute functions in this script.

function assessAssignment() {
  return AIAssess.showAssignmentDropdown();
}

function createAssignmentDropdownHtml(assignments) {
  return AIAssess.createAssignmentDropdownHtml(assignments);
}

function openReferenceSlideModal(assignmentId) {
  return AIAssess.openReferenceSlideModal(assignmentId)
}

function getAssignments(courseId) {
  return AIAssess.getAssignments(courseId)
}

function createReferenceSlideModalHtml(assignmentId, referenceSlideId) {
  return AIAssess.createReferenceSlideModalHtml(assignmentId, referenceSlideId) 
}

function processSelectedAssignment(assignmentId, referenceSlideId, emptySlideId) {
  return AIAssess.processSelectedAssignment(assignmentId, referenceSlideId, emptySlideId)
}

// Place holder code for classroom changing menu option
function showClassroomDropdown() {
  AI.Assess.showClassroomDropdown();
}

function saveClassroom(courseName, courseId) {
  AIAssess.saveClassroom(courseName, courseId)
}


function requestStatus() {
  return AIAssess.requestStatus();
}

function removeTrigger(functionName){
  AIAssess.removeTrigger(functionName);

}

function triggerProcessSelectedAssignment() {
  AIAssess.triggerProcessSelectedAssignment();
}

/**
 * Opens the progress modal dialog.
 */
function showProgressModal() {
  AIAssess.showProgressModal();
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
  return AIAssess.startProcessing(assignmentId, referenceSlideId, emptySlideId);
}

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
  AIAssess.saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId);
}

function saveSlideIdsForAssignment(assignmentId, slideIds) {
  return AIAssess.saveSlideIdsForAssignment(assignmentId, slideIds)
}

function openConfigurationDialog() {
  AIAssess.showConfigurationDialog();
}


function saveConfiguration(formData) {
  return AIAssess.saveConfiguration(formData);
}

function getConfiguration() {
  return AIAssess.getConfiguration();
}