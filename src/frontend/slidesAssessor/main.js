// Main.gs

/**
 * Initiates the processing of an assignment asynchronously by setting up a trigger
 * and opens the progress modal.
 *
 * @param {string} assignmentTitle - The title of the assignment.
 * @param {Object} slideIds - An object containing referenceSlideId and emptySlideId.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} referenceSlideId - The ID of the reference slide.
 * @param {string} emptySlideId - The ID of the empty slide.
 */
function saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId) {
  mainController.saveStartAndShowProgress(assignmentTitle, slideIds, assignmentId, referenceSlideId, emptySlideId);
}

/**
 * Initiates the processing of an assignment asynchronously by setting up a trigger.
 *
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} referenceSlideId - The ID of the reference slide.
 * @param {string} emptySlideId - The ID of the empty slide.
 * @returns {string} The unique process ID.
 */
function startProcessing(assignmentId, referenceSlideId, emptySlideId) {
  return mainController.startProcessing(assignmentId, referenceSlideId, emptySlideId);
}

/**
 * Opens the progress modal dialog.
 */
function showProgressModal() {
  mainController.showProgressModal();
}

/**
 * Processes the selected assignment by retrieving parameters and executing the workflow.
 */
function triggerProcessSelectedAssignment() {
  mainController.processSelectedAssignment();
}

/**
 * Removes a specific trigger by function name.
 *
 * @param {string} functionName - The name of the function whose triggers are to be removed.
 */
function removeTrigger(functionName) {
  mainController.triggerController.removeTriggers(functionName);
}

/**
 * Adds custom menus when the spreadsheet is opened.
 */
function onOpen() {
  mainController.onOpen();
}

/**
 * Shows the configuration dialog modal.
 */
function showConfigurationDialog() {
  mainController.showConfigurationDialog();
}

/**
 * Shows the assignment dropdown modal.
 */
function showAssignmentDropdown() {
  mainController.showAssignmentDropdown();
}

/**
 * Opens the reference slide modal with assignment data.
 *
 * @param {string} assignmentData - The JSON string containing assignment data.
 */
function openReferenceSlideModal(assignmentData) {
  mainController.openReferenceSlideModal(assignmentData);
}

/**
 * Saves slide IDs for a specific assignment.
 *
 * @param {string} assignmentId - The ID of the assignment.
 * @param {Object} slideIds - An object containing referenceSlideId and emptySlideId.
 */
function saveSlideIdsForAssignment(assignmentId, slideIds) {
  mainController.saveSlideIdsForAssignment(assignmentId, slideIds);
}

/**
 * Retrieves the current progress status.
 *
 * @returns {Object} The current progress data.
 */
function requestStatus() {
  return mainController.requestStatus();
}

/**
 * Test workflow function for debugging purposes.
 */
function testWorkflow() {
  mainController.testWorkflow();
}

function showConfigurationDialog() {
  mainController.showConfigurationDialog()
};

function saveConfiguration(formData) {
  return AIAssess.saveConfiguration(formData);
}

/**
 * Saves the provided configuration properties.
 * @param {Object} config - An object containing key-value pairs of configurations.
 */
function saveConfiguration(config) {
  try {
    // Map the incoming config to the ConfigurationManager setters
    if (config.batchSize !== undefined) {
      configurationManager.setBatchSize(config.batchSize);
    }
    if (config.langflowApiKey !== undefined) {
      configurationManager.setLangflowApiKey(config.langflowApiKey);
    }
    if (config.langflowUrl !== undefined) {
      configurationManager.setLangflowUrl(config.langflowUrl);
    }

    // Handle Tweak IDs
    if (config.textAssessmentTweakId !== undefined) {
      configurationManager.setTextAssessmentTweakId(config.textAssessmentTweakId);
    }
    if (config.tableAssessmentTweakId !== undefined) {
      configurationManager.setTableAssessmentTweakId(config.tableAssessmentTweakId);
    }
    if (config.imageAssessmentTweakId !== undefined) {
      configurationManager.setImageAssessmentTweakId(config.imageAssessmentTweakId);
    }

    // Handle New Configuration Parameters
    if (config.imageUploadUrl !== undefined) {
      configurationManager.setImageUploadUrl(config.imageUploadUrl);
    }
    if (config.imageUploaderApiKey !== undefined) {
      configurationManager.setImageUploaderApiKey(config.imageUploaderApiKey);
    }

    Utils.toastMessage("Configuration saved successfully.", "Success", 5);
  } catch (error) {
    console.error("Error saving configuration:", error);
    Utils.toastMessage("Failed to save configuration: " + error.message, "Error", 5);
    throw new Error("Failed to save configuration. Please check the inputs.");
  }
}

function clearAllCacheKeys() {
  // Get the cache service
  var cache = CacheService.getScriptCache();

  // Retrieve all keys stored in the cache
  cache.removeAll(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
}



