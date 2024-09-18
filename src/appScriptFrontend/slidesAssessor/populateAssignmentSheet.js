//You can find the url and prompt IDs by opening up your instance of langflow, and clicking on the 'API' button in the Google Slides Assessor Flow.
//TODO: call the config function when the user runs the showAssignmentDropdown function.
//Also TODO: Get rid of these global variables and implement calling from the script properties properly.
var CONFIG_KEYS = {
  URL: 'url',
  LANGFLOW_REFERENCE_CONTENT_ID: 'langflowReferenceContentId',
  LANGFLOW_REFERENCE_KEYS_ID: 'langflowReferenceKeysId',
  REF_SLIDES_PARSER_URL: 'refSlidesParserUrl',
  REF_SLIDES_TWEAK_ID: 'refSlidesTweakId',
  WARM_UP_LLM_URL: 'warmUpLlmUrl',
  API_KEY: 'apiKey'
};

// Cache for configuration
let configCache = null;
var url = getUrl()
var langflowReferenceContentId = getLangflowReferenceContentId();
var langflowReferenceKeysId = getLangflowReferenceKeysId();
var refSlidesParserUrl = getRefSlidesParserUrl();
var refSlidesTweakId = getRefSlidesTweakId();
var warmUpLlmUrl = getWarmUpLlmUrl();
var apiKey = getApiKey();



/**
 * Extracts and processes all student work for the given assignment and updates the Google Sheet with the results.
 * @param {Array.<Object>} students - List of students.
 * @param {string} courseId - The course ID.
 * @param {string} assignmentId - The assignment ID.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet object to update.
 * @param {string} referenceSlideId - The slide ID of the reference content.
 */
function extractAndPopulateAllStudentWork(students, courseId, assignmentId, sheet, referenceSlideId) {
  let data = [];
  const referenceSlidesContent = getReferenceSlideData(referenceSlideId); // Extract reference slide content
  let headersSet = false;
  let cache = CacheService.getScriptCache();
  
  let requests = [];
  let cacheResults = [];
  const batchSize = getBatchSize();

  // Iterate over each student
  students.forEach((student, index) => {
    
    // Sends a toast notification alerting the user to which student is currently being processed.
    toastMessage(`Currently processing ${student.profile.name.fullName} `);
    
    const slideDetails = getStudentSlideId(courseId, assignmentId, student.userId); // Get student slide details
    //TODO: Handle null returns (i.e. no file, which means that the sutdent has deleted their work) by sending a custom message to the LLM saying (student submitted no work, give Ns for everything)
    if (slideDetails !== null) {
      const slideData = extractContentFromSlides(slideDetails.fileId); // Extract student slide content
      const cacheKey = generateHash(JSON.stringify(slideData) + referenceSlidesContent); // Generate cache key
      const cachedData = cache.get(cacheKey); // Check if data is in cache

      if (cachedData) {
        console.log(`Cached data for ${student.profile.name.fullName}: ${cachedData}`)
        let studentData = JSON.parse(cachedData);
        let preparedData = prepareStudentData(studentData, student, headersSet, sheet, index + 1);
        headersSet = preparedData.headersRequests ? true : headersSet;
        data.push(preparedData);
      } else {
        let request = prepareStudentRequest(referenceSlidesContent, slideData.textData); //Logic will need to be updated to handle image data when langflow supports that properly.
        requests.push(request); // Add request to batch
        cacheResults.push({ cacheKey, index, student, slideData });
      }
    }
  });

  // Process requests in batches
  if (requests.length > 0) {
    toastMessage("Sending off first batch. The first one can sometimes be a bit slow so be patient!");

    for (let i = 0; i < requests.length; i += batchSize) {
      let batchRequests = requests.slice(i, i + batchSize); // Slice requests into batches
      let batchResponses = fetchUrls(batchRequests);

      batchResponses.forEach((response, j) => {
        let studentData = processResponse(response, batchRequests[j]);
        let resultIndex = i + j;
        cache.put(cacheResults[resultIndex].cacheKey, JSON.stringify(studentData), 21600); // Cache for 6 hours
        let preparedData = prepareStudentData(studentData, cacheResults[resultIndex].student, headersSet, sheet, cacheResults[resultIndex].index + 1);
        headersSet = preparedData.headersRequests ? true : headersSet;
        data.push(preparedData);
        toastMessage(`Batch of ${batchSize} responses processed. ${requests.length - resultIndex} to go!`);
      });
    }
  }

  applyBatchUpdate(data, sheet); // Update Google Sheet with the processed data
  storeAveragesRange(students.length, sheet, data); // Store the average range in the Google Sheet
}

