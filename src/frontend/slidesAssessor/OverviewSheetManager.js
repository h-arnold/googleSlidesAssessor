// OverviewSheetManager.gs

/**
 * OverviewSheetManager Class
 *
 * Handles the creation and updating of the overview sheet with overall student averages.
 */
class OverviewSheetManager extends BaseSheetManager {
    /**
     * Constructs an OverviewSheetManager instance.
     */
    constructor() {
        super();
        this.headers = ['Name', 'Completeness', 'Accuracy', 'SPaG', 'Average'];
        this.studentAverages = []; // To hold calculated averages
    }

    /**
     * Main method to create and populate the overview sheet.
     */
    createOverviewSheet() {
        this.createOrGetSheet('Overview');
        this.prepareData();
        this.buildRequests();
        this.executeBatchUpdate();
    }

    /**
     * Prepares data by fetching stored ranges and calculating averages.
     */
    prepareData() {
        this.retrieveStoredRanges();
        this.fetchData();
        this.calculateAverages();
    }

    /**
     * Retrieves stored ranges from document properties.
     */
    retrieveStoredRanges() {
        const documentProperties = PropertiesService.getDocumentProperties();
        const averagesRanges = JSON.parse(documentProperties.getProperty('averagesRanges') || '{}');
        this.averagesRanges = averagesRanges;
    }

    /**
     * Fetches data from the stored ranges using batchGet.
     */
    fetchData() {
        const spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
        const ranges = [];

        for (const sheetName in this.averagesRanges) {
            const sheetRanges = this.averagesRanges[sheetName];
            ranges.push(sheetRanges.studentName);
            ranges.push(sheetRanges.completeness);
            ranges.push(sheetRanges.accuracy);
            ranges.push(sheetRanges.spag);
        }

        const response = Sheets.Spreadsheets.Values.batchGet(spreadsheetId, { ranges: ranges });
        this.retrievedData = response.valueRanges;
    }

