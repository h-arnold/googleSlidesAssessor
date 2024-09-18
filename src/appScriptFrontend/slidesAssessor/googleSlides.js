// Extracts text (and now images) from Google Slides. Needs the slideId as a parameter.
// Function renamed for clarity.

 /**
  * Extracts text and images from a Google Slides presentation.
  * If a table is detected, it's converted to Markdown format.
  * @param {string} slideId - The ID of the Google Slides presentation.
  * @return {Object} - An object containing the extracted text data and images.
  */
function extractContentFromSlides(slideId) { // Renamed function
  // Open the presentation by its ID
  const presentation = SlidesApp.openById(slideId);
  const slides = presentation.getSlides();

  const result = {
    textData: {},
    images: []
  };

  // Iterate over each slide
  slides.forEach(function(slide) {
    const pageElements = slide.getPageElements();

    // Iterate over each element in the slide
    pageElements.forEach(function(pageElement) {
      // Get the description of the page element
      let pageElementDescription = pageElement.getDescription();
      
      // Check if alt text includes ^^image^^
      if (pageElementDescription.includes('^^image^^')) {
        // Extract the key by removing the hash and the ^^image^^ part
        let key = pageElementDescription.replace('^^image^^', '').trim().substring(1); // Remove the hash and trim space

        // TODO: Add logic to either get an LLM to classify the image according to possible types or add some logic to get the type of image (e.g. block code, flowchart, diagram etc.)
        let slideImage = getSlideImage({
          slideshowId: slideId,
          pageId: slide.getObjectId()
        });

        // If the image is successfully retrieved, add it to the result
        if (slideImage) {
          result.images.push({
            key: key,
            blob: slideImage
          });
        }
      } else if (pageElementDescription.charAt(0) === '#') {
        // Extract the key by removing the hash
        let key = pageElementDescription.substring(1);
        let type = pageElement.getPageElementType();
        let typeString = type.toString();

        // Extract text from shape or table, converting tables to Markdown
        let text = extractTextFromShapeOrTable(typeString, pageElement);
        
        // If text is successfully retrieved, add it to the result
        if (text) {
          result.textData[key] = text;
        }
      }
    });
  });
  //console.log(`Extracted Slide Data is: ${JSON.stringify(result)}`)
  return result;
}

/**
 * Converts a Google Slides Table to a Markdown-formatted string.
 * @param {GoogleAppsScript.Slides.Table} table - The table element to convert.
 * @return {string} - The Markdown-formatted table.
 */
function convertTableToMarkdown(table) {
  if (!table || !(table.getNumRows() && table.getNumColumns())) {
    console.log("The provided element is not a table or is empty.");
    return '';
  }

  const numRows = table.getNumRows();
  const numCols = table.getNumColumns();
  let markdownTable = '';

  // Extract all rows' data
  let rows = [];
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      const cell = table.getCell(i, j);
      const text = cell.getText().asString().trim();
      // Escape pipe characters in Markdown
      const escapedText = text.replace(/\|/g, '\\|');
      row.push(escapedText);
    }
    rows.push(row);
  }

  // Assume first row as header
  const header = rows[0];
  const separator = header.map(() => '---');
  const dataRows = rows.slice(1);

  // Create header row
  markdownTable += '| ' + header.join(' | ') + ' |\n';

  // Create separator row
  markdownTable += '| ' + separator.join(' | ') + ' |\n';

  // Create data rows
  dataRows.forEach(row => {
    markdownTable += '| ' + row.join(' | ') + ' |\n';
  });

  return markdownTable;
}

/**
 * Extracts text from a table element and converts it to Markdown.
 * @param {GoogleAppsScript.Slides.Table} table - The table element to extract text from.
 * @return {string} - The extracted Markdown text from the table.
 */
function extractTextFromTable(table) {
  const markdown = convertTableToMarkdown(table);
  return markdown;
}

/**
 * Extracts text from a shape element.
 * @param {GoogleAppsScript.Slides.Shape} shape - The shape element to extract text from.
 * @return {string} - The extracted text from the shape.
 */
