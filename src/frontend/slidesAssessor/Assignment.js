/**
 * Assignment Class
 * 
 * Represents a specific assignment within a course, managing tasks and student submissions.
 */
class Assignment {
  /**
   * Constructs an Assignment instance.
   * @param {string} courseId - The ID of the course.
   * @param {string} assignmentId - The ID of the assignment.
   * @param {string} referenceDocumentId - The ID of the reference slides document.
   * @param {string} emptyDocumentId - The ID of the empty slides document.
   */
  constructor(courseId, assignmentId, referenceDocumentId, emptyDocumentId) {
    this.courseId = courseId;
    this.assignmentId = assignmentId;
    this.assignmentName = this.fetchAssignmentName(courseId, assignmentId);
    this.referenceDocumentId = referenceDocumentId;
    this.emptyDocumentId = emptyDocumentId;
    this.tasks = {};           // { taskKey: Task }
    this.studentTasks = [];    // Array of StudentTask instances
    this.imageManager = new ImageManager(); // Initialize ImageManager instance
  }

  /**
   * Fetches the assignment name from Google Classroom.
   * @param {string} courseId - The ID of the course.
   * @param {string} assignmentId - The ID of the assignment.
   * @return {string} - The name/title of the assignment.
   */
  fetchAssignmentName(courseId, assignmentId) {
    try {
      const courseWork = Classroom.Courses.CourseWork.get(courseId, assignmentId);
      return courseWork.title || `Assignment ${assignmentId}`;
    } catch (error) {
      console.error(`Error fetching assignment name for ID ${assignmentId}:`, error);
      return `Assignment ${assignmentId}`;
    }
  }

  /**
   * Populates tasks from the reference and empty slides.
   * Combines reference and empty content based on task keys.
   */
  populateTasksFromSlides() {
    const slideExtractor = new SlideContentManager();

    // Extract reference tasks
    const referenceTasks = slideExtractor.extractTasksFromSlides(this.referenceDocumentId, "reference");
    // Extract empty tasks
    const emptyTasks = slideExtractor.extractTasksFromSlides(this.emptyDocumentId, "empty");

    // Create a map of tasks from referenceTasks
    const tasksMap = {};
    referenceTasks.forEach(refTask => {
      const key = refTask.taskTitle;
      tasksMap[key] = refTask; // Add the task to the map
    });

    // Update tasks with emptyContent from emptyTasks
    emptyTasks.forEach(emptyTask => {
      const key = emptyTask.taskTitle;
      if (tasksMap[key]) {
        tasksMap[key].emptyContent = emptyTask.emptyContent;
      } else {
        console.warn(`No matching reference task for empty task with key: ${key}`);
        // Optionally, you can decide to add this task or handle it differently
      }
    });

    // Assign the tasksMap to this.tasks
    this.tasks = tasksMap;

    console.log(`Populated ${Object.keys(this.tasks).length} tasks from slides.`);
  }

  /**
   * Adds a student to the assignment.
   * @param {Student} student - The Student instance to add.
   */
  addStudent(student) {
    const studentTask = new StudentTask(student, this.assignmentId, null);
    this.studentTasks.push(studentTask);
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

                  // Find the corresponding StudentTask instance
                  const studentTask = this.studentTasks.find(st => st.student.id === studentId);
                  if (studentTask) {
                    studentTask.documentId = documentId;
                    console.log(`Assigned Document ID ${documentId} to student ${studentTask.student.name} (${studentTask.student.email})`);
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
   * Processes all student submissions by extracting responses.
   */
  processAllSubmissions() {
    const slideExtractor = new SlideContentManager(); // Use SlideContentManager instead of SlideExtractor

    this.studentTasks.forEach(studentTask => {
      if (studentTask.documentId) {
        studentTask.extractAndAssignResponses(slideExtractor, this.tasks);
      } else {
        console.warn(`No document ID for student: ${studentTask.student.email}. Skipping response extraction.`);
      }
    });
  }

  /**
   * Processes images by delegating to ImageManager.
   */
  processImages() {
    this.imageManager.processImages(this);
  }

  /**
   * Generates an array of request objects ready to be sent to the LLM.
   * @return {Object[]} - An array of request objects.
   */
  generateLLMRequests() {
    // Utilize the singleton instance of LLMRequestManager
    const requests = llmRequestManager.generateRequestObjects(this);
    return requests;
  }

  /**
   * Assesses student responses by interacting with the LLM.
   */
  assessResponses() {
    // Utilize the singleton instance of LLMRequestManager

    // Warm up LLM
    llmRequestManager.warmUpLLM();

    // Generate LLM Requests
    const requests = llmRequestManager.generateRequestObjects(this);
    if (requests.length === 0) {
      Utils.toastMessage("No LLM requests to send.", "Info", 3);
      return;
    }

    // Send Requests in Batches and adds the responses to the assignment instance
    llmRequestManager.processStudentResponses(requests, this)
  }
}
