class ConfigurationManager {
    static get CONFIG_KEYS() {
        return {

            // Langflow and LLM related config values.
            BATCH_SIZE: 'batchSize',
            LANGFLOW_API_KEY: 'langflowApiKey',
            LANGFLOW_URL: 'langflowUrl',
            TEXT_ASSESSMENT_TWEAK_ID: 'textAssessmentTweakId',
            TABLE_ASSESSMENT_TWEAK_ID: 'tableAssessmentTweakId',
            IMAGE_ASSESSMENT_TWEAK_ID: 'imageAssessmentTweakId',
            IMAGE_FLOW_UID: 'imageFlowUid',

            // Assessment Record creator config values
            ASSESSMENT_RECORD_TEMPLATE_ID: 'assessmentRecordTemplateId',

            // Note: This is the FolderId used to create the departmental overview sheets. At some point it'll be renamed to something more descriptive but for now I've left it until I can update that properly.
            ASSESSMENT_RECORD_DESTINATION_FOLDER: 'assessmentRecordDestinationFolder'

            // Departmental Analysis Sheet Config Values
            OVERVIEW_SHEET_NAME: 'overviewSheetName',
            MASTER_OVERVIEW_SHEET_NAME: 'masterOverviewSheetName',
        };
    }

    constructor() {
        if (ConfigurationManager.instance) {
            return ConfigurationManager.instance;
        }

        this.scriptProperties = PropertiesService.getScriptProperties();
        this.configCache = null; // Initialize cache

        ConfigurationManager.instance = this;
        return this;
    }

    /**
     * Retrieves all configuration properties.
     * @return {Object} - An object containing all configuration properties.
     */
    getAllConfigurations() {
        if (!this.configCache) {
            this.configCache = this.scriptProperties.getProperties();
        }
        return this.configCache;
    }

    /**
     * Checks if a configuration property exists.
     * @param {string} key - The configuration key.
     * @return {boolean} - True if the property exists, false otherwise.
     */
    hasProperty(key) {
        this.getAllConfigurations();
        return this.configCache.hasOwnProperty(key);
    }

    /**
     * Retrieves a single configuration property.
     * @param {string} key - The configuration key.
     * @return {string} - The value of the configuration property.
     */
    getProperty(key) {
        if (!this.configCache) {
            this.getAllConfigurations();
        }
        return this.configCache[key] || '';
    }

    /**
     * Sets a single configuration property.
     * @param {string} key - The configuration key.
     * @param {string|number} value - The value to set.
     */
    setProperty(key, value) {
        // Add validation based on key
        switch (key) {
            case ConfigurationManager.CONFIG_KEYS.BATCH_SIZE:
                if (!Number.isInteger(value) || value <= 0) {
                    throw new Error("Batch Size must be a positive integer.");
                }
                break;
            case ConfigurationManager.CONFIG_KEYS.LANGFLOW_API_KEY:
                if (typeof value !== 'string' || !this.isValidApiKey(value)) {
                    throw new Error("LangFlow API Key must be a valid string starting with 'sk-' followed by alphanumeric characters and hyphens, without leading/trailing hyphens or consecutive hyphens.");
                }
                break;
            case ConfigurationManager.CONFIG_KEYS.LANGFLOW_URL:
                if (typeof value !== 'string' || !this.isValidUrl(value)) {
                    throw new Error(`${this.toReadableKey(key)} must be a valid URL string.`);
                }
                break;
            case ConfigurationManager.CONFIG_KEYS.IMAGE_FLOW_UID:
                if (typeof value !== 'string' || value.trim() === '') {
                    throw new Error("Image Flow UID must be a non-empty string.");
                }
                break;
            case ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAK_ID:
            case ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAK_ID:
            case ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAK_ID:
            case ConfigurationManager.CONFIG_KEYS.ASSESSMENT_RECORD_TEMPLATE_ID:
                if (typeof value !== 'string' || value.trim() === '') {
                    throw new Error(`${this.toReadableKey(key)} must be a non-empty string.`);
                }
                if (key === ConfigurationManager.CONFIG_KEYS.ASSESSMENT_RECORD_TEMPLATE_ID && !this.isValidGoogleSheetId(value)) {
                    throw new Error("Assessment Record Template ID must be a valid Google Sheet ID.");
                }
                break;
            case ConfigurationManager.CONFIG_KEYS.ASSESSMENT_RECORD_DESTINATION_FOLDER:
                if (typeof value !== 'string' || value.trim() === '') {
                    throw new Error(`${this.toReadableKey(key)} must be a non-empty string.`);
                }
                if (key === ConfigurationManager.CONFIG_KEYS.ASSESSMENT_RECORD_DESTINATION_FOLDER && !this.isValidGoogleDriveFolderId(value)) {
                    throw new Error("Assessment Record Destination Folder must be a valid Google Drive Folder ID.");
                }
                break;
            default:
                // No specific validation
                break;
        }

        this.scriptProperties.setProperty(key, value.toString());
        this.configCache = null; // Invalidate cache
    }

