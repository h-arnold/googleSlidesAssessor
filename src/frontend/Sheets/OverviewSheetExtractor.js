// OverviewSheetExtractor.js
// The OverviewSheetExtractor class, which is responsible for extracting the data from the `Overview` sheets in each Assessment Record sheet.

import BaseSheetManager from './0BaseSheetManager.js';

class OverviewSheetExtractor extends BaseSheetManager {
    /**
     * Creates an instance of OverviewSheetExtractor.
     * Initializes the sheetsData array to store extracted information.
     */
    constructor() {
        super();
        this.sheetsData = [];
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
}

export default OverviewSheetExtractor;