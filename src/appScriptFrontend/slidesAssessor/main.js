// Main.gs
//This file holds the global functions needed to start the assessment process and handle other functions like managing configurations

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

function openSlideIdsModal(assignmentData) {
  const uiManager = new UIManager();
  uiManager.openSlideIdsModal(assignmentData);
}

function processSelectedAssignment(assignmentId, referenceSlideId, emptySlideId) {
  Utils.toastMessage("Assessment run starting...");
  // Warm up the LLM asynchronously
  const llmRequestManager = new LLMRequestManager();
  llmRequestManager.warmUpLLM();

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
  assignment.assessResponses();

  // Create the analysis sheet
  const analysisSheetManager = new AnalysisSheetManager(assignment);
  analysisSheetManager.createAnalysisSheet();

  // Update the overview sheet
  const overviewSheetManager = new OverviewSheetManager();
  overviewSheetManager.createOverviewSheet();
}

