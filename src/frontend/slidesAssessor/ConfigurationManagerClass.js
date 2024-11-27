/**
 * ConfigurationManager Class
 * 
 * Manages script properties with getter and setter methods.
 */
class ConfigurationManager {
    static get CONFIG_KEYS() {
        return {
            BATCH_SIZE: 'batchSize',
            LANGFLOW_API_KEY: 'langflowApiKey',
            LANGFLOW_URL: 'langflowUrl',
            TEXT_ASSESSMENT_TWEAK_ID: 'textAssessmentTweakId',
            TABLE_ASSESSMENT_TWEAK_ID: 'tableAssessmentTweakId',
            IMAGE_ASSESSMENT_TWEAK_ID: 'imageAssessmentTweakId',
            IMAGE_UPLOAD_URL: 'imageUploadUrl',
            IMAGE_UPLOADER_API_KEY: 'imageUploaderApiKey'
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
            case ConfigurationManager.CONFIG_KEYS.LANGFLOW_URL:
            case ConfigurationManager.CONFIG_KEYS.IMAGE_UPLOAD_URL:
                if (typeof value !== 'string' || !this.isValidUrl(value)) {
                    throw new Error(`${this.toReadableKey(key)} must be a valid URL string.`);
                }
                break;
            case ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAK_ID:
            case ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAK_ID:
            case ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAK_ID:
            case ConfigurationManager.CONFIG_KEYS.IMAGE_UPLOADER_API_KEY:
                if (typeof value !== 'string' || value.trim() === '') {
                    throw new Error(`${this.toReadableKey(key)} must be a non-empty string.`);
                }
                break;
            // Add more validations as needed
            default:
                // No specific validation
                break;
        }

        this.scriptProperties.setProperty(key, value.toString());
        this.configCache = null; // Invalidate cache
    }

    /**
     * Sets multiple configuration properties.
     * @param {Object} config - An object containing key-value pairs of configurations.
     */
    setProperties(config) {
        Object.entries(config).forEach(([key, value]) => {
            // No longer handling JSON tweaks; only Tweak IDs and base URL
            this.setProperty(key, value);
        });

        this.configCache = null; // Invalidate cache
    }

    /**
     * Validates if a string is a well-formed URL.
     * @param {string} url - The URL string to validate.
     * @return {boolean} - True if valid, false otherwise.
     */
    isValidUrl(url) {
        const urlPattern = new RegExp('^(https?:\\/\\/)' + // protocol
            '((([a-zA-Z0-9$-_@.&+!*"(),]|(%[0-9a-fA-F]{2}))+)(:[0-9]+)?@)?' + // authentication
            '((\\[[0-9a-fA-F:.]+\\])|' + // IPv6
            '(([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}))' + // domain name
            '(\\:[0-9]+)?' + // port
            '(\\/[-a-zA-Z0-9%_.~+]*)*' + // path
            '(\\?[;&a-zA-Z0-9%_.~+=-]*)?' + // query string
            '(\\#[-a-zA-Z0-9_]*)?$', 'i'); // fragment locator
        return urlPattern.test(url);
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
        return isNaN(value) ? 5 : value; // Default batch size is 5
    }

    getLangflowApiKey() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_API_KEY);
    }

    getLangflowUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_URL);
    }

    /**
     * Dynamically constructs the Warm-Up URL based on the base Langflow URL.
     * @return {string} - The constructed Warm-Up URL.
     */
    getWarmUpUrl() {
        const baseUrl = this.getLangflowUrl();
        return `${baseUrl}/api/v1/run/warmUp?stream=false`;
    }

    /**
     * Dynamically constructs the Text Assessment URL based on the base Langflow URL.
     * @return {string} - The constructed Text Assessment URL.
     */
    getTextAssessmentUrl() {
        const baseUrl = this.getLangflowUrl();
        return `${baseUrl}/api/v1/run/textAssessment?stream=false`;
    }

    /**
     * Dynamically constructs the Table Assessment URL based on the base Langflow URL.
     * @return {string} - The constructed Table Assessment URL.
     */
    getTableAssessmentUrl() {
        const baseUrl = this.getLangflowUrl();
        return `${baseUrl}/api/v1/run/tableAssessment?stream=false`;
    }

    /**
     * Dynamically constructs the Image Assessment URL based on the base Langflow URL.
     * @return {string} - The constructed Image Assessment URL.
     */
    getImageAssessmentUrl() {
        const baseUrl = this.getLangflowUrl();
        return `${baseUrl}/api/v1/run/imageAssessment?stream=false`;
    }

    /**
     * Getter Methods for Tweak IDs
     */
    getTextAssessmentTweakId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAK_ID);
    }

    getTableAssessmentTweakId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAK_ID);
    }

    getImageAssessmentTweakId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAK_ID);
    }

    /**
     * Getter Methods for New Configuration Parameters
     */
    getImageUploadUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_UPLOAD_URL);
    }

    getImageUploaderApiKey() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_UPLOADER_API_KEY);
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

    /**
     * Sets the base Langflow URL.
     * All assessment URLs are derived from this base URL.
     * @param {string} url - The base Langflow URL.
     */
    setLangflowUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_URL, url);
    }

    /**
     * Setter Methods for Assessment URLs.
     * Since URLs are derived from the base Langflow URL, these setters throw an error if used.
     * To update assessment URLs, update the Langflow URL instead.
     */
    setTextAssessmentUrl(url) {
        throw new Error("Text Assessment URL is derived from the Langflow URL and cannot be set directly.");
    }

    setTableAssessmentUrl(url) {
        throw new Error("Table Assessment URL is derived from the Langflow URL and cannot be set directly.");
    }

    setImageAssessmentUrl(url) {
        throw new Error("Image Assessment URL is derived from the Langflow URL and cannot be set directly.");
    }

    /**
     * Setter Methods for Tweak IDs
     */
    setTextAssessmentTweakId(tweakId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAK_ID, tweakId);
    }

    setTableAssessmentTweakId(tweakId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAK_ID, tweakId);
    }

    setImageAssessmentTweakId(tweakId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAK_ID, tweakId);
    }

    /**
     * Setter Methods for New Configuration Parameters
     */
    setImageUploadUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_UPLOAD_URL, url);
    }

    setImageUploaderApiKey(apiKey) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_UPLOADER_API_KEY, apiKey);
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

