// ConfigurationManager.gs

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
            WARM_UP_URL: 'warmUpUrl',
            REFERENCE_SLIDE_ID: 'referenceSlideId',
            EMPTY_SLIDE_ID: 'emptySlideId',
            TEXT_ASSESSMENT_URL: 'textAssessmentUrl',
            TEXT_ASSESSMENT_TWEAKS: 'textAssessmentTweaks',
            TABLE_ASSESSMENT_URL: 'tableAssessmentUrl',
            TABLE_ASSESSMENT_TWEAKS: 'tableAssessmentTweaks',
            IMAGE_ASSESSMENT_URL: 'imageAssessmentUrl',
            IMAGE_ASSESSMENT_TWEAKS: 'imageAssessmentTweaks'
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
     * @param {string} value - The value to set.
     */
    setProperty(key, value) {
        // Add validation based on key
        switch (key) {
            case ConfigurationManager.CONFIG_KEYS.BATCH_SIZE:
                if (!Number.isInteger(value) || value <= 0) {
                    throw new Error("Batch Size must be a positive integer.");
                }
                break;
            case ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_URL:
            case ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_URL:
            case ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_URL:
                if (typeof value !== 'string' || !this.isValidUrl(value)) {
                    throw new Error(`${key} must be a valid URL string.`);
                }
                break;
            case ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAKS:
            case ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAKS:
            case ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAKS:
                if (typeof value !== 'string' || !this.isValidJson(value)) {
                    throw new Error(`${key} must be a valid JSON string.`);
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
            // Handle JSON objects by stringifying them
            if (key === ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAKS ||
                key === ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAKS ||
                key === ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAKS) {
                if (typeof value !== 'object') {
                    throw new Error(`${key} must be a JSON object.`);
                }
                value = JSON.stringify(value);
            }
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
        const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
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
     * Validates if a string is a valid JSON.
     * @param {string} jsonString - The JSON string to validate.
     * @return {boolean} - True if valid, false otherwise.
     */
    isValidJson(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Getter Methods
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

    getWarmUpUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.WARM_UP_URL);
    }

    getReferenceSlideId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.REFERENCE_SLIDE_ID);
    }

    getEmptySlideId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.EMPTY_SLIDE_ID);
    }

    getTextAssessmentUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_URL);
    }

    getTextAssessmentTweaks() {
        const jsonString = this.getProperty(ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAKS);
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn("Invalid JSON for textAssessmentTweaks. Returning empty object.");
            return {};
        }
    }

    getTableAssessmentUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_URL);
    }

    getTableAssessmentTweaks() {
        const jsonString = this.getProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAKS);
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn("Invalid JSON for tableAssessmentTweaks. Returning empty object.");
            return {};
        }
    }

    getImageAssessmentUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_URL);
    }

    getImageAssessmentTweaks() {
        const jsonString = this.getProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAKS);
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn("Invalid JSON for imageAssessmentTweaks. Returning empty object.");
            return {};
        }
    }

    // Setter Methods
    setBatchSize(batchSize) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.BATCH_SIZE, batchSize);
    }

    setLangflowApiKey(apiKey) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_API_KEY, apiKey);
    }

    setLangflowUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_URL, url);
    }

    setWarmUpUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.WARM_UP_URL, url);
    }

    setReferenceSlideId(slideId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.REFERENCE_SLIDE_ID, slideId);
    }

    setEmptySlideId(slideId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.EMPTY_SLIDE_ID, slideId);
    }

    setTextAssessmentUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_URL, url);
    }

    setTextAssessmentTweaks(tweaks) {
        if (typeof tweaks !== 'object') {
            throw new Error("textAssessmentTweaks must be a JSON object.");
        }
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAKS, JSON.stringify(tweaks));
    }

    setTableAssessmentUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_URL, url);
    }

    setTableAssessmentTweaks(tweaks) {
        if (typeof tweaks !== 'object') {
            throw new Error("tableAssessmentTweaks must be a JSON object.");
        }
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAKS, JSON.stringify(tweaks));
    }

    setImageAssessmentUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_URL, url);
    }

    setImageAssessmentTweaks(tweaks) {
        if (typeof tweaks !== 'object') {
            throw new Error("imageAssessmentTweaks must be a JSON object.");
        }
        this.setProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAKS, JSON.stringify(tweaks));
    }
}

// Ensure singleton instance
const configurationManager = new ConfigurationManager();
Object.freeze(configurationManager);

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
        if (config.warmUpUrl !== undefined) {
            configurationManager.setWarmUpUrl(config.warmUpUrl);
        }
        if (config.referenceSlideId !== undefined) {
            configurationManager.setReferenceSlideId(config.referenceSlideId);
        }
        if (config.emptySlideId !== undefined) {
            configurationManager.setEmptySlideId(config.emptySlideId);
        }
        if (config.textAssessmentUrl !== undefined) {
            configurationManager.setTextAssessmentUrl(config.textAssessmentUrl);
        }
        if (config.textAssessmentTweaks !== undefined) {
            configurationManager.setTextAssessmentTweaks(config.textAssessmentTweaks);
        }
        if (config.tableAssessmentUrl !== undefined) {
            configurationManager.setTableAssessmentUrl(config.tableAssessmentUrl);
        }
        if (config.tableAssessmentTweaks !== undefined) {
            configurationManager.setTableAssessmentTweaks(config.tableAssessmentTweaks);
        }
        if (config.imageAssessmentUrl !== undefined) {
            configurationManager.setImageAssessmentUrl(config.imageAssessmentUrl);
        }
        if (config.imageAssessmentTweaks !== undefined) {
            configurationManager.setImageAssessmentTweaks(config.imageAssessmentTweaks);
        }

        Utils.toastMessage("Configuration saved successfully.", "Success", 5);
    } catch (error) {
        console.error("Error saving configuration:", error);
        Utils.toastMessage("Failed to save configuration: " + error.message, "Error", 5);
        throw new Error("Failed to save configuration. Please check the inputs.");
    }
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
        if (config.warmUpUrl !== undefined) {
            configurationManager.setWarmUpUrl(config.warmUpUrl);
        }
        if (config.referenceSlideId !== undefined) {
            configurationManager.setReferenceSlideId(config.referenceSlideId);
        }
        if (config.emptySlideId !== undefined) {
            configurationManager.setEmptySlideId(config.emptySlideId);
        }
        if (config.textAssessmentUrl !== undefined) {
            configurationManager.setTextAssessmentUrl(config.textAssessmentUrl);
        }
        if (config.textAssessmentTweaks !== undefined) {
            configurationManager.setTextAssessmentTweaks(config.textAssessmentTweaks);
        }
        if (config.tableAssessmentUrl !== undefined) {
            configurationManager.setTableAssessmentUrl(config.tableAssessmentUrl);
        }
        if (config.tableAssessmentTweaks !== undefined) {
            configurationManager.setTableAssessmentTweaks(config.tableAssessmentTweaks);
        }
        if (config.imageAssessmentUrl !== undefined) {
            configurationManager.setImageAssessmentUrl(config.imageAssessmentUrl);
        }
        if (config.imageAssessmentTweaks !== undefined) {
            configurationManager.setImageAssessmentTweaks(config.imageAssessmentTweaks);
        }

        Utils.toastMessage("Configuration saved successfully.", "Success", 5);
    } catch (error) {
        console.error("Error saving configuration:", error);
        Utils.toastMessage("Failed to save configuration: " + error.message, "Error", 5);
        throw new Error("Failed to save configuration. Please check the inputs.");
    }
}
