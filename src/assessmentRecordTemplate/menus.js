// Creates the menu in Google Sheets

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Assessment Bot')
    .addItem('Assess Assignment', 'assessAssignment')
    .addItem('Check Progress', 'showProgressModal')
    .addItem('Change Class', 'showClassroomDropdown')
    .addToUi();
}

//////////////////////////////////////////////////////////////////////////////////////////////
// Below are placeholder functions which call the respective global function from the library. 
// Where you see a `return` it is because a value needs to be passed to the frontend HTML 
// code.
//////////////////////////////////////////////////////////////////////////////////////////////


// Placeholder functions for the 'Assess Assignment Menu Option

// Calls the function to generate the Assignment Chooser modal.

function assessAssignment() {
  return AIAssess.showAssignmentDropdown();
}

// Gets a list of all assignments set in the Google Classroom associated with the Google Sheet.
function getAssignments(courseId) {
  return AIAssess.getAssignments(courseId)
}

// Helper function for the above
function createAssignmentDropdownHtml(assignments) {
  return AIAssess.createAssignmentDropdownHtml(assignments);
}


// Opens the reference slide modal which comes after the assignment selection
function openReferenceSlideModal(assignmentId) {
  return AIAssess.openReferenceSlideModal(assignmentId)
}

// Helper function to generate and display html for the reference slide modal
function createReferenceSlideModalHtml(assignmentId, referenceSlideId) {
  return AIAssess.createReferenceSlideModalHtml(assignmentId, referenceSlideId) 
}

// Saves the reference and empty slide Ids to avoid having to do it each assessment run.
function saveSlideIdsForAssignment(assignmentId, slideIds) {
  return AIAssess.saveSlideIdsForAssignment(assignmentId, slideIds)
}

/**
 * Sets the trigger and stores the revelant parameters to process the selected assignment.
 * @param {string} assignmentTitle - The title of the assignment.
 * @param {Object} slideIds - An object containing referenceSlideId and emptySlideId.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} referenceSlideId - The ID of the reference slide.
 * @param {string} emptySlideId - The ID of the empty slide.
 */
function saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId) {
  AIAssess.saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId);
}

/**
 * Initiates the processing of an assignment asynchronously by setting up a trigger. (Called by saveStartAndShowProgress)
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
 * Opens the progress modal dialog.
 */
function showProgressModal() {
  AIAssess.showProgressModal();
}

// Needed to get the progress data for the progress modal.
function requestStatus() {
  return AIAssess.requestStatus();
}
// Place holder code for classroom changing menu option
function showClassroomDropdown() {
  AI.Assess.showClassroomDropdown();
}

function saveClassroom(courseName, courseId) {
  AIAssess.saveClassroom(courseName, courseId)
}


function removeTrigger(functionName){
  AIAssess.removeTrigger(functionName);

}

// Is the function without parameters to call processSelectedAssignment. Retrieves assignment details from document properties.
function triggerProcessSelectedAssignment() {
  AIAssess.triggerProcessSelectedAssignment();
}

// Called by the above with the retrieved parameters.
function processSelectedAssignment(assignmentId, referenceSlideId, emptySlideId) {
  return AIAssess.processSelectedAssignment(assignmentId, referenceSlideId, emptySlideId)
}

//
// Backend configuration calling functions. I may remove these in a future release.
//

function openConfigurationDialog() {
  AIAssess.showConfigurationDialog();
}


function saveConfiguration(formData) {
  return AIAssess.saveConfiguration(formData);
}

function getConfiguration() {
  return AIAssess.getConfiguration();
}


