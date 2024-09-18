/**
 * Adds a custom menu to the Google Sheets UI when the spreadsheet is opened.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Classroom')
    .addItem('Set Properties', 'checkAndPromptConfiguration')
    .addItem('Update Existing Assignment', 'showAssignmentDropdown')
    .addToUi();
}

/**
 * Shows a modal dialog with a dropdown of assignments to choose from.
 */
function showAssignmentDropdown() {
  const courseId = getCourseId();
  const assignments = getAssignments(courseId);
  const maxTitleLength = getMaxTitleLength(assignments);
  const modalWidth = Math.max(300, maxTitleLength * 10); // Minimum width 300px, 10px per character

  const html = HtmlService.createHtmlOutput(createAssignmentDropdownHtml(assignments))
    .setWidth(modalWidth)
    .setHeight(250); // Increased height to accommodate buttons
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Select Assignment');
}

/**
 * Gets the maximum length of assignment titles.
 * @param {Object[]} assignments - The list of assignments.
 * @returns {number} The maximum length of assignment titles.
 */
function getMaxTitleLength(assignments) {
  let maxLength = 0;
  assignments.forEach(assignment => {
    if (assignment.title.length > maxLength) {
      maxLength = assignment.title.length;
    }
  });
  return maxLength;
}

/**
 * Creates the HTML for the assignment dropdown modal.
 * @param {Object[]} assignments - The list of assignments.
 * @returns {string} The HTML string for the modal.
 */
