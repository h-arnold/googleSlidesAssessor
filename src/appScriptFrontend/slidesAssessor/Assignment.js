// Assignment.js

/**
 * Assignment Class: Superclass
 * 
 * Represents the entire assignment, including tasks and student submissions.
 */
class Assignment {
    /**
     * Constructs an Assignment instance.
     * @param {string} assignmentId - ID of the Google Classroom assignment (courseWorkId).
     * @param {string} courseId - ID of the Google Classroom course.
     * @param {string} documentType - Type of the submitted document (e.g., "Google Slide").
     * @param {string} documentId - Unique identifier of the reference document.
     */
    constructor(assignmentId, courseId, documentType, documentId) {
        this.assignmentId = assignmentId; // string: courseWorkId
        this.courseId = courseId;         // string: courseId
        this.documentType = documentType; // string
        this.documentId = documentId;     // string
        this.tasks = [];                  // Array of Task instances
        this.students = [];               // Array of Student instances
        this.studentTasks = [];           // Array of StudentTask instances
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
     * Adds a StudentTask to the assignment.
     * @param {StudentTask} studentTask - The StudentTask instance to add.
     */
    addStudentTask(studentTask) {
        if (studentTask instanceof StudentTask) {
            this.studentTasks.push(studentTask);
        } else {
            throw new Error("addStudentTask expects a StudentTask instance");
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
     * Fetches and assigns submitted Google Slides documents for each student.
     * Accurately detects Google Slides attachments by verifying MIME types.
     */
    fetchSubmittedSlides() {
        try {
            // Fetch all student submissions for the specific assignment
            const response = Classroom.Courses.CourseWork.StudentSubmissions.list(this.courseId, this.assignmentId);
            const submissions = response.studentSubmissions;

            if (!submissions || submissions.length === 0) {
                console.log(`No submissions found for assignment ID: ${this.assignmentId}`);
                return;
            }

            submissions.forEach(submission => {
                const studentId = submission.userId; // Google Classroom Student ID (string)
                const attachments = submission.assignmentSubmission?.attachments;

                if (attachments && attachments.length > 0) {
                    attachments.forEach(attachment => {
                        if (attachment.driveFile && attachment.driveFile.id) {
                            const driveFileId = attachment.driveFile.id;

                            try {
                                // Fetch the Drive file using DriveApp
                                const file = DriveApp.getFileById(driveFileId);
                                const mimeType = file.getMimeType();

                                // Check if the MIME type matches Google Slides
                                if (mimeType === MimeType.GOOGLE_SLIDES) {
                                    const documentId = driveFileId;

                                    // Find the corresponding Student instance
                                    const student = this.students.find(s => s.id === studentId);
                                    if (student) {
                                        student.documentId = documentId;
                                        console.log(`Assigned Document ID ${documentId} to student ${student.name} (${student.email})`);
                                    } else {
                                        console.log(`No matching student found for student ID: ${studentId}`);
                                    }
                                } else {
                                    console.log(`Attachment with Drive File ID ${driveFileId} is not a Google Slides document (MIME type: ${mimeType}).`);
                                }
                            } catch (fileError) {
                                console.error(`Error fetching Drive file with ID ${driveFileId}:`, fileError);
                            }
                        } else {
                            console.log(`Attachment for student ID ${studentId} is not a Drive File or lacks a valid ID.`);
                        }
                    });
                } else {
                    console.log(`No attachments found for student ID: ${studentId}`);
                }
            });
        } catch (error) {
            console.error(`Error fetching submissions for assignment ID ${this.assignmentId}:`, error);
        }
    }

    /**
     * Processes a student's submission by extracting responses and creating a StudentTask instance.
     * @param {Student} student - The Student instance whose submission is to be processed.
     */
    processStudentSubmission(student) {
        if (!student.documentId) {
            console.log(`No document submitted for student: ${student.name} (${student.email})`);
            return;
        }

        const uid = StudentTask.generateUID(student.id);
        const studentTask = new StudentTask(student, this.assignmentId, student.documentId);
        studentTask.extractAndAssignResponses(this.slideExtractor, this.tasks);
        this.addStudentTask(studentTask);
        console.log(`Processed submission for student: ${student.name}`);
    }

    /**
     * Processes all student submissions in the assignment.
     */
    processAllSubmissions() {
        this.fetchSubmittedSlides();

        this.students.forEach(student => {
            this.processStudentSubmission(student);
        });

        console.log(`Processed submissions for ${this.studentTasks.length} students.`);
    }

    /**
     * Serializes the Assignment instance to a JSON object.
     * @return {Object} - The JSON representation of the Assignment.
     */
    toJSON() {
        return {
            assignmentId: this.assignmentId,
            courseId: this.courseId,
            documentType: this.documentType,
            documentId: this.documentId,
            tasks: this.tasks.map(task => task.toJSON()),
            students: this.students.map(student => student.toJSON()),
            studentTasks: this.studentTasks.map(studentTask => studentTask.toJSON())
        };
    }

    /**
     * Deserializes a JSON object to an Assignment instance.
     * @param {Object} json - The JSON object representing an Assignment.
     * @return {Assignment} - The Assignment instance.
     */
    static fromJSON(json) {
        const { assignmentId, courseId, documentType, documentId, tasks, students, studentTasks } = json;
        const assignment = new Assignment(assignmentId, courseId, documentType, documentId);

        // Deserialize Tasks
        tasks.forEach(taskJson => {
            const task = Task.fromJSON(taskJson);
            assignment.addTask(task);
        });

        // Deserialize Students
        students.forEach(studentJson => {
            const student = Student.fromJSON(studentJson);
            assignment.addStudent(student);
        });

        // Deserialize StudentTasks
        studentTasks.forEach(studentTaskJson => {
            const studentTask = StudentTask.fromJSON(studentTaskJson);
            assignment.addStudentTask(studentTask);
        });

        return assignment;
    }
}
