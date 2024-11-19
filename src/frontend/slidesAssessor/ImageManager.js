class ImageManager extends BaseRequestManager {
    constructor() {
        super();
        this.uploadUrl = this.configManager.getImageUploadUrl();
        this.apiKey = this.configManager.getImageUploaderApiKey();
    }

    /**
     * Collects all unique slide URLs from the assignment's tasks and student responses.
     * @param {Assignment} assignment - The Assignment instance.
     * @return {Object[]} - An array of objects containing documentId, slideURL, and uid.
     */
    collectAllSlideUrls(assignment) {
        const slideUrls = [];  // Array to hold { documentId, slideURL, uid }

        // Collect from tasks
        for (const taskKey in assignment.tasks) {
            const task = assignment.tasks[taskKey];

            // For Image tasks
            if (task.taskType === 'Image') {
                if (task.taskReference) {
                    slideUrls.push({
                        documentId: assignment.referenceDocumentId,
                        slideURL: task.taskReference,
                        uid: task.uid + '-reference'  // Append 'reference' to distinguish
                    });
                }
                if (task.emptyContent) {
                    slideUrls.push({
                        documentId: assignment.emptyDocumentId,
                        slideURL: task.emptyContent,
                        uid: task.uid + '-empty'  // Append 'empty' to distinguish
                    });
                }
            }
        }

        // Collect from student responses
        for (const studentTask of assignment.studentTasks) {
            if (studentTask.documentId) {
                for (const taskKey in studentTask.responses) {
                    const response = studentTask.responses[taskKey];
                    const task = assignment.tasks[taskKey];

                    if (task.taskType === 'Image' && response.response) {
                        slideUrls.push({
                            documentId: studentTask.documentId,
                            slideURL: response.response,
                            uid: response.uid  // UID from student response
                        });
                    }
                }
            } else {
                console.warn(`No document ID for student: ${studentTask.student.email}. Skipping slide URL collection.`);
            }
        }

        return slideUrls;
    }

    /**
     * Fetches images from the given slide URLs in batches, optimizing to avoid rate limits.
     * @param {Object[]} slideUrls - An array of objects containing documentId, slideURL, and uid.
     * @return {Object[]} - An array of objects containing uid and image Blob.
     */
    batchFetchImages(slideUrls) {
        const batches = [];
        const slidesByDocument = {};

        // Organize slide URLs by documentId
        slideUrls.forEach(slide => {
            const docId = slide.documentId;
            if (!slidesByDocument[docId]) {
                slidesByDocument[docId] = [];
            }
            slidesByDocument[docId].push(slide);
        });

        let batchComplete = false;

        while (!batchComplete) {
            const batch = [];
            batchComplete = true;

            // Take one slide from each documentId
            for (const docId in slidesByDocument) {
                const slides = slidesByDocument[docId];
                if (slides.length > 0) {
                    batch.push(slides.shift());  // Remove and return the first slide
                    batchComplete = false;  // Still have slides to process
                }
            }

            if (batch.length > 0) {
                batches.push(batch);
            }
        }

        // Now we have batches, where each batch contains slides from different documents

        const imageBlobs = [];  // Array to hold { uid, blob }

        batches.forEach((batch, batchIndex) => {
            console.log(`Fetching Slide Image Batch ${batchIndex + 1} of ${batches.length}`);
            const requests = batch.map(slide => {
                return {
                    url: slide.slideURL,
                    method: 'get',
                    headers: {
                        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
                    },
                    muteHttpExceptions: true
                };
            });

            // Use BaseRequestManager's sendRequestsInBatches method
            const responses = this.sendRequestsInBatches(requests);

            responses.forEach((response, index) => {
                const slide = batch[index];
                if (response && response.getResponseCode() === 200) {
                    const blob = response.getBlob().setName(`Slide_${slide.uid}.png`);
                    imageBlobs.push({
                        uid: slide.uid,
                        blob: blob
                    });
                } else {
                    console.warn(`Failed to fetch image for UID: ${slide.uid}`);
                    // Handle failures as needed
                }
            });
        });

        return imageBlobs;
    }

    /**
     * Uploads image Blobs to the image service in batches.
     * @param {Object[]} imageBlobs - An array of objects containing uid and Blob.
     * @return {Object} - A mapping of UIDs to uploaded image URLs.
     */
    batchUploadImages(imageBlobs) {
        const batches = [];
        const batchSize = this.configManager.getBatchSize() || 5; // Get batch size from config, default to 5

        // Split imageBlobs into batches
        for (let i = 0; i < imageBlobs.length; i += batchSize) {
            batches.push(imageBlobs.slice(i, i + batchSize));
        }

        const urlMappings = {};  // Mapping of UIDs to uploaded image URLs

        batches.forEach((batch, batchIndex) => {
            console.log(`Uploading batch ${batchIndex + 1} of ${batches.length}`);

            const requests = batch.map(imageBlobObj => {
                const boundary = '---GoogleAppScriptBoundary';
                const imageBytes = imageBlobObj.blob.getBytes();
                const imageFileName = imageBlobObj.blob.getName();

                // Construct the multipart payload in binary format
                const payloadParts = [
                    Utilities.newBlob(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${imageFileName}"\r\nContent-Type: image/png\r\n\r\n`).getBytes(),
                    imageBytes,
                    Utilities.newBlob(`\r\n--${boundary}--`).getBytes()
                ];

                // Combine all parts into one payload blob
                const fullPayload = Utilities.newBlob(payloadParts.reduce((acc, part) => acc.concat(part), []));

                return {
                    uid: imageBlobObj.uid,
                    url: this.uploadUrl,
                    method: 'post',
                    contentType: `multipart/form-data; boundary=${boundary}`,
                    payload: fullPayload.getBytes(),
                    headers: {
                        'accept': 'application/json',
                        'x-api-key': this.apiKey,
                    },
                    muteHttpExceptions: true
                };
            });

            // Use BaseRequestManager's sendRequestsInBatches method
            const responses = this.sendRequestsInBatches(requests);

            responses.forEach((response, index) => {
                const request = requests[index];
                const uid = request.uid;
                if (response && response.getResponseCode() === 200 || 201) {
                    try {
                        const responseData = JSON.parse(response.getContentText());
                        if (responseData && responseData.file_path) {
                            urlMappings[uid] = responseData.file_path;
                        } else {
                            console.warn(`Invalid response for UID: ${uid}`);
                        }
                    } catch (error) {
                        console.error(`Error parsing response for UID: ${uid}`, error);
                    }
                } else {
                    console.warn(`Failed to upload image for UID: ${uid}`);
                    // Handle failures as needed
                }
            });
        });

        return urlMappings;
    }

    /**
     * Updates the assignment's tasks and student responses with the uploaded image URLs.
     * @param {Assignment} assignment - The Assignment instance.
     * @param {Object} urlMappings - A mapping of UIDs to uploaded image URLs.
     */
    updateAssignmentWithImageUrls(assignment, urlMappings) {
        // Update tasks
        for (const taskKey in assignment.tasks) {
            const task = assignment.tasks[taskKey];
            if (task.taskType === 'Image') {
                // Update taskReference
                if (task.taskReference) {
                    const uid = task.uid + '-reference';
                    if (urlMappings[uid]) {
                        task.taskReference = urlMappings[uid];
                    } else {
                        console.warn(`No uploaded URL found for taskReference UID: ${uid}`);
                    }
                }
                // Update emptyContent
                if (task.emptyContent) {
                    const uid = task.uid + '-empty';
                    if (urlMappings[uid]) {
                        task.emptyContent = urlMappings[uid];
                    } else {
                        console.warn(`No uploaded URL found for emptyContent UID: ${uid}`);
                    }
                }
            }
        }

        // Update student responses
        for (const studentTask of assignment.studentTasks) {
            for (const taskKey in studentTask.responses) {
                const response = studentTask.responses[taskKey];
                const task = assignment.tasks[taskKey];
                if (task.taskType === 'Image' && response.response) {
                    const uid = response.uid;
                    if (urlMappings[uid]) {
                        response.response = urlMappings[uid];
                    } else {
                        console.warn(`No uploaded URL found for response UID: ${uid}`);
                    }
                }
            }
        }
    }
}
