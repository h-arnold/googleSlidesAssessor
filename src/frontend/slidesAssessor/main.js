// Main.gs
//This file holds the global functions needed to start the assessment process and handle other functions like managing configurations.

//This is the main function that starts the assessment process.

function processSelectedAssignment(assignmentId, referenceSlideId, emptySlideId) {
    const lock = LockService.getScriptLock();

    if (!lock.tryLock(5000)) {
        console.log("Script is already running.");
        Utils.toastMessage("Script is already running. Please wait a while and try again.","Notice", 2);
        return;
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
        Utils.toastMessage("Getting the tasks from the reference slides.", "Processing", 2);
        assignment.populateTasksFromSlides();
        
        Utils.toastMessage("Getting all the student work together.", "Processing", 2);
        assignment.fetchSubmittedSlides();
        assignment.processAllSubmissions();

        Utils.toastMessage("Uploading any images.", "Processing", 2);
        // Process images
        assignment.processImages();

        Utils.toastMessage("Uploading any images.", "Assessing", 2);
        // Assess responses
        assignment.assessResponses();

        Utils.toastMessage("Processing and updating all the data.", "Analysing", 2);
        // Create the analysis sheet
        const analysisSheetManager = new AnalysisSheetManager(assignment);
        analysisSheetManager.createAnalysisSheet();

        // Update the overview sheet
        const overviewSheetManager = new OverviewSheetManager();
        overviewSheetManager.createOverviewSheet();

    } finally {
        lock.releaseLock();
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

/**
 * Saves slide IDs for a specific assignment.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {Object} slideIds - An object containing referenceSlideId and emptySlideId.
 */
function saveSlideIdsForAssignment(assignmentId, slideIds) {
  AssignmentPropertiesManager.saveSlideIdsForAssignment(assignmentId, slideIds);
}