    /**
     * Validates if a string is a well-formed URL.
     * @param {string} url - The URL string to validate.
     * @return {boolean} - True if valid, false otherwise.
     */
    isValidUrl(url) {
        const urlPattern = new RegExp('^(https?:\/\/)' + // protocol
            '((([a-zA-Z0-9$-_@.&+!*"(),]|(%[0-9a-fA-F]{2}))+)(:[0-9]+)?@)?' + // authentication
            '((\[[0-9a-fA-F:.]+\])|' + // IPv6
            '(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}))' + // domain name
            '(\:[0-9]+)?' + // port
            '(\/[-a-zA-Z0-9%_.~+]*)*' + // path
            '(\?[;&a-zA-Z0-9%_.~+=-]*)?' + // query string
            '(\#[-a-zA-Z0-9_]*)?$', 'i'); // fragment locator
        return urlPattern.test(url);
    }

    /**
     * Validates if a string is a valid LangFlow API key.
     * @param {string} apiKey - The API key string to validate.
     * @return {boolean} - True if valid, false otherwise.
     */
    isValidApiKey(apiKey) {
        const apiKeyPattern = /^sk-(?!-)([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)$/;
        return apiKeyPattern.test(apiKey.trim());
    }

    /**
     * Validates if a string is a valid Google Sheet ID.
     * @param {string} sheetId - The Google Sheet ID to validate.
     * @return {boolean} - True if valid, false otherwise.
     */
    isValidGoogleSheetId(sheetId) {
        try {
            const file = DriveApp.getFileById(sheetId);
            if (file && file.getMimeType() === MimeType.GOOGLE_SHEETS) {
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Invalid Google Sheet ID: ${error.message}`);
            return false;
        }
    }

    /**
     * Validates if a string is a valid Google Drive Folder ID.
     * @param {string} folderId - The Google Drive Folder ID to validate.
     * @return {boolean} - True if valid, false otherwise.
     */
    isValidGoogleDriveFolderId(folderId) {
        try {
            const folder = DriveApp.getFolderById(folderId);
            return folder !== null;
        } catch (error) {
            console.error(`Invalid Google Drive Folder ID: ${error.message}`);
            return false;
        }
    }

    /**
     * Converts a configuration key to a more readable format for error messages.
     * @param {string} key - The configuration key.
     * @return {string} - Readable key.
     */
    toReadableKey(key) {
        // Convert camelCase or PascalCase to Regular Text
        return key.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }

    /**
     * Getter Methods
     */
    getBatchSize() {
        const value = parseInt(this.getProperty(ConfigurationManager.CONFIG_KEYS.BATCH_SIZE), 10);
        return isNaN(value) ? 20 : value;
    }

    getLangflowApiKey() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_API_KEY);
    }

    getLangflowUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_URL);
    }

    getImageFlowUid() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_FLOW_UID);
    }

    getTextAssessmentTweakId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAK_ID);
    }

    getTableAssessmentTweakId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAK_ID);
    }

    getImageAssessmentTweakId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAK_ID);
    }

    getAssessmentRecordTemplateId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.ASSESSMENT_RECORD_TEMPLATE_ID);
    }

    getAssessmentRecordDestinationFolder() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.ASSESSMENT_RECORD_DESTINATION_FOLDER);
    }

    /**
     * Setter Methods
     */
    setBatchSize(batchSize) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.BATCH_SIZE, batchSize);
    }

    setLangflowApiKey(apiKey) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_API_KEY, apiKey);
    }

    setLangflowUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_URL, url);
    }

    setImageFlowUid(uid) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_FLOW_UID, uid);
    }

    setTextAssessmentTweakId(tweakId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAK_ID, tweakId);
    }

    setTableAssessmentTweakId(tweakId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAK_ID, tweakId);
    }

    setImageAssessmentTweakId(tweakId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAK_ID, tweakId);
    }

    setAssessmentRecordTemplateId(templateId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.ASSESSMENT_RECORD_TEMPLATE_ID, templateId);
    }

    setAssessmentRecordDestinationFolder(folderId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.ASSESSMENT_RECORD_DESTINATION_FOLDER, folderId);
    }
}

// Ensure singleton instance
const configurationManager = new ConfigurationManager();

/**
 * Retrieves all configuration properties.
 * @return {Object} - An object containing all configuration properties.
 */
function getConfiguration() {
    return configurationManager.getAllConfigurations();
}