function createAssignmentDropdownHtml(assignments) {
  let html = `
  <html>
  <head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
    <style>
      .modal-content {
        padding: 20px;
      }
      .modal-footer {
        text-align: right;
        padding: 10px;
      }
      .modal-footer button {
        margin-left: 10px;
      }
    </style>
  </head>
  <body>
    <div class="modal-content">
      <div class="input-field">
        <select id="assignments" name="assignments">
          ${assignments.map(assignment => `<option value="${assignment.id}" data-name="${assignment.title}">${assignment.title}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn waves-effect waves-light" onclick="google.script.host.close()">Cancel</button>
      <button class="btn waves-effect waves-light" onclick="go()">Go</button>
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        var elems = document.querySelectorAll('select');
        var instances = M.FormSelect.init(elems);
      });
      function go() {
        const select = document.getElementById('assignments');
        const assignmentId = select.value;
        const selectedOption = select.options[select.selectedIndex];
        const assignmentName = selectedOption.getAttribute('data-name');
        const assignmentData = JSON.stringify({
          id: assignmentId,
          name: assignmentName
        });

        google.script.run.withSuccessHandler(function(response) {
        }).withFailureHandler(function(error) {
          alert('Error: ' + error);
        }).openReferenceSlideModal(assignmentData);
      }
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
  </body>
  </html>
  `;
  return html;
}

/**
 * Opens the reference slide modal with the provided assignment data (for debugging).
 */
function debugOpenReferenceSlideModal() {
  const assignmentData = `ADD YOUR REST REQUEST OBJECT HERE`
  openReferenceSlideModal(assignmentData);
}

/**
 * Opens a modal dialog showing the reference slide ID.
 * @param {string} assignmentData - The JSON string containing assignment data.
 */
function openReferenceSlideModal(assignmentData) {
  assignmentData = JSON.parse(assignmentData);
  const referenceSlideId = getReferenceSlideId(assignmentData.name);

  const assignmentAndSlideData = {
    id: assignmentData.id,
    name: assignmentData.name,
    slideId: referenceSlideId 
  };

  console.log(JSON.stringify(assignmentAndSlideData));

  const html = HtmlService.createHtmlOutput(createReferenceSlideModalHtml(assignmentAndSlideData))
    .setWidth(400)
    .setHeight(250);

  SpreadsheetApp.getUi().showModalDialog(html, 'Reference Slide ID');
}

/**
 * Creates the HTML for the reference slide modal (for debugging).
 */
function debugCreateReferenceSlideModalHtml() {
  const assignmentAndSlideData = {
    id: 'ASSIGNMENT ID GOES HERE',
    name: 'ASSIGNMENT NAME GOES HERE',
    slideId: 'SLIDE ID GOES HERE'
  };
  createReferenceSlideModalHtml(assignmentAndSlideData);
}

/**
 * Creates the HTML for the reference slide modal.
 * @param {Object} assignmentAndSlideData - The assignment and slide data.
 * @returns {string} The HTML string for the modal.
 */
function createReferenceSlideModalHtml(assignmentAndSlideData) {
  let html = `
  <html>
  <head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
    <style>
      .modal-content {
        padding: 20px;
      }
      .modal-footer {
        text-align: right;
        padding: 10px;
      }
      .modal-footer button {
        margin-left: 10px;
      }
    </style>
  </head>
  <body>
    <div class="modal-content">
      <h5>Reference Slide ID</h5>
      <div class="input-field">
        <input type="text" id="referenceSlideId" value="${assignmentAndSlideData.slideId}">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn waves-effect waves-light" onclick="google.script.host.close()">Cancel</button>
      <button class="btn waves-effect waves-light" onclick="saveAndRun()">Go</button>
    </div>
    <script>
      function saveAndRun() {
        const referenceSlideId = document.getElementById('referenceSlideId').value;
        google.script.run
          .withSuccessHandler(function() {
            processAssignment();
          })
          .withFailureHandler(function(error) {
            alert('Error saving Reference Slide ID: ' + error.message);
          })
          .saveReferenceSlideId('${assignmentAndSlideData.name}', referenceSlideId);
      }
      
      function processAssignment() {
        google.script.run
          .withFailureHandler(function(error) {
            alert('Error processing assignment: ' + error.message);
          })
          .processSelectedAssignment('${assignmentAndSlideData.id}', '${assignmentAndSlideData.slideId}');
        google.script.host.close();
      }
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
  </body>
  </html>
  `;
  console.log(html);
  return html;
}

/**
 * Retrieves assignments for a given course.
 * @param {string} courseId - The ID of the course.
 * @returns {Object[]} The list of assignments.
 */
function getAssignments(courseId) {
  const courseWork = Classroom.Courses.CourseWork.list(courseId);
  let assignments = [];

  if (courseWork.courseWork && courseWork.courseWork.length > 0) {
    assignments = courseWork.courseWork.map(assignment => {
      return {
        id: assignment.id,
        title: assignment.title,
        creationTime: new Date(assignment.creationTime)
      };
    });

    // Sort assignments by creation time in descending order
    assignments.sort((a, b) => b.creationTime - a.creationTime);
  }

  return assignments;
}

/**
 * Processes the selected assignment with a callback (for debugging).
 */
function debugprocessSelectedAssignmentCallback() {
  processSelectedAssignmentCallback("YOUR ASSIGNMENT ID GOES HERE");
}

/**
 * Calls the main processSelectedAssignment function asynchronously.
 * @param {string} assignmentId - The ID of the assignment.
 */
function processSelectedAssignmentCallback(assignmentId) {
  console.log(`Callback function called with assignmentId ${assignmentId}`);
  assignmentId = assignmentId.toString();
  processSelectedAssignment(assignmentId);
}

/**
 * Processes the selected assignment and updates the overview sheet.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} referenceSlideId - The ID of the reference slide.
 */
function processSelectedAssignment(assignmentId, referenceSlideId) {
  toastMessage("Assessment run starting...");
  warmUpLLM();

  const courseId = getCourseId();
  console.log('Assignment Id: ' + assignmentId);
  
  const sheet = createAssignmentSheet(courseId, assignmentId);
  const students = getStudents(courseId);

  if (students.length > 0) {
    extractAndPopulateAllStudentWork(students, courseId, assignmentId, sheet, referenceSlideId);
  }

  updateOverviewSheet();
}