    /**
     * Calculates overall averages for each student.
     */
    calculateAverages() {
        const studentData = {};

        for (let i = 0; i < this.retrievedData.length; i += 4) {
            const names = this.retrievedData[i].values || [];
            const completenessValues = this.retrievedData[i + 1].values || [];
            const accuracyValues = this.retrievedData[i + 2].values || [];
            const spagValues = this.retrievedData[i + 3].values || [];

            for (let j = 0; j < names.length; j++) {
                const name = names[j][0];
                const completeness = parseFloat(completenessValues[j][0]);
                const accuracy = parseFloat(accuracyValues[j][0]);
                const spag = parseFloat(spagValues[j][0]);

                if (!studentData[name]) {
                    studentData[name] = { completeness: 0, accuracy: 0, spag: 0, count: 0 };
                }

                if (!isNaN(completeness)) {
                    studentData[name].completeness += completeness;
                }
                if (!isNaN(accuracy)) {
                    studentData[name].accuracy += accuracy;
                }
                if (!isNaN(spag)) {
                    studentData[name].spag += spag;
                }
                studentData[name].count++;
            }
        }

        // Prepare student averages array
        for (const name in studentData) {
            const data = studentData[name];
            this.studentAverages.push({
                name: name,
                completeness: (data.completeness / data.count).toFixed(2),
                accuracy: (data.accuracy / data.count).toFixed(2),
                spag: (data.spag / data.count).toFixed(2)
            });
        }

        // Sort students alphabetically
        this.studentAverages.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Builds batchUpdate requests to populate the overview sheet.
     */
    buildRequests() {
        const sheetId = this.sheet.getSheetId();

        // Ensure enough columns
        this.ensureSheetHasEnoughColumns(this.headers.length);

        // Create headers
        this.requests.push(this.createHeaderValuesRequest(sheetId, this.headers, 0));

        // Format headers
        this.requests.push(this.createHeaderFormattingRequest(sheetId, this.headers.length, 0, 1));

        // Set column widths
        const columnWidths = [200, 75, 75, 75, 75];
        this.requests.push(...this.createColumnWidthRequests(sheetId, columnWidths));

        // Freeze headers
        this.requests.push(this.createFreezeRequest(sheetId, 1, 1));

        // Add data rows
        this.addDataRows(sheetId);

        // Add class average row
        this.addClassAverageRow(sheetId);

        // Apply conditional formatting
        this.applyFormatting(sheetId);
    }

    /**
     * Adds data rows for each student's averages.
     * @param {number} sheetId - The ID of the sheet.
     */
    addDataRows(sheetId) {
        const startRowIndex = 1; // Data starts after headers

        this.studentAverages.forEach((student, index) => {
            const rowData = [
                { userEnteredValue: { stringValue: student.name } },
                { userEnteredValue: { numberValue: parseFloat(student.completeness) } },
                { userEnteredValue: { numberValue: parseFloat(student.accuracy) } },
                { userEnteredValue: { numberValue: parseFloat(student.spag) } },
                {
                    userEnteredValue: {
                        formulaValue: `=IFERROR(ROUND(AVERAGE(B${startRowIndex + index + 1}:D${startRowIndex + index + 1}),1),0)`
                    }
                }
            ];

            this.requests.push({
                updateCells: {
                    rows: [{ values: rowData }],
                    fields: 'userEnteredValue',
                    start: { sheetId: sheetId, rowIndex: startRowIndex + index, columnIndex: 0 }
                }
            });
        });
    }

    /**
     * Adds the class average row to the sheet.
     * @param {number} sheetId - The ID of the sheet.
     */
    addClassAverageRow(sheetId) {
        const lastDataRowIndex = this.studentAverages.length + 1;
        const averageRowIndex = lastDataRowIndex + 1; // One blank row in between

        // Add blank row
        this.requests.push({
            updateCells: {
                rows: [{}],
                fields: 'userEnteredValue',
                start: { sheetId: sheetId, rowIndex: lastDataRowIndex, columnIndex: 0 }
            }
        });

        // Prepare Class Average row
        const rowData = [
            {
                userEnteredValue: { stringValue: 'Class Average' },
                userEnteredFormat: { textFormat: { bold: true } }
            }
        ];

        const columns = ['B', 'C', 'D', 'E'];
        columns.forEach((col, index) => {
            const formula = `=IFERROR(ROUND(AVERAGE(${col}2:${col}${lastDataRowIndex}),1),0)`;
            rowData.push({
                userEnteredValue: { formulaValue: formula },
                userEnteredFormat: {
                    horizontalAlignment: "CENTER",
                    verticalAlignment: "MIDDLE",
                    textFormat: { bold: true }
                }
            });
        });

        // Add Class Average row
        this.requests.push({
            updateCells: {
                rows: [{ values: rowData }],
                fields: 'userEnteredValue,userEnteredFormat',
                start: { sheetId: sheetId, rowIndex: averageRowIndex, columnIndex: 0 }
            }
        });
    }

    /**
     * Applies conditional formatting to the data cells.
     * @param {number} sheetId - The ID of the sheet.
     */
    applyFormatting(sheetId) {
        const numRows = this.studentAverages.length + 1; // Data rows plus header row
        const numColumns = this.headers.length;

        // Apply cell formatting
        this.requests.push({
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1, // After headers
                    endRowIndex: numRows,
                    startColumnIndex: 1,
                    endColumnIndex: numColumns
                },
                cell: {
                    userEnteredFormat: {
                        horizontalAlignment: "CENTER",
                        verticalAlignment: "MIDDLE"
                    }
                },
                fields: "userEnteredFormat(horizontalAlignment, verticalAlignment)"
            }
        });

