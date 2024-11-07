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
  }

  /**
  * Processes image Blobs in tasks and student responses, uploads them, and replaces them with URLs.
  */
  processImageBlobs() {
    const imageRequestManager = new ImageRequestManager();

    // Process tasks
    Object.values(this.tasks).forEach(task => {
      if (task.taskType === 'Image') {
        // Process taskReference
        if (task.taskReference) {
          if (Array.isArray(task.taskReference)) {
            task.taskReference = task.taskReference.map(blob => {
              const url = imageRequestManager.uploadImage(blob);
              return url;
            });
          } else {
            // Single Blob
            const url = imageRequestManager.uploadImage(task.taskReference);
            task.taskReference = url;
          }
        }
        // Process emptyContent
        if (task.emptyContent) {
          if (Array.isArray(task.emptyContent)) {
            task.emptyContent = task.emptyContent.map(blob => {
              const url = imageRequestManager.uploadImage(blob);
              return url;
            });
          } else {
            const url = imageRequestManager.uploadImage(task.emptyContent);
            task.emptyContent = url;
          }
        }
      }
    });

    // Process student responses
    this.studentTasks.forEach(studentTask => {
      Object.keys(studentTask.responses).forEach(taskKey => {
        const responseObj = studentTask.responses[taskKey];
        if (responseObj && responseObj.response) {
          if (Array.isArray(responseObj.response)) {
            // It's an array of Blobs
            responseObj.response = responseObj.response.map(blob => {
              const url = imageRequestManager.uploadImage(blob);
              return url;
            });
          } else if (typeof responseObj.response.getBytes === 'function') {
            // Single Blob
            const url = imageRequestManager.uploadImage(responseObj.response);
            responseObj.response = url;
          }
          // Else, it's a string or null, no action needed
        }
      });
    });
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
    const slideExtractor = new SlideExtractor();

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
    const slideExtractor = new SlideExtractor();

    this.studentTasks.forEach(studentTask => {
      if (studentTask.documentId) {
        studentTask.extractAndAssignResponses(slideExtractor, this.tasks);
      } else {
        console.warn(`No document ID for student: ${studentTask.student.email}. Skipping response extraction.`);
      }
    });
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

  /**
       * Uploads all image blobs in tasks and student responses to the image service.
       * Replaces blobs with the returned URLs.
       */
  uploadAllImages() {
    const imageRequestManager = new ImageRequestManager();

    // Upload images in tasks
    for (const taskKey in this.tasks) {
      const task = this.tasks[taskKey];
      task.uploadImages(imageRequestManager);
    }

    // Upload images in student responses
    for (const studentTask of this.studentTasks) {
      studentTask.uploadResponsesImages(imageRequestManager);
    }

    console.log("All images have been uploaded and URLs have been updated.");
  }
}
