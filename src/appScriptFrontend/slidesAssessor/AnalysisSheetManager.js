//AnalysisSheetManager.gs

/**
 * AnalysisSheetManager Class
 * 
 * Handles the creation and formatting of the analysis sheet for a given assignment.
 */
class AnalysisSheetManager {
    /**
     * Constructs an AnalysisSheetManager instance.
     * @param {Assignment} assignment - The Assignment instance containing all the data.
     */
    constructor(assignment) {
        this.assignment = assignment;
        this.sheet = null;
        this.requests = []; // To collect batchUpdate requests
        this.headers = {
            topHeaders: [],
            subHeaders: []
        };
    }

    /**
     * Creates or retrieves the analysis sheet for the assignment.
     */
    createOrGetSheet() {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheetName = this.assignment.assignmentName || `Assignment ${this.assignment.assignmentId}`;
        this.sheet = spreadsheet.getSheetByName(sheetName);

        if (!this.sheet) {
            this.sheet = spreadsheet.insertSheet(sheetName);
        } else {
            // Clear existing content and formatting
            this.clearSheet();
        }
    }


    /**
     * Clears the content and formatting of the sheet.
     */
    clearSheet() {
        this.sheet.clear();
        this.sheet.clearFormats();
        this.sheet.clearNotes();
        this.sheet.clearConditionalFormatRules();
    }

    /**
     * Prepares the data and builds batchUpdate requests.
     */
    prepareData() {
        this.extractHeaders();
        this.createHeadersRequests();
        this.createDataRowsRequests();
        this.applyFormatting();
        this.addClassAverageRow();
    }

    /**
     * Extracts headers based on the tasks in the assignment.
     */
    extractHeaders() {
        // Initialize headers
        this.headers.topHeaders = ['']; // First cell empty
        this.headers.subHeaders = ['Name']; // First subheader is 'Name'

        // Loop through tasks to build headers
        const taskKeys = Object.keys(this.assignment.tasks);
        taskKeys.forEach(taskKey => {
            const task = this.assignment.tasks[taskKey];
            this.headers.topHeaders.push(task.taskTitle, '', '');
            this.headers.subHeaders.push('Completeness', 'Accuracy', 'SPaG');
        });

        // Add 'Averages' headers
        this.headers.topHeaders.push('Averages', '', '');
        this.headers.subHeaders.push('Completeness', 'Accuracy', 'SPaG');
    }

    /**
     * Creates batchUpdate requests for setting header values and formatting.
     */
    createHeadersRequests() {
        const sheetId = this.sheet.getSheetId();

        // Ensure sheet has enough columns
        this.ensureSheetHasEnoughColumns(this.headers.topHeaders.length);

        // Create header value requests
        this.requests.push(this.createHeaderValuesRequest(sheetId, this.headers.topHeaders, 0));
        this.requests.push(this.createHeaderValuesRequest(sheetId, this.headers.subHeaders, 1));

        // Add header formatting requests
        this.requests.push(this.createHeaderFormattingRequest(sheetId, this.headers.topHeaders.length));
        this.requests.push(this.createSecondRowFormattingRequest(sheetId, this.headers.topHeaders.length));

        // Add merge requests for task headers
        this.requests.push(...this.createMergeRequests(sheetId, this.headers.topHeaders));
    }

    /**
     * Ensures the sheet has enough columns to accommodate the data.
     * @param {number} requiredColumns - The number of columns required.
     */
    ensureSheetHasEnoughColumns(requiredColumns) {
        const sheetId = this.sheet.getSheetId();
        const currentColumns = this.sheet.getMaxColumns();
        if (currentColumns < requiredColumns) {
            this.requests.push({
                appendDimension: {
                    sheetId: sheetId,
                    dimension: "COLUMNS",
                    length: requiredColumns - currentColumns
                }
            });
        }
    }

    /**
     * Creates a request to set header values in the sheet.
     * @param {number} sheetId - The ID of the sheet.
     * @param {Array<string>} headers - The header values to set.
     * @param {number} rowIndex - The row index to start setting the header values.
     * @return {Object} - A request to update cells with header values.
     */
    createHeaderValuesRequest(sheetId, headers, rowIndex) {
        return {
            updateCells: {
                rows: [
                    {
                        values: headers.map(header => ({ userEnteredValue: { stringValue: header } }))
                    }
                ],
                fields: 'userEnteredValue',
                start: { sheetId: sheetId, rowIndex: rowIndex, columnIndex: 0 }
            }
        };
    }

