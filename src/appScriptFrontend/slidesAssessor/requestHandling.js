/**
 * Prepares a request object for the student request.
 * @param {string} referenceSlidesContent - The content from the reference slides.
 * @param {string} slideData - The content from the student's slide.
 * @return {object} - The request object to be sent.
 */
function prepareStudentRequest(referenceSlidesContent, slideData) {
  
  // Create an object for the tweaks using variables for keys
  const tweaks = {};
  tweaks[langflowReferenceContentId] = {
    "referenceContent": JSON.stringify(referenceSlidesContent.text),
  };
  tweaks[langflowReferenceKeysId] = {
    "referenceKeys": JSON.stringify(referenceSlidesContent.keys)
  };

  const payload = { 
    "input_value": JSON.stringify(slideData),
    "tweaks": tweaks
  };

  const request = {
    url: url,
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {          
      "x-api-key": apiKey
    },
    muteHttpExceptions: true
  };

  return request;
}

/**
 * Processes the response from the API call.
 * @param {object} response - The response object from the API.
 * @param {object} request - The request object that was sent to the API.
 * @return {object|null} - The processed LLM assessment data or null if no response.
 */
/**
 * Processes the response from the API call.
 * @param {object} response - The response object from the API.
 * @param {object} request - The request object that was sent to the API.
 * @return {object|null} - The processed LLM assessment data or null if no response.
 */
function processResponse(response, request, retries) {
  if (!response) return null;

  try {
    const responseData = JSON.parse(response.getContentText());
    //console.log(`RESPONSE DATA \n ==================== \n ${JSON.stringify(responseData)}`)
    const llmAssessment = JSON.parse(responseData.outputs[0].outputs[1].messages[0].message);
    const studentResponseLabelled = JSON.parse(responseData.outputs[0].outputs[0].messages[0].message);

    // Extract the reference slide content from the request object
    const requestPayload = JSON.parse(request.payload);
    const referenceSlidesContent = JSON.parse(requestPayload.tweaks[langflowReferenceContentId].referenceContent);

    //// Check if the student response keys match the reference slide keys
    // if (!checkKeys(referenceSlidesContent.textData, studentResponseLabelled, llmAssessment)) {
    //  throw new Error("Student response keys do not match reference slide keys");
    //}

    // Merge student responses into the LLM assessment data
    for (const key in llmAssessment) {
      if (studentResponseLabelled.hasOwnProperty(key)) {
        llmAssessment[key]['studentResponse'] = studentResponseLabelled[key];
      }
    }

    return llmAssessment;
  } catch (e) {
    toastMessage(`Error processing response: ${e.message}. Retrying request...`);
    
    //Assign a value to retries if it's empty
    if (!retries) {
      retries = 1
    }

    const retryResponse = fetchUrls([request])[0];

    if (retries > 3) {
      throw new Error(`Something has gone wrong. Retries limit exceeded. Error message: ${e.message}`)
    } else {
      return processResponse(retryResponse, request, retries);
    }
  }
}


// This function sends a request to a dummy flow which is used to warm up the langflow cloud run instance so that it's ready to process all the student data once the slides have been processed.
async function warmUpLLM() {
  const payload = { 
    "input_value": "Wake Up!"}

  const request = {
    url: warmUpLlmUrl,
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {          
      "x-api-key": apiKey
    },
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(url, request)
  toastMessage("AI backend warmed up and ready to go...")
}

function getBatchSize() {
  const properties = PropertiesService.getScriptProperties();
  let batchSize = properties.getProperty("batchSize");
  
  if (!batchSize) {
    batchSize = 1;
    properties.setProperty("batchSize", batchSize);
  }

  return parseInt(batchSize);
}

function fetchUrls(requests) {
  let responses = [];
  let retries = 0;
  const maxRetries = 5;
  let delay = 1000; // 1 second

  while (retries < maxRetries) {
    try {
      responses = UrlFetchApp.fetchAll(requests);
      return responses;

    } catch (e) {
      retries++;
      toastMessage(`Request failed. Error message: ${e.message}. \n This is retry number ${retries}.`)
      Utilities.sleep(delay);
      delay *= 2; // double the delay for next retry
    }
  }
  //Throws an error if response has't been retrieved.
  throw new Error("Exceeded maximum number of retries. Please try again later.")

}

/**
 * Checks if two arrays of keys are equal.
 * @param {Array<string>} keys1 - The first array of keys.
 * @param {Array<string>} keys2 - The second array of keys.
 * @return {boolean} - True if the arrays are equal, false otherwise.
 */
function arraysEqual(keys1, keys2) {
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if the student response keys match the reference slide keys.
 * @param {Object} referenceSlidesContent - The content from the reference slides.
 * @param {Object} studentResponseLabelled - The student response labelled object.
 * @param {Object} llmAssessment - The LLM assessment object.
 * @return {boolean} - True if the keys match, false otherwise.
 */
function checkKeys(referenceSlidesContent, studentResponseLabelled, llmAssessment) {
  const referenceKeys = Object.keys(referenceSlidesContent);
  const studentResponseKeys = Object.keys(studentResponseLabelled);
  const llmAssessmentKeys = Object.keys(llmAssessment);
  return arraysEqual(referenceKeys, studentResponseKeys) && arraysEqual(referenceKeys, llmAssessmentKeys);
}

