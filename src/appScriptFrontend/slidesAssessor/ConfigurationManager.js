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
            TEXT_ASSESSMENT_TWEAK_ID: 'textAssessmentTweakId',
            TABLE_ASSESSMENT_URL: 'tableAssessmentUrl',
            TABLE_ASSESSMENT_TWEAK_ID: 'tableAssessmentTweakId',
            IMAGE_ASSESSMENT_URL: 'imageAssessmentUrl',
            IMAGE_ASSESSMENT_TWEAK_ID: 'imageAssessmentTweakId'
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
            case ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAK_ID:
            case ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAK_ID:
            case ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAK_ID:
                if (typeof value !== 'string' || value.trim() === '') {
                    throw new Error(`${key} must be a non-empty string.`);
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
            // No longer handling JSON tweaks; only Tweak IDs
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

    getTextAssessmentTweakId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAK_ID);
    }

    getTableAssessmentUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_URL);
    }

    getTableAssessmentTweakId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAK_ID);
    }

    getImageAssessmentUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_URL);
    }

    getImageAssessmentTweakId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAK_ID);
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

    setTextAssessmentTweakId(tweakId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TEXT_ASSESSMENT_TWEAK_ID, tweakId);
    }

    setTableAssessmentUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_URL, url);
    }

    setTableAssessmentTweakId(tweakId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.TABLE_ASSESSMENT_TWEAK_ID, tweakId);
    }

    setImageAssessmentUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_URL, url);
    }

    setImageAssessmentTweakId(tweakId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_ASSESSMENT_TWEAK_ID, tweakId);
    }
}

// Ensure singleton instance
const configurationManager = new ConfigurationManager();
// Object.freeze(configurationManager); // Removed to allow modifications

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
        if (config.textAssessmentTweakId !== undefined) {
            configurationManager.setTextAssessmentTweakId(config.textAssessmentTweakId);
        }
        if (config.tableAssessmentUrl !== undefined) {
            configurationManager.setTableAssessmentUrl(config.tableAssessmentUrl);
        }
        if (config.tableAssessmentTweakId !== undefined) {
            configurationManager.setTableAssessmentTweakId(config.tableAssessmentTweakId);
        }
        if (config.imageAssessmentUrl !== undefined) {
            configurationManager.setImageAssessmentUrl(config.imageAssessmentUrl);
        }
        if (config.imageAssessmentTweakId !== undefined) {
            configurationManager.setImageAssessmentTweakId(config.imageAssessmentTweakId);
        }

        Utils.toastMessage("Configuration saved successfully.", "Success", 5);
    } catch (error) {
        console.error("Error saving configuration:", error);
        Utils.toastMessage("Failed to save configuration: " + error.message, "Error", 5);
        throw new Error("Failed to save configuration. Please check the inputs.");
    }
}