    /**
     * Creates a request to format header cells in the sheet.
     * @param {number} sheetId - The ID of the sheet.
     * @param {number} headerLength - The number of header columns to format.
     * @returns {Object} - A request to format header cells.
     */
    createHeaderFormattingRequest(sheetId, headerLength) {
        return {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 0,
                    endRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: headerLength
                },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                        horizontalAlignment: "CENTER",
                        verticalAlignment: "MIDDLE",
                        textFormat: {
                            bold: true
                        }
                    }
                },
                fields: "userEnteredFormat(backgroundColor, horizontalAlignment, verticalAlignment, textFormat)"
            }
        };
    }

    /**
     * Creates merge requests for task headers.
     * @param {number} sheetId - The ID of the sheet.
     * @param {Array<string>} topHeaders - The top headers to create merge requests for.
     * @returns {Array} - An array of merge requests.
     */
    createMergeRequests(sheetId, topHeaders) {
        let mergeRequests = [];
        let columnIndex = 1; // Start after the first column (Name)
        for (let i = 1; i < topHeaders.length - 3; i += 3) {
            mergeRequests.push({
                mergeCells: {
                    range: {
                        sheetId: sheetId,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: columnIndex,
                        endColumnIndex: columnIndex + 3
                    },
                    mergeType: "MERGE_ALL"
                }
            });
            columnIndex += 3;
        }

        // Merge the 'Averages' header
        mergeRequests.push({
            mergeCells: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: columnIndex,
                    endColumnIndex: columnIndex + 3
                },
                mergeType: "MERGE_ALL"
            }
        });

        return mergeRequests;
    }

    /**
     * Creates a request to format the second row of headers in the sheet.
     * @param {number} sheetId - The ID of the sheet.
     * @param {number} headerLength - The number of header columns to format.
     * @returns {Object} - A request to format the second row of headers.
     */
    createSecondRowFormattingRequest(sheetId, headerLength) {
        return {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    endRowIndex: 2,
                    startColumnIndex: 1,
                    endColumnIndex: headerLength
                },
                cell: {
                    userEnteredFormat: {
                        textRotation: {
                            angle: 45,
                        },
                        horizontalAlignment: "CENTER",
                        verticalAlignment: "MIDDLE"
                    }
                },
                fields: "userEnteredFormat(textRotation, horizontalAlignment, verticalAlignment)"
            }
        };
    }

    createDataRowsRequests() {
        const sheetId = this.sheet.getSheetId();
        const startRowIndex = 2; // Data starts after headers

        this.assignment.studentTasks.forEach((studentTask, studentIndex) => {
            const rowData = [];
            const notesData = [];
            const completenessCells = [];
            const accuracyCells = [];
            const spagCells = [];

            // First cell is student name
            rowData.push({ userEnteredValue: { stringValue: studentTask.student.name } });

            // Initialize column index
            let currentColumnIndex = 1;

            // For each task
            Object.keys(this.assignment.tasks).forEach(taskKey => {
                const response = studentTask.getResponse(taskKey);
                if (response && response.assessment) {


                    // Completeness
                    const completeness = response.assessment['completeness']?.score;
                    if (typeof completeness === 'number') {
                        rowData.push({ userEnteredValue: { numberValue: completeness } });
                    } else {
                        rowData.push({ userEnteredValue: { stringValue: 'N' } });
                    }
                    const completenessReasoning = response.assessment['completeness']?.reasoning || 'No reasoning provided.';
                    notesData.push({
                        note: this.formatNote(
                            completenessReasoning,
                            response.response
                        ),
                        columnOffset: currentColumnIndex
                    });
                    completenessCells.push(Utils.getColumnLetter(currentColumnIndex) + (startRowIndex + studentIndex + 1));
                    currentColumnIndex++;

                    // Accuracy
                    const accuracy = response.assessment['accuracy']?.score;
                    if (typeof accuracy === 'number') {
                        rowData.push({ userEnteredValue: { numberValue: accuracy } });
                    } else {
                        rowData.push({ userEnteredValue: { stringValue: 'N' } });
                    }
                    const accuracyReasoning = response.assessment['accuracy']?.reasoning || 'No reasoning provided.';
                    notesData.push({
                        note: this.formatNote(
                            accuracyReasoning,
                            response.response
                        ),
                        columnOffset: currentColumnIndex
                    });
                    accuracyCells.push(Utils.getColumnLetter(currentColumnIndex) + (startRowIndex + studentIndex + 1));
                    currentColumnIndex++;

                    // SPaG
                    const spag = response.assessment['spag']?.score;
                    if (typeof spag === 'number') {
                        rowData.push({ userEnteredValue: { numberValue: spag } });
                    } else {
                        rowData.push({ userEnteredValue: { stringValue: 'N' } });
                    }
                    const spagReasoning = response.assessment['spag']?.reasoning || 'No reasoning provided.';
                    notesData.push({
                        note: this.formatNote(
                            spagReasoning,
                            response.response
                        ),
                        columnOffset: currentColumnIndex
                    });
                    spagCells.push(Utils.getColumnLetter(currentColumnIndex) + (startRowIndex + studentIndex + 1));
                    currentColumnIndex++;

                } else {
                    // If no assessment, fill with 'N'
                    rowData.push({ userEnteredValue: { stringValue: 'N' } });
                    rowData.push({ userEnteredValue: { stringValue: 'N' } });
                    rowData.push({ userEnteredValue: { stringValue: 'N' } });
                    currentColumnIndex += 3;
                }
            });

            // Averages formulas
            const completenessFormula = `=IFERROR(ROUND(AVERAGEA(${completenessCells.join(",")}),1),0)`;
            const accuracyFormula = `=IFERROR(ROUND(AVERAGEA(${accuracyCells.join(",")}),1),0)`;
            const spagFormula = `=IFERROR(ROUND(AVERAGEA(${spagCells.join(",")}),1),0)`;
            rowData.push({ userEnteredValue: { formulaValue: completenessFormula } });
            rowData.push({ userEnteredValue: { formulaValue: accuracyFormula } });
            rowData.push({ userEnteredValue: { formulaValue: spagFormula } });

            // Build the request to update cells
            this.requests.push({
                updateCells: {
                    rows: [{
                        values: rowData
                    }],
                    fields: 'userEnteredValue',
                    start: { sheetId: sheetId, rowIndex: startRowIndex + studentIndex, columnIndex: 0 }
                }
            });


            // Add notes for each cell
            notesData.forEach(noteData => {
                this.requests.push({
                    updateCells: {
                        rows: [{
                            values: [{ note: noteData.note }]
                        }],
                        fields: 'note',
                        start: {
                            sheetId: sheetId,
                            rowIndex: startRowIndex + studentIndex,
                            columnIndex: noteData.columnOffset
                        }
                    }
                });
            });

        });
    }


    /**
     * Applies formatting to the sheet, including conditional formatting and column widths.
     */
    applyFormatting() {
        const sheetId = this.sheet.getSheetId();
        const numRows = this.assignment.studentTasks.length + 2; // Data rows plus header rows
        const numColumns = this.headers.subHeaders.length;

        // Apply cell formatting
        this.requests.push({
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 2, // After headers
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

        // Set column widths
        const columnWidths = this.calculateColumnWidths();
        this.requests.push(...this.createColumnWidthRequests(sheetId, columnWidths));

        // Freeze headers and name column
        this.requests.push(this.createFreezeRequest(sheetId));
    }

    /**
 * Creates conditional formatting requests for the data cells, including the class average row.
 * @param {number} sheetId - The ID of the sheet.
 * @param {number} dataRowCount - The number of data rows (excluding headers, blank row, and class average row).
 * @param {number} numColumns - The number of columns to format.
 * @returns {Array<Object>} - An array of conditional formatting requests.
 */
    createConditionalFormattingRequests(sheetId, dataRowCount, numColumns) {
        const requests = [];
        const dataStartRowIndex = 2; // Data starts after headers
        const blankRowCount = 1;
        const classAverageRowCount = 1;
        const startRowIndex = dataStartRowIndex;
        const endRowIndex = startRowIndex + dataRowCount + blankRowCount + classAverageRowCount;
        const startColumnIndex = 1; // Assuming the first column is for names
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

        // Formatting for 'N' values
        requests.push({
            addConditionalFormatRule: {
                rule: {
                    ranges: [range],
                    booleanRule: {
                        condition: {
                            type: "TEXT_EQ",
                            values: [{ userEnteredValue: "N" }]
                        },
                        format: {
                            backgroundColor: { red: 0.8, green: 0.8, blue: 0.8 } // Gray for 'N'
                        }
                    }
                },
                index: 0
            }
        });

        return requests;
    }


    /**
     * Calculates the widths of columns based on headers.
     * @returns {Array<number>} - An array of column widths.
     */
    calculateColumnWidths() {
        const columnWidths = [];
        // First column (Name) width
        columnWidths.push(200);

        // Other columns
        const numColumns = this.headers.subHeaders.length;
        for (let i = 1; i < numColumns; i++) {
            columnWidths.push(75);
        }

        return columnWidths;
    }

    /**
     * Creates requests to set column widths in the sheet.
     * @param {number} sheetId - The ID of the sheet.
     * @param {Array<number>} columnWidths - The widths of the columns to set.
     * @returns {Array<Object>} - An array of requests to update column widths.
     */
    createColumnWidthRequests(sheetId, columnWidths) {
        const requests = [];
        columnWidths.forEach((width, index) => {
            requests.push({
                updateDimensionProperties: {
                    range: {
                        sheetId: sheetId,
                        dimension: "COLUMNS",
                        startIndex: index,
                        endIndex: index + 1
                    },
                    properties: {
                        pixelSize: width
                    },
                    fields: "pixelSize"
                }
            });
        });
        return requests;
    }

    /**
     * Creates a request to freeze the first two rows and first column in the sheet.
     * @param {number} sheetId - The ID of the sheet.
     * @returns {Object} - A request to freeze rows and columns.
     */
    createFreezeRequest(sheetId) {
        return {
            updateSheetProperties: {
                properties: {
                    sheetId: sheetId,
                    gridProperties: {
                        frozenRowCount: 2,
                        frozenColumnCount: 1
                    }
                },
                fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount'
            }
        };
    }

    /**
     * Adds the class average row to the sheet.
     */
    addClassAverageRow() {
        const sheetId = this.sheet.getSheetId();
        const lastRowIndex = this.assignment.studentTasks.length + 2; // Data rows plus header rows
        const averageRowIndex = lastRowIndex + 1; // One blank row in between

        // Add blank row
        this.requests.push({
            updateCells: {
                rows: [{}],
                fields: 'userEnteredValue',
                start: { sheetId: sheetId, rowIndex: lastRowIndex, columnIndex: 0 }
            }
        });

        // Prepare Class Average row
        const rowData = [
            { userEnteredValue: { stringValue: 'Class Average' }, userEnteredFormat: { textFormat: { bold: true } } }
        ];

        const numColumns = this.headers.subHeaders.length;
        for (let col = 1; col < numColumns; col++) {
            const columnLetter = Utils.getColumnLetter(col); // Adjust to start from Column B
            const formula = `=IFERROR(ROUND(AVERAGE(${columnLetter}3:${columnLetter}${lastRowIndex}),1),0)`;
            rowData.push({ userEnteredValue: { formulaValue: formula } });
        }

        // Add Class Average row
        this.requests.push({
            updateCells: {
                rows: [{ values: rowData }],
                fields: 'userEnteredValue,userEnteredFormat.textFormat',
                start: { sheetId: sheetId, rowIndex: averageRowIndex, columnIndex: 0 }
            }
        });
    }

    /**
 * Formats the note content with the specified reasoning and student response.
 * @param {string} reasoning - The reasoning text.
 * @param {string} studentResponse - The student's response text.
 * @return {string} - The formatted note content.
 */
    formatNote(reasoning, studentResponse) {
        return `Reasoning\n========\n${reasoning}\n\nStudent Response\n===============\n${studentResponse}`;
    }


    /**
     * Executes all batchUpdate requests collected.
     */
    executeBatchUpdate() {
        const spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
        try {
            Sheets.Spreadsheets.batchUpdate({ requests: this.requests }, spreadsheetId);
        } catch (e) {
            console.error("Error executing batch update:", e);
            throw new Error(`Error applying batch update. ${e.message}`);
        }
    }

    /**
     * Main method to create and populate the analysis sheet.
     */
    createAnalysisSheet() {
        this.createOrGetSheet();
        this.prepareData();
        this.executeBatchUpdate();
    }
}
