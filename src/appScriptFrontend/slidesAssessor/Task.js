// Task.js

/**
 * Task Class
 * 
 * Represents an individual task within an assignment.
 */
class Task {
    /**
     * Constructs a Task instance.
     * @param {string} taskId - Unique identifier for the task.
     * @param {string} taskTitle - Title or description of the task.
     * @param {string} taskType - Type of the task: "Text", "Table", or "Image".
     * @param {string} slideId - The ID of the slide where the task is located in the reference document.
     * @param {string|null} imageCategory - Applicable only for images (e.g., "diagram", "block code"). Null otherwise.
     * @param {string} taskReference - Reference content for assessment (string or image URL).
     * @param {string} taskNotes - Additional notes for LLM assessment.
     */
    constructor(taskId, taskTitle, taskType, slideId, imageCategory, taskReference, taskNotes) {
        this.taskId = taskId;                 // string
        this.taskTitle = taskTitle;           // string
        this.taskType = taskType;             // string: "Text", "Table", or "Image"
        this.slideId = slideId;               // string: Slide ID in the reference document
        this.imageCategory = imageCategory;   // string: e.g., "diagram" (optional)
        this.taskReference = taskReference;   // string or URL
        this.taskNotes = taskNotes;           // string
        this.inputs = new TaskInputs(taskType, slideId, imageCategory, taskReference, taskNotes); // TaskInputs instance
    }

    /**
     * Serializes the Task instance to a JSON object.
     * @return {Object} - The JSON representation of the Task.
     */
    toJSON() {
        return {
            taskId: this.taskId,
            taskTitle: this.taskTitle,
            taskType: this.taskType,
            slideId: this.slideId,
            imageCategory: this.imageCategory,
            taskReference: this.taskReference,
            taskNotes: this.taskNotes,
            inputs: this.inputs.toJSON()
        };
    }

    /**
     * Deserializes a JSON object to a Task instance.
     * @param {Object} json - The JSON object representing a Task.
     * @return {Task} - The Task instance.
     */
    static fromJSON(json) {
        const { taskId, taskTitle, taskType, slideId, imageCategory, taskReference, taskNotes, inputs } = json;
        return new Task(
            taskId,
            taskTitle,
            taskType,
            slideId,
            imageCategory,
            taskReference,
            taskNotes
        );
    }
}

/**
 * TaskInputs Class
 * 
 * Represents the input details specific to each task.
 */
class TaskInputs {
    /**
     * Constructs a TaskInputs instance.
     * @param {string} taskType - Type of the task: "Text", "Table", or "Image".
     * @param {string} slideId - The ID of the slide where the task is located in the reference document.
     * @param {string|null} imageCategory - Applicable only for images (e.g., "diagram", "block code"). Null otherwise.
     * @param {string} taskReference - Reference content for assessment (string or image URL).
     * @param {string} taskNotes - Additional notes for LLM assessment.
     */
    constructor(taskType, slideId, imageCategory, taskReference, taskNotes) {
        this.taskType = taskType;             // string: "Text", "Table", or "Image"
        this.slideId = slideId;               // string: Slide ID in the reference document
        this.imageCategory = imageCategory;   // string: e.g., "diagram" (optional)
        this.taskReference = taskReference;   // string or URL
        this.taskNotes = taskNotes;           // string
    }

    /**
     * Serializes the TaskInputs instance to a JSON object.
     * @return {Object} - The JSON representation of the TaskInputs.
     */
    toJSON() {
        return {
            taskType: this.taskType,
            slideId: this.slideId,
            imageCategory: this.imageCategory,
            taskReference: this.taskReference,
            taskNotes: this.taskNotes
        };
    }

    /**
     * Deserializes a JSON object to a TaskInputs instance.
     * @param {Object} json - The JSON object representing TaskInputs.
     * @return {TaskInputs} - The TaskInputs instance.
     */
    static fromJSON(json) {
        const { taskType, slideId, imageCategory, taskReference, taskNotes } = json;
        return new TaskInputs(taskType, slideId, imageCategory, taskReference, taskNotes);
    }
}
