// Utils.gs

/**
 * Utils Class
 * 
 * Provides utility functions for the application.
 */
class Utils {
  /**
   * Generates a SHA-256 hash for a given string.
   * @param {string} inputString - The string to be hashed.
   * @return {string} - The SHA-256 hash of the input string.
   */
  static generateHash(inputString) {
    const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, inputString);
    const hash = rawHash.map(e => {
      // Convert each byte to a hexadecimal string
      const hex = (e < 0 ? e + 256 : e).toString(16);
      // Ensure each byte is represented by two hex digits
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");

    //Added to identify why some hashses are coming up as null.
    if (hash == null) {
      throw new Error("Hash is null. Please check debugger to find out why.")
    } else {
      return hash;
    }
  }

  /**
   * Converts a column index to its corresponding letter.
   * @param {number} columnIndex - The column index to convert (0-based).
   * @return {string} - The corresponding column letter.
   */
  static getColumnLetter(columnIndex) {
    let temp;
    let letter = '';
    while (columnIndex >= 0) {
      temp = (columnIndex) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      columnIndex = Math.floor((columnIndex - temp) / 26) - 1;
    }
    return letter;
  }

  /**
   * Compares two arrays for equality.
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
     * @returns {string} The course ID.
     */
    static getCourseId() {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = spreadsheet.getSheetByName('ClassInfo');
        if (!sheet) {
            throw new Error('ClassInfo sheet not found.');
        }
        const courseId = sheet.getRange('B2').getValue();
        if (!courseId) {
            throw new Error('Course ID not found in ClassInfo sheet.');
        }
        return courseId.toString();
    }

    /**
     * Retrieves assignments for a given course.
     * @param {string} courseId - The ID of the course.
     * @returns {Object[]} The list of assignments.
     */
    static getAssignments(courseId) {
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

  // -------------------
  // UI Methods
  // -------------------

  /**
   * Displays a toast message to the user in Google Sheets.
   * @param {string} message - The message to display.
   * @param {string} [title=''] - Optional title for the toast.
   * @param {number} [timeoutSeconds=3] - Duration for which the toast is visible.
   */
  static toastMessage(message, title = '', timeoutSeconds = 3) {
    try {
      const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (activeSpreadsheet) {
        activeSpreadsheet.toast(message, title, timeoutSeconds);
      } else {
        throw new Error("No active spreadsheet found.");
      }
    } catch (error) {
      console.error("Error displaying toast message:", error);
      // Optionally, handle the error or provide alternative feedback
    }
  }

  // Add other utility methods as needed
}

// Ensure singleton instance (if needed)
const utils = new Utils();
Object.freeze(utils);