        // Create conditional formatting requests
        this.requests.push(...this.createConditionalFormattingRequests(sheetId, numRows, numColumns));
    }

    /**
     * Creates conditional formatting requests for the data cells.
     * @param {number} sheetId - The ID of the sheet.
     * @param {number} numRows - The number of data rows.
     * @param {number} numColumns - The number of columns to format.
     * @returns {Array<Object>} - An array of conditional formatting requests.
     */
    createConditionalFormattingRequests(sheetId, numRows, numColumns) {
        const requests = [];
        const startRowIndex = 1; // Data starts after headers
        const endRowIndex = numRows + 2; // Including blank row and class average row
        const startColumnIndex = 1; // Starting from 'Completeness' column
        const endColumnIndex = numColumns;

        const range = {
            sheetId: sheetId,
            startRowIndex: startRowIndex,
            startColumnIndex: startColumnIndex,
            endRowIndex: endRowIndex,
            endColumnIndex: endColumnIndex
        };

        // Gradient formatting based on score
        requests.push({
            addConditionalFormatRule: {
                rule: {
                    ranges: [range],
                    gradientRule: {
                        minpoint: {
                            color: { red: 1, green: 0, blue: 0 }, // Red for 0
                            type: "NUMBER",
                            value: "0"
                        },
                        midpoint: {
                            color: { red: 1, green: 1, blue: 0 }, // Yellow for 2.5
                            type: "NUMBER",
                            value: "2.5"
                        },
                        maxpoint: {
                            color: { red: 0, green: 1, blue: 0 }, // Green for 5
                            type: "NUMBER",
                            value: "5"
                        }
                    }
                },
                index: 0
            }
        });

        return requests;
    }

    /**
     * Fetches data from the stored ranges using batchGet.
     */
    fetchData() {
        const spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
        const ranges = [];

        // Since ranges may overlap, we need to keep track of the association
        this.rangeAssociations = [];

        for (const sheetName in this.averagesRanges) {
            const sheetRanges = this.averagesRanges[sheetName];

            ranges.push(sheetRanges.studentName);
            this.rangeAssociations.push({ type: 'studentName', sheetName });

            ranges.push(sheetRanges.completeness);
            this.rangeAssociations.push({ type: 'completeness', sheetName });

            ranges.push(sheetRanges.accuracy);
            this.rangeAssociations.push({ type: 'accuracy', sheetName });

            ranges.push(sheetRanges.spag);
            this.rangeAssociations.push({ type: 'spag', sheetName });
        }

        const response = Sheets.Spreadsheets.Values.batchGet(spreadsheetId, { ranges: ranges });
        this.retrievedData = response.valueRanges;
    }

    /**
     * Calculates overall averages for each student.
     */
    calculateAverages() {
        const studentData = {};

        for (let i = 0; i < this.retrievedData.length; i++) {
            const association = this.rangeAssociations[i];
            const values = this.retrievedData[i].values || [];

            values.forEach((row, index) => {
                const value = row[0];
                const studentIndex = `${association.sheetName}_${index}`;

                if (association.type === 'studentName') {
                    if (!studentData[studentIndex]) {
                        studentData[studentIndex] = { name: value };
                    } else {
                        studentData[studentIndex].name = value;
                    }
                } else {
                    const numericValue = parseFloat(value);
                    if (!studentData[studentIndex]) {
                        studentData[studentIndex] = {};
                    }
                    if (!studentData[studentIndex][association.type]) {
                        studentData[studentIndex][association.type] = 0;
                        studentData[studentIndex].count = 0;
                    }
                    if (!isNaN(numericValue)) {
                        studentData[studentIndex][association.type] += numericValue;
                    }
                    if (association.type === 'spag') {
                        studentData[studentIndex].count++;
                    }
                }
            });
        }

        // Prepare student averages array
        const studentMap = {};

        for (const key in studentData) {
            const data = studentData[key];
            const name = data.name;
            if (!studentMap[name]) {
                studentMap[name] = {
                    completeness: 0,
                    accuracy: 0,
                    spag: 0,
                    count: 0
                };
            }
            studentMap[name].completeness += data.completeness || 0;
            studentMap[name].accuracy += data.accuracy || 0;
            studentMap[name].spag += data.spag || 0;
            studentMap[name].count += data.count || 0;
        }

        this.studentAverages = [];

        for (const name in studentMap) {
            const data = studentMap[name];
            this.studentAverages.push({
                name: name,
                completeness: (data.completeness / data.count).toFixed(2),
                accuracy: (data.accuracy / data.count).toFixed(2),
                spag: (data.spag / data.count).toFixed(2)
            });
        }

        // Sort students alphabetically
        this.studentAverages.sort((a, b) => a.name.localeCompare(b.name));
    }
}
