// Task.gs

/**
 * Task Class
 * 
 * Represents an individual task within an assignment.
 */
class Task {
    /**
     * Constructs a Task instance.
     * @param {string} taskTitle - Title or description of the task.
     * @param {string} taskType - Type of the task: "Text", "Table", or "Image".
     * @param {string} slideId - The ID of the slide where the task is located in the reference document.
     * @param {string|null} imageCategory - Applicable only for images (e.g., "diagram", "block code"). Null otherwise.
     * @param {string} taskReference - Reference content for assessment (string or image URL).
     * @param {string|null} taskNotes - Additional notes for LLM assessment. Can be null.
     * @param {string} emptyContent - Blank template content for the task.
     * @param {Blob[]|null} imageBlobs - Array of Blob objects of the slide images (only for Image tasks).
     * @param {string[]|null} referenceImageUrls - Array of URLs of the reference slide images.
     * @param {string[]|null} emptyImageUrls - Array of URLs of the empty slide images.
     */
    constructor(taskTitle, taskType, slideId, imageCategory, taskReference, taskNotes, emptyContent, imageBlobs = null, referenceImageUrls = null, emptyImageUrls = null) {
        this.taskTitle = taskTitle;                     // string
        this.taskType = taskType;                       // string: "Text", "Table", or "Image"
        this.slideId = slideId;                         // string: Slide ID in the reference document
        this.imageCategory = imageCategory;             // string: e.g., "diagram" (optional)
        this.taskReference = taskReference;             // string or URL
        this.taskNotes = taskNotes;                     // string or null
        this.emptyContent = emptyContent;               // string or URL
        this.imageBlobs = imageBlobs;                   // Blob[] or null
        this.referenceImageUrls = referenceImageUrls;   // string[] or null
        this.emptyImageUrls = emptyImageUrls;           // string[] or null
    }

    /**
     * Serializes the Task instance to a JSON object.
     * Converts the image Blobs to Base64 strings if present.
     * @return {Object} - The JSON representation of the Task.
     */
    toJSON() {
        return {
            taskTitle: this.taskTitle,
            taskType: this.taskType,
            slideId: this.slideId,
            imageCategory: this.imageCategory,
            taskReference: this.taskReference,
            taskNotes: this.taskNotes,
            emptyContent: this.emptyContent,
            imageBlobs: this.imageBlobs ? this.imageBlobs.map(blob => Utilities.base64Encode(blob.getBytes())) : null,
            referenceImageUrls: this.referenceImageUrls,
            emptyImageUrls: this.emptyImageUrls
        };
    }

    /**
     * Deserializes a JSON object to a Task instance.
     * Converts the Base64 strings back to Blobs if present.
     * @param {Object} json - The JSON object representing a Task.
     * @return {Task} - The Task instance.
     */
    static fromJSON(json) {
        const { taskTitle, taskType, slideId, imageCategory, taskReference, taskNotes, emptyContent, imageBlobs, referenceImageUrls, emptyImageUrls } = json;
        const blobs = imageBlobs ? imageBlobs.map(base64Str => Utilities.newBlob(Utilities.base64Decode(base64Str), 'image/png', `Slide_${slideId}.png`)) : null;
        return new Task(
            taskTitle,
            taskType,
            slideId,
            imageCategory,
            taskReference,
            taskNotes,
            emptyContent,
            blobs,
            referenceImageUrls || null,
            emptyImageUrls || null
        );
    }
}
