/**
 * Updates the Overview sheet with student data and calculated averages.
 */
function updateOverviewSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const overviewSheet = getOrCreateOverviewSheet();
  const spreadsheetId = spreadsheet.getId();

  // Step 1: Retrieve data using batchGet
  const ranges = constructRangesForBatchGet();
  const retrievedData = Sheets.Spreadsheets.Values.batchGet(spreadsheetId, { ranges: ranges }).valueRanges;

  // Step 2: Merge and calculate overall averages
  const { averages, rowCount } = calculateOverallAverages(retrievedData);

  // Step 3: Sort students alphabetically (already sorted in calculateOverallAverages)
  averages.sort((a, b) => a.name.localeCompare(b.name));

  // Step 4: Write data to overview sheet using batchUpdate
  const requests = buildOverviewAveragesBatchUpdateRequest(averages, overviewSheet);

  // Step 5: Add average formulas to the 'Average' column and class averages row
  const averageFormulasRequests = addAverageFormulas(overviewSheet, rowCount);
  requests.push(...averageFormulasRequests);

  // Step 6: Apply conditional formatting
  const conditionalFormattingRequests = createOverviewConditionalFormattingRequests(overviewSheet, rowCount);
  requests.push(...conditionalFormattingRequests);

  // Execute all batch updates
  executeBatchUpdate(requests);
}

/**
 * Gets or creates the Overview sheet.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The Overview sheet.
 */
function getOrCreateOverviewSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Overview');

  // If there isn't an overview sheet, create one.
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Overview');
    createOverviewHeaders(sheet);
  } else { // If there is an overview sheet, clear it.
    clearSheet(sheet);
    createOverviewHeaders(sheet);
  }

  return sheet;
}

/**
 * Creates headers for the Overview sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to add headers to.
 */
function createOverviewHeaders(sheet) {
  const sheetId = sheet.getSheetId();
  const requests = [];

  // Create headers
  const headers = ['Name', 'Completeness', 'Accuracy', 'SPaG', 'Average'];
  const headerValuesRequest = {
    updateCells: {
      rows: [
        {
          values: headers.map(header => ({ userEnteredValue: { stringValue: header } }))
        }
      ],
      fields: 'userEnteredValue',
      start: { sheetId: sheetId, rowIndex: 0, columnIndex: 0 }
    }
  };
  requests.push(headerValuesRequest);

  // Apply formatting to headers
  const headerFormattingRequest = {
    repeatCell: {
      range: {
        sheetId: sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: headers.length
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE",
          textFormat: {
            bold: true
          },
          textRotation: {
            angle: 45
          }
        }
      },
      fields: "userEnteredFormat(backgroundColor, horizontalAlignment, verticalAlignment, textFormat, textRotation)"
    }
  };
  requests.push(headerFormattingRequest);

  // Define column width for the first column
  const firstColumnWidthRequest = {
    updateDimensionProperties: {
      range: {
        sheetId: sheetId,
        dimension: "COLUMNS",
        startIndex: 0,
        endIndex: 1
      },
      properties: {
        pixelSize: 200
      },
      fields: "pixelSize"
    }
  };
  requests.push(firstColumnWidthRequest);

  // Define column width for the remaining columns
  const remainingColumnsWidthRequest = {
    updateDimensionProperties: {
      range: {
        sheetId: sheetId,
        dimension: "COLUMNS",
        startIndex: 1,
        endIndex: headers.length
      },
      properties: {
        pixelSize: 75
      },
      fields: "pixelSize"
    }
  };
  requests.push(remainingColumnsWidthRequest);

  // Apply bold formatting to the name column
  const boldNameColumnRequest = {
    repeatCell: {
      range: {
        sheetId: sheetId,
        startRowIndex: 0,
        endRowIndex: sheet.getMaxRows(),
        startColumnIndex: 0,
        endColumnIndex: 1
      },
      cell: {
        userEnteredFormat: {
          textFormat: {
            bold: true
          }
        }
      },
      fields: "userEnteredFormat.textFormat.bold"
    }
  };
  requests.push(boldNameColumnRequest);

  // Execute the batch update
  executeBatchUpdate(requests);
}

/**
 * Constructs the ranges for batchGet.
 * @returns {string[]} The ranges for batchGet.
 */