/**
 * Creates all the values that are needed to populate a row of assessment data.
 * @param {Object} studentData - Data of the student.
 * @param {Object} student - The student object.
 * @param {boolean} headersSet - Whether the headers have been set.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet object to update.
 * @param {number} rowIndex - The row index for the student.
 * @return {Object} The prepared student data.
 */
function prepareStudentData(studentData, student, headersSet, sheet, rowIndex) {
  let { rowData, notesData, completenessCells, accuracyCells, spagCells } = initializeStudentData(student, rowIndex);

  Object.keys(studentData).forEach(function(task) {
    const taskData = studentData[task];   
    ({ rowData, notesData, completenessCells, accuracyCells, spagCells } = addTaskData(taskData, rowData, notesData, completenessCells, accuracyCells, spagCells, rowIndex));
  });

  const averages = calculateAverages(completenessCells, accuracyCells, spagCells);
  rowData.push(...averages);

  if (!headersSet) {
    var { headersRequests, headers } = createHeaders(sheet, studentData);
    headersSet = true;
  }

  return { rowData, notesData, headersRequests, headers };
}

/**
 * Initialises student data.
 * @param {Object} student - The student object.
 * @return {Object} The initialised student data.
 */
function initializeStudentData(student) {
  return {
    rowData: [{ userEnteredValue: { stringValue: student.profile.name.fullName } }],
    notesData: [],
    completenessCells: [],
    accuracyCells: [],
    spagCells: []
  };
}

/**
 * This function takes the returned data from Langflow and creates a batchUpdate request for that particular row.
 * It also formats any Markdown tables within taskData.studentResponse to have consistent column widths.
 * @param {Object} taskData - The task data.
 * @param {Array.<Object>} rowData - The row data.
 * @param {Array.<string>} notesData - The notes data.
 * @param {Array.<string>} completenessCells - The completeness cells.
 * @param {Array.<string>} accuracyCells - The accuracy cells.
 * @param {Array.<string>} spagCells - The SPaG cells.
 * @param {number} rowIndex - The row index for the student.
 * @return {Object} The updated task data.
 */
function addTaskData(taskData, rowData, notesData, completenessCells, accuracyCells, spagCells, rowIndex) {
  const currentColumnIndex = rowData.length; // Current length of rowData

  // Format studentResponse if it contains Markdown tables - this happens after the data has been returned from the LLM because it saves on unnessecary token costs and *may* improve machine readbility.
  const formattedStudentResponse = formatMarkdownTablesInText(taskData.studentResponse);

  // Add Completeness Data
  rowData.push({ userEnteredValue: returnNifZero(taskData.completeness) });
  completenessCells.push(getColumnLetter(currentColumnIndex) + (rowIndex + 2));
  notesData.push(
    "# Reasoning:\n\n" + taskData.completeness_reasoning + 
    "\n\n# Student Response:\n\n" + formattedStudentResponse
  );

  // Add Accuracy Data
  rowData.push({ userEnteredValue: returnNifZero(taskData.accuracy) }); 
  accuracyCells.push(getColumnLetter(currentColumnIndex + 1) + (rowIndex + 2));
  notesData.push(
    "# Reasoning:\n\n" + taskData.accuracy_reasoning + 
    "\n\n# Student Response:\n\n" + formattedStudentResponse
  );

  // Add SPaG Data
  rowData.push({ userEnteredValue: returnNifZero(taskData.SPaG) });
  spagCells.push(getColumnLetter(currentColumnIndex + 2) + (rowIndex + 2));
  notesData.push(
    "### Reasoning ###\n\n" + taskData.SPaG_reasoning + 
    "\n\n### Student Response ###\n\n" + formattedStudentResponse
  );

  return { rowData, notesData, completenessCells, accuracyCells, spagCells };
}

/**
 * Calculates the averages for the given cells.
 * @param {Array.<string>} completenessCells - The completeness cells.
 * @param {Array.<string>} accuracyCells - The accuracy cells.
 * @param {Array.<string>} spagCells - The SPaG cells.
 * @return {Array.<Object>} The calculated averages.
 */
function calculateAverages(completenessCells, accuracyCells, spagCells) {
  const completenessFormula = `=IFERROR(ROUND(AVERAGEA(${completenessCells.join(",")}),1),0)`;
  const accuracyFormula = `=IFERROR(ROUND(AVERAGE(${accuracyCells.join(",")}),1),0)`;
  const spagFormula = `=IFERROR(ROUND(AVERAGE(${spagCells.join(",")}),1),0)`;

  return [
    { userEnteredValue: { formulaValue: completenessFormula } },
    { userEnteredValue: { formulaValue: accuracyFormula } },
    { userEnteredValue: { formulaValue: spagFormula } }
  ];
}

