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
     * @param {string|Blob[]} taskReference - Reference content for assessment (string for Text/Table, Blob[] for Image).
     * @param {string|null} taskNotes - Additional notes for LLM assessment. Can be null.
     * @param {string|Blob[]} emptyContent - Blank template content for the task (string or Blob[]).
     */
    constructor(taskTitle, taskType, slideId, imageCategory, taskReference = null, taskNotes = null, emptyContent = null) {
        this.taskTitle = taskTitle;          // string
        this.taskType = taskType;            // "Text", "Table", or "Image"
        this.slideId = slideId;              // string
        this.imageCategory = imageCategory;  // string or null
        this.taskReference = taskReference;  // string or Blob[] (for Image tasks)
        this.taskNotes = taskNotes;          // string or null
        this.emptyContent = emptyContent;    // string or Blob[] (for Image tasks)
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
            taskReference: this.taskType === "Image" && Array.isArray(this.taskReference)
                ? this.taskReference.map(blob => Utilities.base64Encode(blob.getBytes()))
                : this.taskReference,
            taskNotes: this.taskNotes,
            emptyContent: this.taskType === "Image" && Array.isArray(this.emptyContent)
                ? this.emptyContent.map(blob => Utilities.base64Encode(blob.getBytes()))
                : this.emptyContent
        };
    }

    /**
     * Deserializes a JSON object to a Task instance.
     * Converts the Base64 strings back to Blobs if present.
     * @param {Object} json - The JSON object representing a Task.
     * @return {Task} - The Task instance.
     */
    static fromJSON(json) {
        const { taskTitle, taskType, slideId, imageCategory, taskReference, taskNotes, emptyContent } = json;

        let deserializedTaskReference = taskReference;
        let deserializedEmptyContent = emptyContent;

        if (taskType === "Image") {
            deserializedTaskReference = Array.isArray(taskReference)
                ? taskReference.map(base64Str => Utilities.newBlob(Utilities.base64Decode(base64Str), 'image/png'))
                : null;

            deserializedEmptyContent = Array.isArray(emptyContent)
                ? emptyContent.map(base64Str => Utilities.newBlob(Utilities.base64Decode(base64Str), 'image/png'))
                : null;
        }

        return new Task(
            taskTitle,
            taskType,
            slideId,
            imageCategory,
            deserializedTaskReference,
            taskNotes,
            deserializedEmptyContent
        );
    }
}
