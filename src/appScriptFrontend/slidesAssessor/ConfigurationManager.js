// ConfigurationManager.gs

/**
 * ConfigurationManager Class
 * 
 * Manages all configuration-related operations, including storing, retrieving,
 * and updating script properties.
 * 
 * Implements the Singleton pattern to ensure a single instance manages configurations.
 */
class ConfigurationManager {
    /**
     * Configuration Keys
     * 
     * Defines all the keys used for storing configuration properties.
     */
    static get CONFIG_KEYS() {
        return {
            BATCH_SIZE: 'batchSize',
            LANGFLOW_API_KEY: 'langflowApiKey',
            LANGFLOW_URL: 'langflowUrl',
            WARM_UP_URL: 'warmUpUrl',
            REFERENCE_SLIDE_ID: 'referenceSlideId',
            EMPTY_SLIDE_ID: 'emptySlideId'
        };
    }

    /**
     * Constructs a ConfigurationManager instance.
     * 
     * Initializes the script properties and caches them for quick access.
     * Implements the Singleton pattern to ensure only one instance exists.
     */
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
     * 
     * @return {Object} - An object containing all configuration properties.
     */
    getAllConfigurations() {
        if (!this.configCache) {
            this.configCache = this.scriptProperties.getProperties();
        }
        return this.configCache;
    }

    /**
     * Retrieves a specific configuration property by key.
     * 
     * @param {string} key - The configuration key.
     * @return {string} - The value of the configuration property, or an empty string if not set.
     */
    getProperty(key) {
        if (!this.configCache) {
            this.getAllConfigurations();
        }
        return this.configCache[key] || '';
    }

    /**
     * Sets a specific configuration property by key.
     * 
     * @param {string} key - The configuration key.
     * @param {string|number} value - The value to set for the configuration property.
     */
    setProperty(key, value) {
        // Optional: Add validation based on key
        if (key === ConfigurationManager.CONFIG_KEYS.BATCH_SIZE) {
            if (!Number.isInteger(value) || value <= 0) {
                throw new Error("Batch Size must be a positive integer.");
            }
        }

        this.scriptProperties.setProperty(key, value.toString());
        this.configCache = null; // Invalidate cache
    }

    /**
     * Sets multiple configuration properties at once.
     * 
     * @param {Object} config - An object containing key-value pairs of configurations.
     */
    setProperties(config) {
        // Optional: Add validation for each property
        Object.entries(config).forEach(([key, value]) => {
            if (key === ConfigurationManager.CONFIG_KEYS.BATCH_SIZE) {
                if (!Number.isInteger(value) || value <= 0) {
                    throw new Error("Batch Size must be a positive integer.");
                }
            }
            // Add more validations as needed
        });

        this.scriptProperties.setProperties(config);
        this.configCache = null; // Invalidate cache
    }

    // -------------------
    // Getter Methods
    // -------------------



    /**
     * Retrieves the Batch Size configuration.
     * 
     * @return {number} - The batch size, or a default value (e.g., 5) if not set.
     */
    getBatchSize() {
        const value = parseInt(this.getProperty(ConfigurationManager.CONFIG_KEYS.BATCH_SIZE), 10);
        return isNaN(value) ? 5 : value; // Default batch size is 5
    }

    /**
     * Retrieves the Langflow API Key configuration.
     * 
     * @return {string} - The Langflow API Key.
     */
    getLangflowApiKey() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_API_KEY);
    }

    /**
     * Retrieves the Langflow URL configuration.
     * 
     * @return {string} - The Langflow URL.
     */
    getLangflowUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_URL);
    }

    /**
     * Retrieves the Warm-Up URL configuration.
     * 
     * @return {string} - The Warm-Up URL.
     */
    getWarmUpUrl() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.WARM_UP_URL);
    }

    /**
     * Retrieves the Reference Slide ID configuration.
     * 
     * @return {string} - The Reference Slide ID.
     */
    getReferenceSlideId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.REFERENCE_SLIDE_ID);
    }

    /**
     * Retrieves the Empty Slide ID configuration.
     * 
     * @return {string} - The Empty Slide ID.
     */
    getEmptySlideId() {
        return this.getProperty(ConfigurationManager.CONFIG_KEYS.EMPTY_SLIDE_ID);
    }

    // -------------------
    // Setter Methods
    // -------------------

    /**
     * Sets the Batch Size configuration.
     * 
     * @param {number} batchSize - The batch size to set.
     */
    setBatchSize(batchSize) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.BATCH_SIZE, batchSize);
    }

    /**
     * Sets the Langflow API Key configuration.
     * 
     * @param {string} apiKey - The Langflow API Key to set.
     */
    setLangflowApiKey(apiKey) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_API_KEY, apiKey);
    }

    /**
     * Sets the Langflow URL configuration.
     * 
     * @param {string} url - The Langflow URL to set.
     */
    setLangflowUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.LANGFLOW_URL, url);
    }

    /**
     * Sets the Warm-Up URL configuration.
     * 
     * @param {string} url - The Warm-Up URL to set.
     */
    setWarmUpUrl(url) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.WARM_UP_URL, url);
    }

    /**
     * Sets the Reference Slide ID configuration.
     * 
     * @param {string} slideId - The Reference Slide ID to set.
     */
    setReferenceSlideId(slideId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.REFERENCE_SLIDE_ID, slideId);
    }

    /**
     * Sets the Empty Slide ID configuration.
     * 
     * @param {string} slideId - The Empty Slide ID to set.
     */
    setEmptySlideId(slideId) {
        this.setProperty(ConfigurationManager.CONFIG_KEYS.EMPTY_SLIDE_ID, slideId);
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
        // Validate and set each property using ConfigurationManager's setter methods
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
        toastMessage("Configuration saved successfully.");
    } catch (error) {
        console.error("Error saving configuration:", error);
        throw new Error("Failed to save configuration. Please check the inputs.");
    }
}