function constructRangesForBatchGet() {
  console.log("Testing!");
  const documentProperties = PropertiesService.getDocumentProperties();
  const averagesRanges = JSON.parse(documentProperties.getProperty('averagesRanges'));
  console.log(averagesRanges);

  const ranges = [];
  for (const sheetName in averagesRanges) {
    console.log(sheetName);
    if (averagesRanges.hasOwnProperty(sheetName)) {
      console.log("An iteration of the average ranges collection has been started.");
      const sheetRanges = averagesRanges[sheetName];
      ranges.push(sheetRanges.studentName);
      ranges.push(sheetRanges.completeness);
      ranges.push(sheetRanges.accuracy);
      ranges.push(sheetRanges.spag);
      console.log(ranges);
    }
  }
  return ranges;
}

/**
 * Calculates the overall averages from the retrieved data.
 * @param {GoogleAppsScript.Sheets.Schema.ValueRange[]} data - The data retrieved from the sheets.
 * @returns {{averages: Object[], rowCount: number}} The averages and the row count.
 */
function calculateOverallAverages(data) {
  const studentData = {};
  let row = 0;
  let col = 0;
  const totalRows = data[0].values.length;
  const totalCols = data.length;
  const totalIterations = totalRows * (totalCols / 4);

  for (let i = 0; i < totalIterations; i++) {
    const name = data[col].values[row];
    const completeness = parseFloat(data[col + 1].values[row]);
    const accuracy = parseFloat(data[col + 2].values[row]);
    const spag = parseFloat(data[col + 3].values[row]);

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
    row++;

    if (row === totalRows) {
      row = 0;
      col += 4;
    }
  }

  const averages = [];
  for (const student in studentData) {
    if (studentData.hasOwnProperty(student)) {
      const data = studentData[student];
      averages.push({
        name: student,
        completeness: (data.completeness / data.count).toFixed(2),
        accuracy: (data.accuracy / data.count).toFixed(2),
        spag: (data.spag / data.count).toFixed(2)
      });
    }
  }

  averages.sort((a, b) => a.name.localeCompare(b.name));
  return { averages, rowCount: averages.length };
}

/**
 * Adds average formulas to the Overview sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to add formulas to.
 * @param {number} rowCount - The number of rows of student data.
 * @returns {Object[]} The requests to add the formulas.
 */
function addAverageFormulas(sheet, rowCount) {
  const sheetId = sheet.getSheetId();
  const requests = [];

  for (let i = 0; i < rowCount; i++) {
    const rowIndex = i + 1; // Adjust for zero-indexing
    const formula = `=IFERROR(ROUND(AVERAGE(B${rowIndex + 1}:D${rowIndex + 1}), 1),0)`;
    requests.push({
      updateCells: {
        rows: [
          {
            values: [
              {
                userEnteredValue: { formulaValue: formula },
                userEnteredFormat: {
                  horizontalAlignment: "CENTER",
                  verticalAlignment: "MIDDLE",
                  textFormat: { bold: false }
                }
              }
            ]
          }
        ],
        fields: 'userEnteredValue,userEnteredFormat',
        start: { sheetId: sheetId, rowIndex: rowIndex, columnIndex: 4 } // Column E for Average
      }
    });
  }

  // Add a blank row
  const blankRowIndex = rowCount + 1;
  requests.push({
    updateCells: {
      rows: [{}],
      fields: 'userEnteredValue',
      start: { sheetId: sheetId, rowIndex: blankRowIndex, columnIndex: 0 }
    }
  });

  // Add the class averages row
  const classAverageRowIndex = blankRowIndex + 1;
  const classAverageFormulae = [
    {
      userEnteredValue: { stringValue: "Class Average" },
      userEnteredFormat: { textFormat: { bold: true } }
    }
  ];

  //Header references are hardcoded for now as this code only assesses against, completeness, accuracy and SPaG. If you want to jazz it up and make it work better, please submit a PR and it will be gratefully recieved. :)

  const columns = ['B', 'C', 'D', 'E'];
  columns.forEach((col, index) => {
    const formula = `=IFERROR(ROUND(AVERAGE(${col}2:${col}${rowCount + 1}), 1),0)`;
    classAverageFormulae.push({
      userEnteredValue: { formulaValue: formula },
      userEnteredFormat: {
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE",
        textFormat: { bold: true }
      }
    });
  });

  requests.push({
    updateCells: {
      rows: [
        {
          values: classAverageFormulae
        }
      ],
      fields: 'userEnteredValue,userEnteredFormat',
      start: { sheetId: sheetId, rowIndex: classAverageRowIndex, columnIndex: 0 }
    }
  });

  return requests;
}
