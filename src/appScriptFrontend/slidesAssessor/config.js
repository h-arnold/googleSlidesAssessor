// Function to check and prompt for configuration
function checkAndPromptConfiguration() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const properties = scriptProperties.getProperties();

  // Check if all required properties are set
  const allSet = Object.values(CONFIG_KEYS).every(key => properties[key]);

  if (!allSet) {
    // Show the HTML modal dialog
    const html = HtmlService.createHtmlOutputFromFile('ConfigurationDialog')
      .setWidth(600)
      .setHeight(600);
    SpreadsheetApp.getUi() // Change to DocumentApp or other if not using Sheets
      .showModalDialog(html, 'Configure Script Properties');
  }
}

// Function to retrieve current configuration
function getConfiguration() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperties();
}

// Function to save configuration
function saveConfiguration(config) {
  const scriptProperties = PropertiesService.getScriptProperties();
  // Optionally, validate input here
  scriptProperties.setProperties(config);
  configCache = null; // Invalidate cache
}

// Function to get a single configuration property with caching
function getConfigProperty(key) {
  if (!configCache) {
    configCache = getConfiguration();
  }
  return configCache[key];
}

// Getter functions for each configuration
function getUrl() {
  return getConfigProperty(CONFIG_KEYS.URL);
}

function getLangflowReferenceContentId() {
  return getConfigProperty(CONFIG_KEYS.LANGFLOW_REFERENCE_CONTENT_ID);
}

function getLangflowReferenceKeysId() {
  return getConfigProperty(CONFIG_KEYS.LANGFLOW_REFERENCE_KEYS_ID);
}

function getRefSlidesParserUrl() {
  return getConfigProperty(CONFIG_KEYS.REF_SLIDES_PARSER_URL);
}

function getRefSlidesTweakId() {
  return getConfigProperty(CONFIG_KEYS.REF_SLIDES_TWEAK_ID);
}

function getWarmUpLlmUrl() {
  return getConfigProperty(CONFIG_KEYS.WARM_UP_LLM_URL);
}

function getApiKey() {
  return getConfigProperty(CONFIG_KEYS.API_KEY);
}