function extractTextFromShape(shape) {
  // Check if the passed element is a shape
  if (!shape || !shape.getText) {
    console.log("The provided element is not a shape or does not contain text.");
    return '';
  }

  // Get the text from the shape
  const text = shape.getText().asString();

  // Split the text into lines based on new lines
  const lines = text.split('\n');

  // Initialize an array to hold all the extracted text
  const allText = [];

  // Iterate through each line
  lines.forEach(function(line) {
    // Split the line into columns based on tab characters
    const columns = line.split('\t');
    // Join the columns with tab separators and add it to the allText array
    allText.push(columns.join('\t'));
  });

  // Join all rows into a single string with newline separators
  const outputText = allText.join('\n');
  return outputText;
}

/**
 * Extracts text from a shape or table element.
 * If the element is a table, it converts it to Markdown.
 * @param {string} typeStr - The type of the element (TABLE or SHAPE).
 * @param {GoogleAppsScript.Slides.PageElement} pageElement - The page element to extract text from.
 * @return {string} - The extracted text from the shape or Markdown-formatted table.
 */
function extractTextFromShapeOrTable(typeStr, pageElement) {
  if (typeStr === "TABLE") {
    const markdown = extractTextFromTable(pageElement.asTable());
    return markdown;
  } else {
    const text = extractTextFromShape(pageElement.asShape());
    return text;
  }
}

/**
 * Retrieves the slide ID of a student's Google Slides submission.
 * @param {string} courseId - The ID of the course.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} studentId - The ID of the student.
 * @return {Object|null} - An object containing the fileId and URL of the Google Slides file, or null if not found.
 */
function getStudentSlideId(courseId, assignmentId, studentId) {
  const submissions = Classroom.Courses.CourseWork.StudentSubmissions.list(courseId, assignmentId, {
    userId: studentId
  }).studentSubmissions;

  for (let i = 0; i < submissions.length; i++) {
    let submission = submissions[i];
    if (submission.assignmentSubmission && submission.assignmentSubmission.attachments) {
      let attachments = submission.assignmentSubmission.attachments;
      for (let j = 0; j < attachments.length; j++) {
        let attachment = attachments[j];
        if (attachment.driveFile && attachment.driveFile.alternateLink) {
          let fileId = extractFileIdFromUrl(attachment.driveFile.alternateLink);
          if (isGoogleSlidesFile(fileId)) {
            return {"fileId" : fileId, "url": attachment.driveFile.alternateLink};
          }
        }
      }
    }
  }
  return null;
}

/**
 * Extracts the file ID from a Google Drive URL.
 * @param {string} url - The URL of the Google Drive file.
 * @return {string|null} - The file ID extracted from the URL, or null if not found.
 */
