// Helper function to get the assignment name
function getAssignmentName(courseId, assignmentId) {
  var courseWork = Classroom.Courses.CourseWork.get(courseId, assignmentId);
  return courseWork.title;
}

// Helper function to get the list of students in the course
function getStudents(courseId) {
  var optionalArgs = {
    pageSize: 100
  };
  var students = [];
  var response = Classroom.Courses.Students.list(courseId, optionalArgs);
  var studentsList = response.students;
  if (studentsList && studentsList.length > 0) {
    students = studentsList;
  }
  return students;
}

// Helper function to extract courseId and assignmentId from URL
function extractIdsFromUrl(url) {
  var regex = /c\/([^\/]+)\/a\/([^\/]+)/;
  var match = url.match(regex);
  if (match && match.length === 3) {
    return {
      courseId: match[1],
      assignmentId: match[2]
    };
  }
  return null;
}

//Clears the spreadsheet of all values, notes and formatting rules that otherwise break the batchUpdate if the sheet is already populated
function clearSheet(sheet) {
  sheet.clear();
  sheet.clearFormats();
  sheet.clearNotes();
  sheet.clearConditionalFormatRules();
}

//Gets the course ID from the B2 cell in the sheet ClassInfo. This should be automatically populated from the Google Classroom Organiser script.
function getCourseId() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ClassInfo');
  if (!sheet) {
    throw new Error("Sheet 'ClassInfo' not found");
  }
  var courseId = sheet.getRange('B2').getValue();
  if (!courseId) {
    throw new Error("Course ID not found in cell B2");
  }
  return courseId;
}


function getLangflowApiKey() {
  //Set your langflow API key by clicking on  ⚙️ on the left, scrolling down and pasting it next to the langflowApiKey value.
  const scriptProperty = PropertiesService.getScriptProperties();
  const langflowApiKey = scriptProperty.getProperty("langflowApiKey")
  return langflowApiKey
}

/**
 * Generates a SHA-256 hash for a given string.
 * @param {string} inputString - The string to be hashed.
 * @return {string} - The SHA-256 hash of the input string.
 */
function generateHash(inputString) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, inputString);
  const hash = rawHash.map(function(e) {
    // Convert each byte to a hexadecimal string
    const hex = (e < 0 ? e + 256 : e).toString(16);
    // Ensure each byte is represented by two hex digits
    return hex.length == 1 ? "0" + hex : hex;
  }).join("");
  
  return hash;
}

/**
 * Converts a column index to its corresponding letter.
 * @param {number} columnIndex - The column index to convert.
 * @returns {string} - The corresponding column letter.
 */
function getColumnLetter(columnIndex) {
  let temp;
  let letter = '';
  while (columnIndex >= 0) {
    temp = (columnIndex) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    columnIndex = (columnIndex - temp - 1) / 26;
  }
  return letter;
}

/**
 * Sends a toast message and logs it to the console.
 * @param {string} message - The message to display.
 */
async function toastMessage(message) {
  console.log(message);
  SpreadsheetApp.getActive().toast(message);
}

