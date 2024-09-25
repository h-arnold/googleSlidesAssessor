// Assignment.js

/**
 * Assignment Class: Superclass
 * 
 * Represents the entire assignment, including tasks and student submissions.
 */
class Assignment {
    /**
     * Constructs an Assignment instance.
     * @param {string} assignmentId - ID of the Google Classroom assignment.
     * @param {string} documentType - Type of the submitted document (e.g., "Google Slide").
     * @param {string} documentId - Unique identifier of the reference document.
     */
    constructor(assignmentId, documentType, documentId) {
        this.assignmentId = assignmentId; // string
        this.documentType = documentType; // string
        this.documentId = documentId;     // string
        this.tasks = [];                  // Array of Task instances
        this.students = [];               // Array of Student instances
        this.slideExtractor = new SlideExtractor(); // Instance of SlideExtractor
    }

    /**
     * Adds a Task to the assignment.
     * @param {Task} task - The Task instance to add.
     */
    addTask(task) {
        if (task instanceof Task) {
            this.tasks.push(task);
        } else {
            throw new Error("addTask expects a Task instance");
        }
    }

    /**
     * Adds a Student to the assignment.
     * @param {Student} student - The Student instance to add.
     */
    addStudent(student) {
        if (student instanceof Student) {
            this.students.push(student);
        } else {
            throw new Error("addStudent expects a Student instance");
        }
    }

    /**
     * Extracts and adds tasks from the reference slides to the assignment.
     */
    populateTasksFromReferenceSlides() {
        const tasks = this.slideExtractor.extractTasksFromSlides(this.documentId);
        tasks.forEach(task => this.addTask(task));
        console.log(`${tasks.length} tasks added to the assignment.`);
    }

    /**
     * Extracts and processes reference slide content.
     * @return {Object} - The processed reference slide data.
     */
    processReferenceSlide() {
        const referenceContent = this.slideExtractor.extractContent(this.documentId);
        // Further processing can be done here, such as sending to LLM or storing in class properties
        return referenceContent;
    }

    /**
     * Extracts and processes a student's slide content.
     * @param {string} studentSlideId - The slide ID of the student's submission.
     * @return {Object} - The processed student slide data.
     */
    processStudentSlide(studentSlideId) {
        const studentContent = this.slideExtractor.extractContent(studentSlideId);
        // Further processing can be done here, such as sending to LLM or storing in class properties
        return studentContent;
    }

    // Additional methods related to Assignment can be added here
}
