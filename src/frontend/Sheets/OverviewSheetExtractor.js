// OverviewSheetExtractor.js
// The OverviewSheetExtractor class, which is responsible for extracting the data from the `Overview` sheets in each Assessment Record sheet.

class OverviewSheetExtractor extends BaseSheetManager {
    /**
     * Creates an instance of OverviewSheetExtractor.
     * Initializes the sheetsData array to store extracted information.
     */
    constructor() {
        super();
        this.sheetsData = [];
        this.overviewData = {};
    }

    /**
     * Extracts data from the 'AR File ID', 'Name', and 'Year Group' columns
     * and stores it in the sheetsData array.
     * @returns {Array<Object>} - An array of objects containing the extracted data.
     */
    getDetailsOfSheetsToExtractDataFrom() {
        const arFileIdColumn = 'AR File ID';
        const nameColumn = 'Name';
        const yearGroupColumn = 'Year Group';

        const arFileIds = this.extractColumn(arFileIdColumn);
        this.sheetsData = [];

        arFileIds.forEach((fileId, index) => {
            if (fileId) {
                const name = this.extractColumn(nameColumn)[index];
                const yearGroup = this.extractColumn(yearGroupColumn)[index];
                this.sheetsData.push({ fileId, name, yearGroup });
            }
        });

        return this.sheetsData;
    }

    /**
     * Extracts data from a single Overview sheet
     * @param {string} fileId - The spreadsheet file ID
     * @returns {Array<Array>} Sheet values excluding last two rows
     */
    _extractSingleOverviewSheet(fileId) {
        const spreadsheet = SpreadsheetApp.openById(fileId);
        const overviewSheet = spreadsheet.getSheetByName('Overview');
        
        if (!overviewSheet) {
            throw new Error(`Overview sheet not found in spreadsheet ${fileId}`);
        }

        const values = overviewSheet.getDataRange().getValues();
        // Remove last two rows (blank row and class average)
        return values.slice(0, -2);
    }

    /**
     * Processes all sheets and combines data by year group and class
     * @returns {Object} Combined overview data
     */
    processAllOverviewSheets() {
        // Get details of all sheets first
        this.getDetailsOfSheetsToExtractDataFrom();
        
        this.overviewData = this.sheetsData.reduce((accumulator, { fileId, name, yearGroup }) => {
            try {
                const sheetData = this._extractSingleOverviewSheet(fileId);
                
                if (!accumulator[yearGroup]) {
                    accumulator[yearGroup] = {};
                }
                
                accumulator[yearGroup][name] = sheetData;
                
            } catch (error) {
                console.error(`Error processing sheet ${name}: ${error.message}`);
            }
            return accumulator;
        }, {});

        return this.overviewData;
    }

    /**
     * Gets the combined overview data
     * @returns {Object} The overview data organized by year group and class name
     */
    getOverviewData() {
        return this.overviewData;
    }
}

export default OverviewSheetExtractor;