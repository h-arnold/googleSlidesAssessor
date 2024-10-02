/**
 * LLMRequestManager Class
 * 
 * Manages the creation, caching, and sending of request objects to the LLM.
 */
class LLMRequestManager {
    /**
     * Constructs an LLMRequestManager instance.
     */
    constructor() {
        this.configManager = configurationManager; // Reference to the singleton ConfigurationManager
        this.cache = CacheService.getScriptCache(); // Initialize the script cache
    }

    /**
     * Generates a unique cache key based on referenceContent and studentResponse.
     * @param {string} referenceContent - The reference content from the task.
     * @param {string} studentResponse - The student's response.
     * @return {string} - A SHA-256 hash serving as the cache key.
     */
    generateCacheKey(referenceContent, studentResponse) {
        const keyString = JSON.stringify(referenceContent) + JSON.stringify(studentResponse);
        return Utils.generateHash(keyString);
    }

    /**
     * Retrieves cached assessment data if available.
     * @param {string} referenceContent - The reference content from the task.
     * @param {string} studentResponse - The student's response.
     * @return {Object|null} - The cached assessment data or null if not found.
     */
    getCachedAssessment(referenceContent, studentResponse) {
        const cacheKey = this.generateCacheKey(referenceContent, studentResponse);
        const cached = this.cache.get(cacheKey);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                console.error("Error parsing cached assessment data:", e);
                return null;
            }
        }
        return null;
    }

    /**
     * Stores assessment data in the cache.
     * @param {string} referenceContent - The reference content from the task.
     * @param {string} studentResponse - The student's response.
     * @param {Object} assessmentData - The assessment data to cache.
     */
    setCachedAssessment(referenceContent, studentResponse, assessmentData) {
        const cacheKey = this.generateCacheKey(referenceContent, studentResponse);
        const serialized = JSON.stringify(assessmentData);
        const cacheExpirationInSeconds = 6 * 60 * 60; // 6 hours
        this.cache.put(cacheKey, serialized, cacheExpirationInSeconds);
    }

    /**
     * Generates an array of request objects based on the Assignment instance.
     * Utilizes caching to avoid redundant requests.
     * @param {Assignment} assignment - The Assignment instance containing student tasks.
     * @return {Object[]} - An array of request objects ready to be sent via UrlFetchApp.fetchAll().
     */
    generateRequestObjects(assignment) {
        const requests = [];

        assignment.studentTasks.forEach(studentTask => {
            Object.keys(studentTask.responses).forEach(taskKey => {
                const response = studentTask.responses[taskKey];
                const { uid, slideId, response: studentResponse } = response;
                const task = assignment.tasks[taskKey];
                if (!task) {
                    console.warn(`No corresponding task found for task key: ${taskKey}`);
                    return;
                }

                const referenceContent = task.taskReference; // Assuming this holds the reference content
                const cachedAssessment = this.getCachedAssessment(referenceContent, studentResponse);
                if (cachedAssessment) {
                    // Assign assessment directly from cache
                    this.assignAssessmentToStudentTask(uid, cachedAssessment, assignment);
                    Logger.log(`Cache hit for UID: ${uid}. Assigned assessment from cache.`);
                    return; // Skip adding to requests
                }

                const taskType = task.taskType.toLowerCase();

                // Determine the assessment type based on taskType
                let assessmentUrl = '';
                let tweakId = '';

                switch (taskType) {
                    case 'text':
                        assessmentUrl = this.configManager.getTextAssessmentUrl();
                        tweakId = this.configManager.getTextAssessmentTweakId();
                        break;
                    case 'table':
                        assessmentUrl = this.configManager.getTableAssessmentUrl();
                        tweakId = this.configManager.getTableAssessmentTweakId();
                        break;
                    case 'image':
                        assessmentUrl = this.configManager.getImageAssessmentUrl();
                        tweakId = this.configManager.getImageAssessmentTweakId();
                        break;
                    default:
                        console.warn(`Unsupported taskType: ${taskType}. Skipping response with UID: ${uid}`);
                        return; // Skip unsupported task types
                }

                // Validate that tweakId is present
                if (!tweakId) {
                    console.warn(`Missing Tweak ID for taskType: ${taskType}. Skipping response with UID: ${uid}`);
                    return;
                }

                // Construct the tweaks object with the uid
                const tweaks = {};
                tweaks[tweakId] = {
                    referenceTask: referenceContent,
                    emptyTask: task.emptyContent,
                    studentTask: studentResponse
                    // uid is stored separately for easy access
                };

                // Include notes if available
                if (task.taskNotes && task.taskNotes.trim() !== '') {
                    tweaks[tweakId]['notes'] = task.taskNotes;
                }

                // Prepare the final request payload structure
                const requestPayload = {
                    input_value: JSON.stringify(studentResponse),
                    tweaks: tweaks
                };

                // Construct the request object
                const request = {
                    uid: uid, // Include uid at the top level for easy access
                    url: assessmentUrl,
                    method: "post",
                    contentType: "application/json",
                    payload: JSON.stringify(requestPayload),
                    headers: {
                        "x-api-key": this.configManager.getLangflowApiKey()
                    },
                    muteHttpExceptions: true
                };

                requests.push(request);
            });
        });

        Logger.log(`Generated ${requests.length} request objects for LLM.`);
        return requests;
    }

    /**
     * Sends the generated request objects to the LLM in batches.
     * @param {Object[]} requests - An array of request objects to send.
     * @param {Assignment} assignment - The Assignment instance containing StudentTasks.
     * @return {void}
     */
    sendRequestsInBatches(requests, assignment) {
        if (!requests || requests.length === 0) {
            Logger.log("No requests to send.");
            return;
        }

        const batchSize = this.configManager.getBatchSize();
        Logger.log(`Processing requests in batches of ${batchSize}.`);

        // Split requests into batches
        const batches = [];
        for (let i = 0; i < requests.length; i += batchSize) {
            batches.push(requests.slice(i, i + batchSize));
        }

        Logger.log(`Total batches to process: ${batches.length}`);

        // Process each batch sequentially
        batches.forEach((batch, batchIndex) => {
            Logger.log(`Processing batch ${batchIndex + 1} of ${batches.length}.`);

            // Send the current batch
            const responses = this.sendSingleBatch(batch);

            // Process responses
            this.processResponses(responses, batch, assignment);
        });
    }

    /**
     * Sends a single batch of requests to the LLM.
     * @param {Object[]} batch - An array of request objects in the current batch.
     * @return {HTTPResponse[]} - An array of responses from the LLM.
     */
    sendSingleBatch(batch) {
        try {
            const responses = UrlFetchApp.fetchAll(batch);
            Logger.log(`Sent batch of ${batch.length} requests.`);
            return responses;
        } catch (error) {
            console.error("Error sending batch of requests to the LLM:", error);
            return [];
        }
    }

    /**
     * Processes the responses from the LLM and assigns assessments to StudentTasks.
     * Also caches successful assessments.
     * @param {Object[]} responses - Array of HTTPResponse objects from UrlFetchApp.fetchAll().
     * @param {Object[]} batch - Array of request objects sent in the current batch.
     * @param {Assignment} assignment - The Assignment instance containing StudentTasks.
     */
    processResponses(responses, batch, assignment) {
        responses.forEach((response, index) => {
            const request = batch[index];
            const uid = request.uid;

            if (response.getResponseCode() === 200) {
                try {
                    const responseData = JSON.parse(response.getContentText());

                    // Adjust parsing based on actual response structure
                    const assessmentData = JSON.parse(responseData.outputs[0].outputs[0].messages[0].message);

                    // Validate the assessment data structure
                    if (this.validateAssessmentData(assessmentData)) {
                        const assessment = this.createAssessmentFromData(assessmentData);

                        // Find the StudentTask and assign the assessment
                        this.assignAssessmentToStudentTask(uid, assessment, assignment);

                        // Cache the successful assessment
                        const studentTask = this.findStudentTaskByUid(uid, assignment);
                        if (studentTask) {
                            const taskKey = this.findTaskKeyByUid(uid, studentTask);
                            const task = assignment.tasks[taskKey];
                            if (task) {
                                const referenceContent = task.taskReference;
                                const studentResponse = studentTask.responses[taskKey].response;
                                this.setCachedAssessment(referenceContent, studentResponse, assessmentData);
                                Logger.log(`Cached assessment for UID: ${uid}.`);
                            }
                        }
                    } else {
                        console.warn(`Invalid assessment data structure for UID: ${uid}`);
                        // Optionally, mark this response for retry
                        this.retryRequest(request, assignment);
                    }
                } catch (e) {
                    console.error(`Error parsing response for UID: ${uid} - ${e.message}`);
                    this.retryRequest(request, assignment);
                }
            } else {
                console.error(`Non-200 response for UID: ${uid} - Code: ${response.getResponseCode()}`);
                this.retryRequest(request, assignment);
            }
        });
    }

    /**
     * Validates the structure of the assessment data returned by the LLM.
     * @param {Object} data - The assessment data.
     * @return {boolean} - True if valid, false otherwise.
     */
    validateAssessmentData(data) {
        const requiredCriteria = ['completeness', 'accuracy', 'spag'];
        return requiredCriteria.every(criterion =>
            data.hasOwnProperty(criterion) &&
            typeof data[criterion].score === 'number' &&
            typeof data[criterion].reasoning === 'string'
        );
    }

    /**
     * Creates an Assessment instance from LLM data.
     * @param {Object} data - The assessment data from LLM.
     * @return {Object} - An object mapping criteria to Assessment instances.
     */
    createAssessmentFromData(data) {
        // Assuming uniform criteria; adjust if criteria vary
        const assessments = {};
        for (const [criterion, details] of Object.entries(data)) {
            assessments[criterion] = new Assessment(details.score, details.reasoning);
        }
        return assessments;
    }

    /**
     * Assigns the assessment to the corresponding StudentTask based on UID.
     * @param {string} uid - The unique identifier of the response.
     * @param {Object} assessmentData - The assessment data to assign.
     * @param {Assignment} assignment - The Assignment instance.
     */
    assignAssessmentToStudentTask(uid, assessmentData, assignment) {
        // Iterate through studentTasks to find the matching UID
        for (const studentTask of assignment.studentTasks) {
            for (const [taskKey, response] of Object.entries(studentTask.responses)) {
                if (response.uid === uid) {
                    // Assign each criterion's assessment
                    for (const [criterion, assessment] of Object.entries(assessmentData)) {
                        studentTask.addAssessment(taskKey, criterion, assessment);
                    }
                    return; // Assessment assigned; exit the function
                }
            }
        }
        console.warn(`No matching StudentTask found for UID: ${uid}`);
    }

    /**
     * Finds the StudentTask instance by UID.
     * @param {string} uid - The unique identifier of the response.
     * @param {Assignment} assignment - The Assignment instance.
     * @return {StudentTask|null} - The matching StudentTask or null if not found.
     */
    findStudentTaskByUid(uid, assignment) {
        for (const studentTask of assignment.studentTasks) {
            for (const response of Object.values(studentTask.responses)) {
                if (response.uid === uid) {
                    return studentTask;
                }
            }
        }
        return null;
    }

    /**
     * Finds the task key within a StudentTask by UID.
     * @param {string} uid - The unique identifier of the response.
     * @param {StudentTask} studentTask - The StudentTask instance.
     * @return {string|null} - The task key or null if not found.
     */
    findTaskKeyByUid(uid, studentTask) {
        for (const [taskKey, response] of Object.entries(studentTask.responses)) {
            if (response.uid === uid) {
                return taskKey;
            }
        }
        return null;
    }

    /**
     * Retries a failed request by re-adding it to the requests array.
     * Implements exponential backoff for retries.
     * @param {Object} request - The original request object.
     * @param {Assignment} assignment - The Assignment instance.
     */
    retryRequest(request, assignment) {
        const maxRetries = 3;
        request.retries = request.retries || 0;

        if (request.retries < maxRetries) {
            request.retries += 1;
            const delay = Math.pow(2, request.retries) * 1000; // Exponential backoff

            Logger.log(`Retrying UID: ${request.uid} - Attempt ${request.retries} after ${delay}ms`);

            Utilities.sleep(delay);

            // Resend the request
            try {
                const newResponse = UrlFetchApp.fetch(request.url, request);
                this.processResponses([newResponse], [request], assignment);
            } catch (e) {
                console.error(`Retry failed for UID: ${request.uid} - ${e.message}`);
                // Optionally, implement further retry logic or logging
                this.retryRequest(request, assignment); // Recursive retry
            }
        } else {
            console.error(`Max retries exceeded for UID: ${request.uid}`);
            // Optionally, mark the assessment as failed or notify the administrator
            Utils.toastMessage(`Failed to process assessment for UID: ${request.uid}`, "Error", 5);
        }
    }

    /**
     * Warms up the LLM backend by sending a dummy request.
     */
    warmUpLLM() {
        const payload = {
            "input_value": "Wake Up!"
        };

        const request = {
            url: this.configManager.getWarmUpUrl(),
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(payload),
            headers: {
                "x-api-key": this.configManager.getLangflowApiKey()
            },
            muteHttpExceptions: true
        };

        try {
            UrlFetchApp.fetch(request.url, request);
            Utils.toastMessage("AI backend warmed up and ready to go...", "Warm-Up", 5);
        } catch (e) {
            console.error("Error warming up LLM:", e);
            Utils.toastMessage("Failed to warm up AI backend.", "Error", 5);
        }
    }
}

// Ensure singleton instance (if needed)
const llmRequestManager = new LLMRequestManager();
Object.freeze(llmRequestManager);
