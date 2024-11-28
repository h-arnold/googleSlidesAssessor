function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Overview')
    .addItem('Update Data', 'createMasterOverviewWithDynamicFormatting')
    .addToUi();
  }
  
  function createMasterOverviewWithDynamicFormatting() {
    // ==== Configuration ====
    const FOLDER_ID = 'THE FOLDER ID WHERE ALL THE ASSESSMENT RECORDS ARE'; // TODO: Replace with your Google Drive folder ID
    const OVERVIEW_SHEET_NAME = 'Overview'; // Name of the sheet to import data from
    const MASTER_OVERVIEW_SHEET_NAME = 'Master Overview'; // Name of the final overview sheet
    const CLASS_NAME_COLUMN_INDEX = 1; // Column index for Class Name (A=1)
    // ========================
  
    const masterSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
    // Get the folder containing class-specific spreadsheets
    const folder = DriveApp.getFolderById(FOLDER_ID);
    if (!folder) {
      SpreadsheetApp.getUi().alert('Folder not found. Please check the FOLDER_ID.');
      return;
    }
  
    // Get all Google Sheets in the folder
    const files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  
    // Object to organize spreadsheets by year group
    const yearGroups = {};
  
    // Helper function to convert column numbers to letters (e.g., 1 -> A, 27 -> AA)
    function columnToLetter(column) {
      let temp, letter = '';
      while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = Math.floor((column - temp - 1) / 26);
      }
      return letter;
    }
  
    // Helper function to apply header formatting
    function applyHeaderFormatting(sheet, numColumns) {
      const headerRange = sheet.getRange(1, 1, 1, numColumns);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#e5e5e5');
    }
  
    // Helper function to identify numerical columns
    function getNumericalColumns(data, excludeColumns = []) {
      const numColumns = data[0].length;
      const numericalColumns = [];
      for (let col = 0; col < numColumns; col++) {
        if (excludeColumns.includes(col)) continue;
        let isNumeric = true;
        for (let row = 1; row < data.length; row++) { // skip header
          const value = data[row][col];
          if (value === '' || value === null || value === undefined) continue; // skip empty cells
          if (typeof value !== 'number') {
            isNumeric = false;
            break;
          }
        }
        if (isNumeric) {
          numericalColumns.push(col + 1); // column numbers start at 1
        }
      }
      return numericalColumns;
    }
  
    // Helper function to apply conditional formatting
    function applyConditionalFormatting(sheet, numericalColumns, numDataRows) {
      const rules = [];
  
      numericalColumns.forEach(col => {
        const columnLetter = columnToLetter(col);
        const rangeA1 = `${columnLetter}2:${columnLetter}${numDataRows + 1}`; // Assuming headers are in row 1
        const range = sheet.getRange(rangeA1);
  
        // Color Scale Rule
        const colorScaleRule = SpreadsheetApp.newConditionalFormatRule()
          .setGradientMaxpointWithValue("#00FF00", SpreadsheetApp.InterpolationType.NUMBER, "5") // Green
          .setGradientMidpointWithValue("#FFFF00", SpreadsheetApp.InterpolationType.NUMBER, "2.5") // Yellow
          .setGradientMinpointWithValue("#FF0000", SpreadsheetApp.InterpolationType.NUMBER, "0") // Red        
          .setRanges([range])
          .build();
        rules.push(colorScaleRule);
  
        // 'N' Text Rule
        const nValueRule = SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo('N')
          .setBackground('#FF0000') // Red
          .setRanges([range])
          .build();
        rules.push(nValueRule);
      });
  
      // Apply all rules at once
      sheet.setConditionalFormatRules(rules);
    }
  
    // Helper function to apply freeze panes
    function applyFreezePanes(sheet) {
      sheet.setFrozenRows(1);
      sheet.setFrozenColumns(1);
    }
  
    // Iterate through each file in the folder
    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();
      const fileId = file.getId();
  
      try {
        // Parse the file name to extract the year group
        // Expected format: {year group}{class code}{subject}{class year}, e.g., "7A1 Digital Technology 2024-2025"
        const nameParts = fileName.split(' ');
        if (nameParts.length < 2) {
          Logger.log(`File name "${fileName}" does not match the expected naming convention. Skipping.`);
          continue; // Skip if naming convention doesn't match
        }
  
        const firstPart = nameParts[0];
        const yearGroupMatch = firstPart.match(/\d+/);
        if (!yearGroupMatch) {
          Logger.log(`No year group found in "${fileName}". Skipping.`);
          continue; // Skip if no year group found
        }
  
        const yearGroupNumber = yearGroupMatch[0];
        const yearGroup = 'Y' + yearGroupNumber; // Prepend 'Y' to the year group
  
        // Open the spreadsheet to access the Overview sheet
        const spreadsheet = SpreadsheetApp.openById(fileId);
        const overviewSheet = spreadsheet.getSheetByName(OVERVIEW_SHEET_NAME);
        if (!overviewSheet) {
          Logger.log(`'Overview' sheet not found in "${fileName}". Skipping.`);
          continue; // Skip if Overview sheet doesn't exist
        }
  
        // Determine the last row and last column with data
        const lastRow = overviewSheet.getLastRow();
        const lastColumn = overviewSheet.getLastColumn();
        if (lastRow < 3 || lastColumn < 2) { // At least two data rows and two columns ('Name' + data)
          Logger.log(`Insufficient data in 'Overview' sheet of "${fileName}". Skipping.`);
          continue; // Skip if Overview sheet has no data or only header and one data row
        }
  
        // Read all data from the Overview sheet
        const dataRange = overviewSheet.getRange(1, 1, lastRow, lastColumn);
        const data = dataRange.getValues();
  
        // Exclude the last two rows (Class Average and the preceding one)
        const dataWithoutAverage = data.slice(0, -2);
  
        // If no data remains after excluding average, skip
        if (dataWithoutAverage.length === 0) {
          Logger.log(`No data to import after excluding 'Class Average' in "${fileName}". Skipping.`);
          continue;
        }
  
        // Initialize the array for the year group if it doesn't exist
        if (!yearGroups[yearGroup]) {
          yearGroups[yearGroup] = {
            headers: [],
            data: []
          };
        }
  
        // Determine if this is the first class in the year group
        const isFirstClass = yearGroups[yearGroup].data.length === 0;
  
        // Remove header rows from the data in readiness for pasting it into the spreadsheet.
        const processedData = dataWithoutAverage.slice(1);
  
        if (isFirstClass) {
          yearGroups[yearGroup].headers = dataWithoutAverage[0];  
        }
  
        // Add a Class Name column
        const className = fileName; // You can modify this to extract a more specific class name if needed
        const classNameColumn = processedData.map(row => [className]);
  
        // Combine the class name with the data
        const combinedData = processedData.map((row, index) => row.concat(classNameColumn[index][0]));
  
        // Store the combined data in the yearGroups object
        yearGroups[yearGroup].data.push(...combinedData);
      } catch (error) {
        Logger.log(`Error processing file "${fileName}": ${error}`);
        continue; // Skip file on error
      }
    }
  
    // Iterate through each year group to create individual sheets
    for (const [yearGroup, groupData] of Object.entries(yearGroups)) {
      // Create or clear the sheet for the year group
      let sheet = masterSpreadsheet.getSheetByName(yearGroup);
      if (!sheet) {
        sheet = masterSpreadsheet.insertSheet(yearGroup);
      } else {
        sheet.clearContents();
      }
  
      // Prepare headers: Original headers (excluding 'Name') + 'Class Name'
      const headers = [...groupData.headers, 'Class Name'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
      // Set the combined data to the sheet starting from row 2
      if (groupData.data.length > 0) {
        sheet.getRange(2, 1, groupData.data.length, headers.length).setValues(groupData.data);
      }
  
      // Apply header formatting
      applyHeaderFormatting(sheet, headers.length);
  
      // Identify numerical columns (excluding 'Class Name' column)
      const dataForDetection = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
      const excludeColumns = [headers.length]; // Exclude 'Class Name' column (1-based index)
      const numericalColumns = getNumericalColumns(dataForDetection, excludeColumns.map(col => col - 1)); // Convert to 0-based
  
      // Apply conditional formatting to numerical columns
      const numDataRows = sheet.getLastRow() - 1; // Exclude header
      applyConditionalFormatting(sheet, numericalColumns, numDataRows);
  
      // Apply freeze panes
      applyFreezePanes(sheet);
    }
  
    // Create or clear the Master Overview sheet for averages
    let masterOverviewSheet = masterSpreadsheet.getSheetByName(MASTER_OVERVIEW_SHEET_NAME);
    if (!masterOverviewSheet) {
      masterOverviewSheet = masterSpreadsheet.insertSheet(MASTER_OVERVIEW_SHEET_NAME);
    } else {
      masterOverviewSheet.clearContents();
    }
  
    // Prepare headers for the Master Overview sheet
    // First column: Year Group
    // Subsequent columns: Same headers as year group sheets, excluding 'Name'
    // We'll assume all year group sheets have the same headers after excluding 'Name'
    const firstYearGroup = Object.keys(yearGroups)[0];
    if (!firstYearGroup) {
      SpreadsheetApp.getUi().alert('No data found to create Master Overview.');
      return;
    }
  
    const headersWithoutName = yearGroups[firstYearGroup].headers.slice(1);  
    const masterHeaders = ['Year Group', ...headersWithoutName]; //Removing first column as that has the name in it.
  
    // Set headers in Master Overview sheet
    masterOverviewSheet.getRange(1, 1, 1, masterHeaders.length).setValues([masterHeaders]);
  
    const overviewData = [];
  
  
    // Iterate through each year group to set up formulas for per-header averages
    for (const [yearGroup, groupData] of Object.entries(yearGroups)) {
      // Initialize the row with the Year Group name
      const row = [yearGroup];
  
      //Remove the name header
      delete groupData.headers[0]
  
      // For each header (excluding 'Name'), set a ROUND(AVERAGE()) formula
      groupData.headers.forEach(header => {
        // Assuming the corresponding year group sheet has the same header
        // Find the column letter in the year group sheet
        const sheet = masterSpreadsheet.getSheetByName(yearGroup);
        if (!sheet) {
          row.push('N/A');
          return;
        }
        const headersInSheet = groupData.headers;
        const columnIndex = headersInSheet.indexOf(header) + 1; // 1-based index
        if (columnIndex === 0) {
          row.push('N/A');
          return;
        }
        const columnLetter = columnToLetter(columnIndex);
        // Set the formula to calculate the average, excluding header row, rounded to two decimal places
        // Using dynamic last row
        const formula = `=IF(COUNT('${yearGroup}'!${columnLetter}2:${columnLetter})=0, "N/A", ROUND(AVERAGE('${yearGroup}'!${columnLetter}2:${columnLetter}), 2))`;
        row.push(formula);
      });
  
      // Add the row to overviewData
      overviewData.push(row);
    }
  
    // Set the overview data starting from row 2
    if (overviewData.length > 0) {
      masterOverviewSheet.getRange(2, 1, overviewData.length, masterHeaders.length).setFormulas(overviewData); 
    }
  
    // Apply header formatting to Master Overview
    applyHeaderFormatting(masterOverviewSheet, masterHeaders.length);
  
    // Identify numerical columns in Master Overview (excluding 'Year Group' column)
    const masterOverviewData = masterOverviewSheet.getRange(1, 1, masterOverviewSheet.getLastRow(), masterHeaders.length).getValues();
    const masterExcludeColumns = [masterHeaders.length]; // Exclude 'Year Group' column (1-based index)
    const masterNumericalColumns = getNumericalColumns(masterOverviewData, masterExcludeColumns.map(col => col - 1)); // Convert to 0-based
  
    // Apply conditional formatting to numerical columns in Master Overview
    const masterNumDataRows = masterOverviewSheet.getLastRow() - 1; // Exclude header
    applyConditionalFormatting(masterOverviewSheet, masterNumericalColumns, masterNumDataRows);
  
    // Apply freeze panes to Master Overview
    applyFreezePanes(masterOverviewSheet);
  
    // Notify the user that the script has finished running
    SpreadsheetApp.getUi().alert('Master Overview has been successfully created with formatted data!');
  }
  