function extractFileIdFromUrl(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * Checks if a file is a Google Slides file based on its file ID.
 * @param {string} fileId - The ID of the Google Drive file.
 * @return {boolean} - True if the file is a Google Slides file, otherwise false.
 */
function isGoogleSlidesFile(fileId) {
  // Handles issues where the file may not exist for whatever reason (usually a student deleting it)
  try {
    const file = DriveApp.getFileById(fileId);
    return file.getMimeType() === MimeType.GOOGLE_SLIDES;
  } catch (e) {
    toastMessage(e.message);
    console.log(e.stack);
    return false;
  }
}

/**
 * Saves the reference slide ID for a given assignment.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} referenceSlideId - The ID of the reference slide.
 */
function saveReferenceSlideId(assignmentId, referenceSlideId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty(assignmentId, referenceSlideId);
  toastMessage("Reference Slide ID saved."); // Changed from "Name" to "ID" for clarity
}

/**
 * Retrieves the reference slide ID for a given assignment.
 * @param {string} assignmentId - The ID of the assignment.
 * @return {string} - The reference slide ID.
 */
function getReferenceSlideId(assignmentId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty(assignmentId) || '';
}

/**
 * Debugging function to get reference slide data.
 */
function debugGetReferenceSlideData() {
  getReferenceSlideData("YOUR TESTING SLIDE ID GOES HERE");
}

/**
 * Retrieves and processes reference slide data.
 * @param {string} slideId - The ID of the reference slide.
 * @return {Object} - An object containing processed text and keys from the reference slide.
 */
function getReferenceSlideData(slideId) {
  // Gets the text from the slides (soon to be images once langflow processes them reliably)
  const refSlideContent = extractContentFromSlides(slideId); // Updated function name

  // Sets up the cache
  const cache = CacheService.getScriptCache();  
  const cacheKey = generateHash(JSON.stringify(refSlideContent));
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  } else {
    // Gets the task keys from the slides

    const taskKeys = getJSONKeys(refSlideContent);
    
    // Create an object for the tweaks using variables for keys
    const tweaks = {};
    tweaks[refSlidesTweakId] = {
      "referenceKeys_PromptComponent-vrR9o": JSON.stringify(taskKeys)
    };

    const payload = { 
      "input_value": JSON.stringify(refSlideContent),
      "tweaks": tweaks
    };

    const request = {
      url: refSlidesParserUrl,
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      headers: {          
        "x-api-key": apiKey
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(refSlidesParserUrl, request);
    const referenceSlidesData = JSON.parse(response.getContentText());
    const referenceSlidesText = JSON.parse(referenceSlidesData.outputs[0].outputs[0].messages[0].message);

    const result = { text: referenceSlidesText, keys: taskKeys };

    // Cache the response for 6 hours (21600 seconds)
    cache.put(cacheKey, JSON.stringify(result), 21600);

    return result;
  }
}

/**
 * Debugging function to get a slide image.
 */
function debugGetSlideImage() {
  const params = {
    slideshowId: 'ENTER YOUR SLIDE ID HERE',
    pageId: 'ENTER YOUR DEBUG PAGEID HERE'
  };
  const image = getSlideImage(params);
}

/**
 * Fetches an image of a Google Slide and returns it as a Blob.
 * @param {Object} params - Parameters containing slideshowId and pageId.
 * @return {Blob|null} - The Blob object of the slide image or null if not successful.
 */
function getSlideImage(params) {
  // Construct the URL using the provided parameters
  const url = `https://docs.google.com/presentation/d/${params.slideshowId}/export/jpeg?id=${params.slideshowId}&pageid=${params.pageId}`;

  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };

  try {
    // Use the UrlFetchApp service to fetch the image from the URL
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      console.log(`Error: Received response code ${responseCode}`);
      return null;
    }

    // Get the Blob object from the response
    const blob = response.getBlob();

    console.log("Slide image successfully retrieved!");

    // Return the Blob object
    return blob;
  } catch (e) {
    console.log(`Unable to download slide image: ${e.message}`);
    return null;
  }
}

/**
 * Extracts text from a shape or table element.
 * @param {string} typeStr - The type of the element (TABLE or SHAPE).
 * @param {GoogleAppsScript.Slides.PageElement} pageElement - The page element to extract text from.
 * @return {string} - The extracted text from the shape or table.
 */
function extractTextFromShapeOrTableOriginal(typeStr, pageElement) { // Renamed to avoid confusion
  if (typeStr == "TABLE") {
    const text = extractTextFromTableOriginal(pageElement.asTable());
    return text;
  } else {
    const text = extractTextFromShape(pageElement.asShape());
    return text;
  }
}

/**
 * Debug function to test the getJSONKeys function.
 */
function testGetJSONKeysOutput() {
  const referenceSlideId = "YOUR SLIDE ID GOES HERE";
  const jsonObject = extractContentFromSlides(referenceSlideId); // Updated function name
  const keys = getJSONKeys(jsonObject);
  console.log(keys);
  return;
}

/**
 * Gets the keys from a JSON object.
 * @param {Object} jsonObject - The JSON object to extract keys from.
 * @return {Array<string>} - The keys from the JSON object.
 */
function getJSONKeys(jsonObject) { // Fixed parameter type in JSDoc
  console.log(`The JSON object that we're going to extract the keys from is: ${JSON.stringify(jsonObject)}`);
  
  // Get the keys from the JSON object
  const keys = Object.keys(jsonObject);
  
  // Return the keys
  return keys;
}

/**
 * Generates a hash for caching purposes.
 * @param {string} input - The input string to hash.
 * @return {string} - The generated hash.
 */
function generateHash(input) {
  // Simple hash function (for demonstration purposes)
  let hash = 0, i, chr;
  if (input.length === 0) return hash.toString();
  for (i = 0; i < input.length; i++) {
    chr   = input.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * Displays a toast message to the user.
 * @param {string} message - The message to display.
 */
function toastMessage(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message);
}
