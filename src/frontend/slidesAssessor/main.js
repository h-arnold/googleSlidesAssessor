// Main.gs
//This file holds the global functions needed to start the assessment process and handle other functions like managing configurations.

//This is the main function that starts the assessment process.

/**
 * Processes the selected assignment with the provided slide IDs.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} referenceSlideId - The ID of the reference slide.
 * @param {string} emptySlideId - The ID of the empty slide.
 */
function processSelectedAssignment(assignmentId, referenceSlideId, emptySlideId) {
  
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) { // Attempt to lock for up to 5 seconds
    console.log("Script is already running.");
    Utils.toastMessage("Script is already running. Please wait a while and try again.","Notice", 2)
    
    return; // Exit if the lock can't be obtained
  }
  
  try {
    Utils.toastMessage("Assessment run starting...");

    const courseId = Utils.getCourseId();
    console.log('Assignment Id: ' + assignmentId);

    // Create an Assignment instance
    const assignment = new Assignment(courseId, assignmentId, referenceSlideId, emptySlideId);

    // Fetch all students and add them to the assignment
    const students = Student.fetchAllStudents(courseId);
    students.forEach(student => assignment.addStudent(student));

    // Process the assignment
    assignment.populateTasksFromSlides();
    assignment.fetchSubmittedSlides();
    assignment.processAllSubmissions();
    assignment.processImageBlobs();
    assignment.assessResponses();

    // Create the analysis sheet
    const analysisSheetManager = new AnalysisSheetManager(assignment);
    analysisSheetManager.createAnalysisSheet();

    // Update the overview sheet
    const overviewSheetManager = new OverviewSheetManager();
    overviewSheetManager.createOverviewSheet();
  
  } finally {
    lock.releaseLock(); // Always release the lock when done
  }
  
}


function onOpen() {
  const uiManager = new UIManager();
  uiManager.addCustomMenus();
}

function showConfigurationDialog() {
  const uiManager = new UIManager();
  uiManager.showConfigurationDialog();
}

function showAssignmentDropdown() {
  const uiManager = new UIManager();
  uiManager.showAssignmentDropdown();
}



function openReferenceSlideModal(assignmentData) {
  const uiManager = new UIManager();
  uiManager.openSlideIdsModal(assignmentData);
}