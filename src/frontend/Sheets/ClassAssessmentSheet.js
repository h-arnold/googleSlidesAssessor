/**
 * Represents a single class assessment spreadsheet
 * and provides methods to extract data from it.
 */
class ClassAssessmentSheet {
    /**
     * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet 
     *        The Spreadsheet object for this class assessment.
     * @param {string} [className]  (Optional) A descriptive class/assessment name.
     * @param {string} [yearGroup]  (Optional) The year group or other metadata.
     */
    constructor(spreadsheet, className = '', yearGroup = '') {
      this.spreadsheet = spreadsheet;
      this.className = className;
      this.yearGroup = yearGroup;
    }
  
    /**
     * Extracts data from the 'Overview' sheet in the attached Spreadsheet,
     * excluding the final two rows.
     *
     * @throws {Error} if the 'Overview' sheet is not found.
     * @returns {Array<Array>} The raw values from the Overview sheet (minus the last two rows).
     */
    extractOverviewSheetData() {
      const overviewSheet = this.spreadsheet.getSheetByName('Overview');
      if (!overviewSheet) {
        throw new Error(`Overview sheet not found in spreadsheet: "${this.spreadsheet.getName()}"`);
      }
  
      const values = overviewSheet.getDataRange().getValues();
      // Remove last two rows (commonly a blank row + class average row)
      return values.slice(0, -2);
    }
  
    // The idea is that this class will be extended with other methods to extract different pieces of data from individal class assessment records.

  }
  