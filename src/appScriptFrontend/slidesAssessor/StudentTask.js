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
        this.responses = {};              // Object: Mapping of taskIndex to { uid, slideId, response, assessments }
    }

    /**
     * Adds a response to a specific task.
     * @param {string|null} taskIndex - The index of the task.
     * @param {string} uid - The unique ID of this response.
     * @param {string} slideId - The ID of the slide where the task is located.
     * @param {string|null} response - The student's response to the task.
     */
    addResponse(taskIndex, uid, slideId, response) {
        this.responses[taskIndex] = {
            uid: uid,
            slideId: slideId,
            response: response,
            assessment: null // To be filled after LLM assessment
        };
    }

    /**
     * Retrieves a response for a specific task.
     * @param {string} taskIndex - The index of the task.
     * @return {Object|null} - An object containing uid, slideId, response, and assessment, or null if not found.
     */
    getResponse(taskIndex) {
        return this.responses.hasOwnProperty(taskIndex) ? this.responses[taskIndex] : null;
    }

    /**
     * Adds an assessment to a specific task response.
     * @param {string} taskKey - The index/key of the task.
     * @param {string} criterion - The assessment criterion (e.g., 'completeness').
     * @param {Assessment} assessment - The Assessment instance to add.
     */
    addAssessment(taskKey, criterion, assessment) {
        if (this.responses[taskKey]) {
            // Initialize assessment as an empty object if it's null
            if (!this.responses[taskKey].assessment) {
                this.responses[taskKey].assessment = {};
            }
            this.responses[taskKey].assessment[criterion] = {
                "score": assessment.score,
                "reasoning": assessment.reasoning
            };
        } else {
            console.warn(`No response found for taskKey: ${taskKey}`);
        }
    }

    /**
     * Retrieves an assessment for a specific task.
     * @param {string} taskIndex - The index/key of the task.
     * @return {Object|null} - The assessment object or null if not found.
     */
    getAssessment(taskIndex) {
        return this.responses[taskIndex]?.assessment || null;
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
            responses: Object.fromEntries(
                Object.entries(this.responses).map(([key, value]) => [
                    key,
                    {
                        uid: value.uid,
                        slideId: value.slideId,
                        response: value.response,
                        assessment: value.assessment ? value.assessment : null
                    }
                ])
            )
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
        for (const [taskKey, responseObj] of Object.entries(responses)) {
            studentTask.responses[taskKey] = {
                uid: responseObj.uid,
                slideId: responseObj.slideId,
                response: responseObj.response,
                assessment: responseObj.assessment ? responseObj.assessment : null
            };
        }
        return studentTask;
    }

    /**
     * Generates a unique UID for the StudentTask instance.
     * Utilizes the Utils class to generate a hash based on student ID and timestamp.
     * @param {string} slideId - The ID of the slide.
     * @return {string} - The generated UID.
     */
    static generateUID(slideId) {
        const timestamp = new Date().getTime();
        const uniqueString = `${slideId}-${timestamp}`;
        return Utils.generateHash(uniqueString);
    }

    /**
     * Extracts and assigns responses from the student's submission document.
     * @param {SlideExtractor} slideExtractor - An instance of SlideExtractor.
     * @param {Task[]} tasks - An array of Task instances from the Assignment.
     */
    extractAndAssignResponses(slideExtractor, tasks) {
        // Extract tasks from the student's submission document
        const studentTasks = slideExtractor.extractTasksFromSlides(this.documentId);

        // Create a map of taskTitle to task data (slideId and response)
        const submissionMap = {};
        studentTasks.forEach(task => {
            submissionMap[task.taskTitle] = {
                slideId: task.slideId,         // Slide ID within the student's submission document
                response: task.taskReference   // Assuming taskReference holds the response
            };
        });

        // Assign responses ensuring consistency with Assignment's tasks
        Object.keys(tasks).forEach(taskKey => {
            const task = tasks[taskKey];
            const taskTitle = task.taskTitle;
            if (submissionMap.hasOwnProperty(taskTitle)) {
                const { slideId, response } = submissionMap[taskTitle];
                const uid = StudentTask.generateUID(slideId);
                this.addResponse(taskKey, uid, slideId, response);
            } else {
                this.addResponse(taskKey, null, null, null);
            }
        });
    }
}
