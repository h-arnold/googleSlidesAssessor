// SUPER IMPORTANT! Remeber to add the Slides Assessor Library as a library to this template before you push out the copies for each class.

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Classroom')
    .addItem('Assess Assignment', 'assessAssignment')
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
  AIAssess.openReferenceSlideModal(assignmentId)
}

function getAssignments(courseId) {
  return AIAssess.getAssignments(courseId)
}

function createReferenceSlideModalHtml(assignmentId, referenceSlideId) {
  AIAssess.createReferenceSlideModalHtml(assignmentId, referenceSlideId)
}

function processSelectedAssignment(assignmentId, referenceSlideId, emptySlideId) {
  return AIAssess.processSelectedAssignment(assignmentId, referenceSlideId, emptySlideId)
}

function saveSlideIdsForAssignment(assignmentId, slideIds) {
  return AIAssess.saveSlideIdsForAssignment(assignmentId, slideIds)
}