/**
 * Replaces zeros with 'N's to make averaging easier. Returns a full batchUpdate cell value.
 * @param {string|number} cellValue - The cell value.
 * @return {Object} The formatted cell value.
 */
function returnNifZero(cellValue) {
  if (parseInt(cellValue) !== 0) {
    return { numberValue: cellValue };
  } else {
    return { stringValue: "N" };
  }
}

/**
 * Creates a sheet for the assignment you've chosen to mark, if it doesn't exist already.
 * @param {string} courseId - The course ID.
 * @param {string} assignmentId - The assignment ID.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The new or cleared sheet.
 */
function createAssignmentSheet(courseId, assignmentId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const assignmentName = getAssignmentName(courseId, assignmentId);
  const sheetName = assignmentName ? assignmentName : 'Assignment';

  // Create a new sheet with the assignment name
  let newSheet = sheet.getSheetByName(sheetName);
  if (!newSheet) {
    newSheet =

 sheet.insertSheet(sheetName);
  } else {
    clearSheet(newSheet); // Clear the existing sheet
  }
  return newSheet;
}

/**
 * Creates the batchUpdate request object that will calculate the class average for each task.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet object to update.
 * @param {Array.<Object>} data - The data to be processed.
 * @return {Array.<Object>} The batch update requests.
 */
function addClassAverageRow(sheet, data) {
  const sheetId = sheet.getSheetId();
  const lastRowIndex = data.length + 2; // Data rows plus header rows
  const averageRowIndex = lastRowIndex + 1; // One blank row in between

  const requests = [];

  // Add blank row
  requests.push({
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

  const numColumns = data[0].headers[1].length;
  for (let col = 1; col < numColumns; col++) {
    const columnLetter = getColumnLetter(col); // Adjust to start from Column B
    const formula = `=IFERROR(ROUND(AVERAGE(${columnLetter}3:${columnLetter}${lastRowIndex}),1),0)`;
    rowData.push({ userEnteredValue: { formulaValue: formula } });
  }

  // Add Class Average row
  requests.push({
    updateCells: {
      rows: [{ values: rowData }],
      fields: 'userEnteredValue,userEnteredFormat.textFormat',
      start: { sheetId: sheetId, rowIndex: averageRowIndex, columnIndex: 0 }
    }
  });

  return requests;
}

/**
 * Stores the range containing the average values for each student in the document property store. The ranges stored here are used by the updateOverviewSheet function to create an average for each student over all the work they have completed.
 * @param {number} numStudents - The number of students.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet object to update.
 * @param {Array.<Object>} data - The data to be processed.
 */
function storeAveragesRange(numStudents, sheet, data) {
  const documentProperties = PropertiesService.getDocumentProperties();
  const sheetName = sheet.getName();
  const firstRow = 3; // Starting from row 3
  const lastRow = firstRow + numStudents - 1;
  
  // Infer column indices based on array positions
  const studentNameColumnIndex = 0; // Student name is always the first item in the array
  const completenessColumnIndex = data[0].rowData.length - 3; // Assuming Completeness is 3rd last
  const accuracyColumnIndex = data[0].rowData.length - 2; // Assuming Accuracy is 2nd last
  const spagColumnIndex = data[0].rowData.length - 1; // Assuming SPaG is last

  const nameRange = sheetName + "!" + getColumnLetter(0) + firstRow + ':' + getColumnLetter(0) + lastRow;
  const studentNameRange = sheetName + "!" + getColumnLetter(studentNameColumnIndex) + firstRow + ':' + getColumnLetter(studentNameColumnIndex) + lastRow;
  const completenessRange = sheetName + "!" + getColumnLetter(completenessColumnIndex) + firstRow + ':' + getColumnLetter(completenessColumnIndex) + lastRow;
  const accuracyRange = sheetName + "!" + getColumnLetter(accuracyColumnIndex) + firstRow + ':' + getColumnLetter(accuracyColumnIndex) + lastRow;
  const spagRange = sheetName + "!" + getColumnLetter(spagColumnIndex) + firstRow + ':' + getColumnLetter(spagColumnIndex) + lastRow;

  // Retrieve existing ranges
  const existingRanges = documentProperties.getProperty('averagesRanges');
  const ranges = existingRanges ? JSON.parse(existingRanges) : {};

  // Add new ranges
  ranges[sheetName] = {
    name: nameRange,
    studentName: studentNameRange,
    completeness: completenessRange,
    accuracy: accuracyRange,
    spag: spagRange
  };

  // Store updated ranges
  documentProperties.setProperty('averagesRanges', JSON.stringify(ranges));
}
