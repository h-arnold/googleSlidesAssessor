// StudentTask.js

/**
 * StudentTask Class
 * 
 * Represents a student's submission for an assignment, containing responses to each task.
 */
class StudentTask {
    /**
     * Constructs a StudentTask instance.
  
     * @param {Student} student - The Student instance associated with this submission.
     * @param {string} assignmentId - The ID of the associated Assignment.
     * @param {string} documentId - The ID of the student's submission document.
     */
    constructor(student, assignmentId, documentId) {
        this.student = student;           // Student: Associated student
        this.assignmentId = assignmentId; // string: ID of the assignment
        this.documentId = documentId;     // string: Document ID of the student's submission
        this.responses = {};              // Object: Mapping of taskId to { slideId, response }
    }

    /**
     * Adds a response to a specific task.
     * @param {string} uid - The unique ID of this response
     * @param {string} taskId - The ID of the task.
     * @param {string} slideId - The ID of the slide where the task is located.
     * @param {string|null} response - The student's response to the task.
     */
    addResponse(index, uid, slideId, response) {
        this.responses[index] = {
            uid: uid,
            slideId: slideId,
            response: response
        };
    }

    /**
     * Retrieves a response for a specific task.
     * @param {string} taskId - The ID of the task.
     * @return {Object|null} - An object containing slideId and response, or null if not found.
     */
    getResponse(taskId) {
        return this.responses.hasOwnProperty(taskId) ? this.responses[taskId] : null;
    }

    /**
     * Serializes the StudentTask instance to a JSON object.
     * @return {Object} - The JSON representation of the StudentTask.
     */
    toJSON() {
        return {
            student: this.student.toJSON(),
            assignmentId: this.assignmentId,
            documentId: this.documentId,
            responses: this.responses
        };
    }

    /**
     * Deserializes a JSON object to a StudentTask instance.
     * @param {Object} json - The JSON object representing a StudentTask.
     * @return {StudentTask} - The StudentTask instance.
     */
    static fromJSON(json) {
        const { student, assignmentId, documentId, responses } = json;
        const studentInstance = Student.fromJSON(student);
        const studentTask = new StudentTask(studentInstance, assignmentId, documentId);
        studentTask.responses = responses;
        return studentTask;
    }

    /**
     * Generates a unique UID for the StudentTask instance.
     * Utilizes the Utils class to generate a hash based on student ID and timestamp.
     * @param {string} studentId - The unique ID of the student.
     * @return {string} - The generated UID.
     */
    static generateUID(slideId) {
        const timestamp = new Date().getTime();
        const uniqueString = `${slideId}-${timestamp}`;
        return Utils.generateHash(uniqueString);
    }

    /**
     * Extracts and processes the student's submission document.
     * Utilizes the SlideExtractor to extract responses.
     * @param {SlideExtractor} slideExtractor - An instance of SlideExtractor.
     * @param {Task[]} tasks - An array of Task instances from the Assignment.
     */
    extractAndAssignResponses(slideExtractor, tasks) {
        // Extract tasks from the student's submission document
        const studentTasks = slideExtractor.extractTasksFromSlides(this.documentId);

        // Create a map of taskId to task data (slideId and response)
        const submissionMap = {};
        studentTasks.forEach(task => {
            submissionMap[task.taskTitle] = {
                slideId: task.slideId,         // Slide ID within the student's submission document
                response: task.taskReference   // Assuming taskReference holds the response
            };
        });

        // Assign responses ensuring consistency with Assignment's tasks
        tasks.forEach((task, index) => {
            if (submissionMap.hasOwnProperty(task.taskTitle)) {
                const { slideId, response } = submissionMap[task.taskTitle];
                this.addResponse(index, StudentTask.generateUID(slideId), slideId, response);
            } else {
                // Handle missing tasks (e.g., assign null or a default value)
                this.addResponse(null, null, null);
            }
        });
    }
}
