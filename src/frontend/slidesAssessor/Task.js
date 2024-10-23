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
     * @param {string} taskNotes - Additional notes for LLM assessment.
     * @param {string} emptyContent - Blank template content for the task.
     */
    constructor(taskTitle, taskType, slideId, imageCategory, taskReference, taskNotes, emptyContent) {
        this.taskTitle = taskTitle;           // string
        this.taskType = taskType;             // string: "Text", "Table", or "Image"
        this.slideId = slideId;               // string: Slide ID in the reference document
        this.imageCategory = imageCategory;   // string: e.g., "diagram" (optional)
        this.taskReference = taskReference;   // string or URL
        this.taskNotes = taskNotes;           // string
        this.emptyContent = emptyContent;     // string or URL
    }

    /**
     * Serializes the Task instance to a JSON object.
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
            emptyContent: this.emptyContent
        };
    }

    /**
     * Deserializes a JSON object to a Task instance.
     * @param {Object} json - The JSON object representing a Task.
     * @return {Task} - The Task instance.
     */
    static fromJSON(json) {
        const { taskTitle, taskType, slideId, imageCategory, taskReference, taskNotes, emptyContent } = json;
        return new Task(
            taskTitle,
            taskType,
            slideId,
            imageCategory,
            taskReference,
            taskNotes,
            emptyContent
        );
    }
}
