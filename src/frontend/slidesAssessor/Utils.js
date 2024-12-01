/**
 * Utils Class
 *
 * Provides utility functions for the application.
 */
class Utils {
  /**
   * Generates a SHA-256 hash for a given input.
   *
   * @param {string|Uint8Array} input - The string or byte array to be hashed.
   * @return {string} - The SHA-256 hash of the input.
   */
  static generateHash(input) {
    let inputBytes;
    if (typeof input === 'string') {
      inputBytes = Utilities.newBlob(input).getBytes();
    } else {
      inputBytes = input; // Assume input is a byte array
    }

    const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, inputBytes);
    const hash = rawHash.map(e => {
      const hex = (e < 0 ? e + 256 : e).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");

    if (hash == null) {
      console.error("Hash is null. Please check debugger to find out why.");
      throw new Error("Hash is null. Please check debugger to find out why.");
    } else {
      return hash;
    }
  }
  /**
   * Converts a column index to its corresponding letter.
   *
   * @param {number} columnIndex - The column index to convert (0-based).
   * @return {string} - The corresponding column letter.
   */
  static getColumnLetter(columnIndex) {
    let temp;
    let letter = "";
    while (columnIndex >= 0) {
      temp = columnIndex % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      columnIndex = Math.floor((columnIndex - temp) / 26) - 1;
    }
    return letter;
  }

  /**
   * Compares two arrays for equality.
   *
   * @param {Array} arr1 - The first array.
   * @param {Array} arr2 - The second array.
   * @return {boolean} - True if arrays are equal, false otherwise.
   */
  static arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }

  /**
   * Retrieves the course ID from the 'ClassInfo' sheet.
   *
   * @returns {string} The course ID.
   */
  static getCourseId() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("ClassInfo");
    if (!sheet) {
      console.error("ClassInfo sheet not found.");
      throw new Error("ClassInfo sheet not found.");
    }
    const courseId = sheet.getRange("B2").getValue();
    if (!courseId) {
      console.error("Course ID not found in ClassInfo sheet.");
      throw new Error("Course ID not found in ClassInfo sheet.");
    }
    return courseId.toString();
  }

  /**
   * Retrieves assignments for a given course.
   *
   * @param {string} courseId - The ID of the course.
   * @returns {Object[]} The list of assignments.
   */
  static getAssignments(courseId) {
    try {
      const courseWork = Classroom.Courses.CourseWork.list(courseId);
      let assignments = [];

      if (courseWork.courseWork && courseWork.courseWork.length > 0) {
        assignments = courseWork.courseWork.map((assignment) => {
          return {
            id: assignment.id,
            title: assignment.title,
            creationTime: new Date(assignment.creationTime),
          };
        });

        // Sort assignments by creation time in descending order
        assignments.sort((a, b) => b.creationTime - a.creationTime);
      }

      console.log(
        `${assignments.length} assignments retrieved for courseId: ${courseId}`
      );
      return assignments;
    } catch (error) {
      console.error(
        `Error retrieving assignments for courseId ${courseId}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Normalises all keys in an object to lowercase. Sometimes the LLM will capitalize the keys of objects which causes problems elsewhere.
   *
   * @param {Object} obj - The object whose keys are to be normalised.
   * @return {Object} - A new object with all keys in lowercase.
   */
  static normaliseKeysToLowerCase(obj) {
    const normalisedObj = {};
    for (const [key, value] of Object.entries(obj)) {
      normalisedObj[key.toLowerCase()] = value;
    }
    return normalisedObj;
  }

  // -------------------
  // UI Methods
  // -------------------

  /**
   * Displays a toast message to the user in Google Sheets.
   *
   * @param {string} message - The message to display.
   * @param {string} [title=''] - Optional title for the toast.
   * @param {number} [timeoutSeconds=3] - Duration for which the toast is visible.
   */
  static toastMessage(message, title = "", timeoutSeconds = 3) {
    try {
      const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (activeSpreadsheet) {
        activeSpreadsheet.toast(message, title, timeoutSeconds);
        console.log(
          `Toast message displayed: "${message}" with title "${title}" for ${timeoutSeconds} seconds.`
        );
      } else {
        throw new Error("No active spreadsheet found.");
      }
    } catch (error) {
      console.error("Error displaying toast message:", error);
      // Optionally, handle the error or provide alternative feedback
    }
  }

  static clearDocumentProperties() {
    const docProperties = PropertiesService.getDocumentProperties();
    docProperties.deleteAllProperties();
  }

  static isValidUrl(url) {
    if (typeof url !== 'string') {
      return false;
    }
    const urlPattern = new RegExp(
      '^' +
      // Protocol identifier (required)
      '(?:(?:https?|ftp)://)' +
      // User:Pass authentication (optional)
      '(?:\\S+(?::\\S*)?@)?' +
      '(?:' +
      // IP address exclusion (private & local networks)
      '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
      '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
      '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
      // IP address dotted notation octets
      '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
      '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
      '(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-5]))' +
      '|' +
      // Hostname
      '(?:(?:[a-zA-Z\\d]-*)*[a-zA-Z\\d]+)' +
      // Domain name
      '(?:\\.[a-zA-Z\\d]+(?:-[a-zA-Z\\d]+)*)*' +
      // TLD identifier
      '(?:\\.(?:[a-zA-Z]{2,}))' +
      ')' +
      // Port number (optional)
      '(?::\\d{2,5})?' +
      // Resource path (optional)
      '(?:/\\S*)?' +
      '$', 'i'
    );

    const result = urlPattern.test(url);

    if (!result) {
      console.error(`Invalid slide URL found: ${url}`)
    }

    return result; //True or False
  }


}

// Ensure singleton instance (if needed)
const utils = new Utils();
Object.freeze(utils);
