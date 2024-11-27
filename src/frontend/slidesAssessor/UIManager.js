// UIManager.gs

/**
 * UIManager Class
 *
 * Handles all user interface interactions, including menus and modal dialogs.
 */
class UIManager {
  constructor() {
    this.ui = SpreadsheetApp.getUi();
  }

  /**
   * Adds custom menus to the Google Sheets UI when the spreadsheet is opened.
   */
  addCustomMenus() {
    this.ui.createMenu('Classroom')
      .addItem('Configure Script Properties', 'showConfigurationDialog')
      .addItem('Update Existing Assignment', 'showAssignmentDropdown')
      .addToUi();
    console.log('Custom menus added to the UI.');
  }

  /**
   * Shows the configuration dialog modal.
   */
  showConfigurationDialog() {
    const html = HtmlService.createHtmlOutputFromFile('ConfigurationManager')
      .setWidth(500)
      .setHeight(600); // Adjust the size as needed

    this.ui.showModalDialog(html, 'Configure Script Properties');
    console.log('Configuration dialog displayed.');
  }

  /**
   * Shows a modal dialog with a dropdown of assignments to choose from.
   */
  showAssignmentDropdown() {
    const courseId = Utils.getCourseId();
    const assignments = Utils.getAssignments(courseId);
    const maxTitleLength = this.getMaxTitleLength(assignments);
    const modalWidth = Math.max(300, maxTitleLength * 10); // Minimum width 300px, 10px per character

    const htmlContent = this.createAssignmentDropdownHtml(assignments);
    const html = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(modalWidth)
      .setHeight(250); // Increased height to accommodate buttons

    this.ui.showModalDialog(html, 'Select Assignment');
    console.log('Assignment dropdown modal displayed.');
  }

  /**
   * Gets the maximum length of assignment titles.
   *
   * @param {Object[]} assignments - The list of assignments.
   * @returns {number} The maximum length of assignment titles.
   */
  getMaxTitleLength(assignments) {
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
   *
   * @param {Object[]} assignments - The list of assignments.
   * @returns {string} The HTML string for the modal.
   */
  createAssignmentDropdownHtml(assignments) {
    let html = `
    <html>
    <head>
        <base target="_top">
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
                <label for="assignments">Select Assignment</label>
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

                google.script.run
                    .withFailureHandler(function(error) {
                        alert('Error: ' + error.message);
                    })
                    .openReferenceSlideModal(assignmentData);
            }
        </script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
    </body>
    </html>
    `;
    return html;
  }

  /**
   * Opens a modal dialog to get the reference and empty slide IDs.
   *
   * @param {string} assignmentData - The assignment data.
   */
  openReferenceSlideModal(assignmentData) {
    const assignmentDataObj = JSON.parse(assignmentData);
    const savedSlideIds = AssignmentPropertiesManager.getSlideIdsForAssignment(assignmentDataObj.name);
    const htmlContent = this.createSlideIdsModalHtml(assignmentDataObj, savedSlideIds);
    const html = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(400)
      .setHeight(350);

    this.ui.showModalDialog(html, 'Enter Slide IDs');
    console.log('Reference slide IDs modal displayed.');
  }

  /**
   * Creates the HTML for the slide IDs modal.
   *
   * @param {Object} assignmentData - The assignment data.
   * @param {Object} savedSlideIds - The saved slide IDs for the assignment, if any.
   * @returns {string} The HTML string for the modal.
   */
  createSlideIdsModalHtml(assignmentData, savedSlideIds = {}) {
    const referenceSlideId = savedSlideIds.referenceSlideId || '';
    const emptySlideId = savedSlideIds.emptySlideId || '';
    const assignmentTitle = assignmentData.name;
    const assignmentId = assignmentData.id;

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <base target="_top">
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
            .input-field label {
                top: -20px;
                font-size: 14px;
                color: #9e9e9e;
            }
            .input-field input[type="text"] {
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="modal-content">
            <h5>Enter Slide IDs for "${assignmentTitle}"</h5>
            <div class="input-field">
                <input type="text" id="referenceSlideId" placeholder="Reference Slide ID" value="${referenceSlideId}">
                <label for="referenceSlideId" class="active">Reference Slide ID</label>
            </div>
            <div class="input-field">
                <input type="text" id="emptySlideId" placeholder="Empty Slide ID" value="${emptySlideId}">
                <label for="emptySlideId" class="active">Empty Slide ID</label>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn waves-effect waves-light" onclick="google.script.host.close()">Cancel</button>
            <button class="btn waves-effect waves-light" onclick="saveAndRun()">Go</button>
        </div>
    <script>
        function saveAndRun() {
            const referenceSlideId = document.getElementById('referenceSlideId').value.trim();
            const emptySlideId = document.getElementById('emptySlideId').value.trim();

            if (!referenceSlideId || !emptySlideId) {
                alert('Please enter both Reference Slide ID and Empty Slide ID.');
                return;
            }

            // Save slide IDs
            const assignmentTitle = "${assignmentTitle}";
            const slideIds = {
                referenceSlideId: referenceSlideId,
                emptySlideId: emptySlideId
            };

            const assignmentId = "${assignmentId}";

            // Call server-side function to save, start processing, and show progress modal
            google.script.run
                .withFailureHandler(function(error) {
                    alert('Error: ' + error.message);
                })
                .saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId);

            // Close the current modal
            google.script.host.close();
        }

        // Initialize Materialize components
        document.addEventListener('DOMContentLoaded', function() {
            M.updateTextFields();
        });
    </script>

            <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
        </body>
        </html>
    `;
    return html;
  }

  /**
   * Opens the progress modal.
   */
  showProgressModal() {
    const html = HtmlService.createHtmlOutputFromFile('ProgressModal')
      .setWidth(400)
      .setHeight(200);
    this.ui.showModalDialog(html, 'Progress');
    console.log('Progress modal displayed.');
  }
}
