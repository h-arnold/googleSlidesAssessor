// Main.gs

function test() {
  console.log("Testing!");
}

/**
 * Main function to execute the entire assessment pipeline.
 */
function mainProcess() {
  console.log("This process is definitely running.")
    try {
        // Initialize Assignment
        // Replace the following parameters with actual values or retrieve them from configuration
        const assignmentId = '';
        const courseId = '';
        const documentType = 'Google Slide';
        const referenceDocumentId = configurationManager.getReferenceSlideId();
        const emptyDocumentId = configurationManager.getEmptySlideId();

        const assignment = new Assignment(courseId, assignmentId, documentType, referenceDocumentId, emptyDocumentId);
        assignment.populateTasksFromSlides();

        // Fetch and add students
        const students = Student.fetchAllStudents(courseId);
        students.forEach(student => assignment.addStudent(student));

        // Fetch Submitted Slides
        assignment.fetchSubmittedSlides();

        // Process Submissions
        assignment.processAllSubmissions();

        // Assess Responses via LLM with Batch Processing
        assignment.assessResponses();

        console.log(JSON.stringify(assignment.studentTasks[1]))
        console.log(JSON.stringify(assignment.tasks))

        // Update Analysis Spreadsheet
        createAnalysisSheetAndUpdateOverview(assignment);

        Utils.toastMessage("Assessment process completed successfully.", "Success", 5);
    } catch (error) {
        console.error("Error in mainProcess:", error);
        Utils.toastMessage("An error occurred during the assessment process.", "Error", 5);
    }
}

function createAnalysisSheetAndUpdateOverview(assignment) {
    // Process the assignment
    assignment.populateTasksFromSlides();
    assignment.processAllSubmissions();
    assignment.assessResponses();

    // Create the analysis sheet
    const analysisSheetManager = new AnalysisSheetManager(assignment);
    analysisSheetManager.createAnalysisSheet();
    // storeAverageRanges is called within createAnalysisSheet

    // Update the overview sheet
    const overviewSheetManager = new OverviewSheetManager();
    overviewSheetManager.createOverviewSheet();
}