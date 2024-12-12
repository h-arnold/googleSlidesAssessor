function createGoogleClassrooms() {
  // Open the spreadsheet by its ID and select the active sheet
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = spreadsheet.getActiveSheet();

  // Get the range of data, including headers
  let dataRange = sheet.getDataRange();
  let data = dataRange.getValues();

  // Get the headers (first row)
  let headers = data[0];

  // Iterate over the rows of data, starting from the second row (index 1)
  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    let id = row[0];
    let name = row[1];
    let teachers = [];

    // Collect non-empty teacher emails from columns Teacher 1, Teacher 2, Teacher 3, and Teacher 4
    for (let j = 2; j <= 5; j++) {
      if (row[j] !== '') {
        teachers.push(row[j]);
      }
    }

    // Create a new Google Classroom
    let course = {
      name: name,
      section: '',
      descriptionHeading: '',
      description: '',
      room: '',
      ownerId: teachers[0], // The first teacher will be the owner
      courseState: 'ACTIVE'
    };
    let newCourse = Classroom.Courses.create(course);

    sheet.getRange(i + 1, 1).setValue(newCourse.id);
    sheet.getRange(i + 1, 7).setValue(newCourse.enrollmentCode);

    // Send invitations to the remaining teachers to join the course
    for (let k = 0; k < teachers.length; k++) {
      try {
        let invitation = {
          courseId: newCourse.id,
          role: 'TEACHER',
          userId: teachers[k]
        };

        if (invitation.userId !== teachers[0]) {//Only send an invitation if the teacher isn't the owner.
          Classroom.Invitations.create(invitation);
        }
      } catch (e) {
        console.log('Failed to send invitation to teacher: ' + teachers[k] + ' for course: ' + newCourse.id + ' Error: ' + e.message);
      }
    }
  }
}

function updateGoogleClassrooms() {
  // Open the active spreadsheet and select the active sheet
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getActiveSheet();

  // Get the range of data, including headers
  let dataRange = sheet.getDataRange();
  let data = dataRange.getValues();

  // Iterate over the rows of data, starting from the second row (index 1)
  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    let courseId = row[0];
    let name = row[1]
    let owner = row[2];
    let teachers = [];

    // Collect non-empty teacher emails from columns Teacher 1, Teacher 2, Teacher 3, and Teacher 4
    for (let j = 2; j <= 5; j++) {
      if (row[j] !== '') {
        teachers.push(row[j]);
      }
    }

    if (courseId) { // Only proceed if there is a courseId in the first column
      try {
        // Get the existing teachers for the course
        let existingTeachers = Classroom.Courses.Teachers.list(courseId).teachers || [];
        let existingTeacherEmails = existingTeachers.map(function (teacher) {
          return teacher.profile.emailAddress;
        });

        // Check if the current owner is different from the desired owner
        let course = Classroom.Courses.get(courseId);
        if (course.ownerId !== owner) {
          // Change the course owner
          try {
            Classroom.Courses.update({ ownerId: owner, "name": name }, courseId);
          } catch (e) {
            console.log('Failed to change owner to: ' + owner + ' for course: ' + courseId + ' Error: ' + e.message);
          }
        }

        // Add missing teachers
        for (let k = 0; k < teachers.length; k++) {
          if (!existingTeacherEmails.includes(teachers[k])) {
            try {
              let invitation = {
                courseId: courseId.toString(),
                role: 'TEACHER',
                userId: teachers[k]
              };
              Classroom.Invitations.create(invitation);
            } catch (e) {
              Logger.log('Failed to send invitation to teacher: ' + teachers[k] + ' for course: ' + courseId + ' Error: ' + e.message);
            }
          }
        }
      } catch (e) {
        console.log('Failed to update course: ' + courseId + ' for row: ' + (i + 1) + ' Error: ' + e.message);
      }
    }
  }
}

function fetchGoogleClassrooms() {
  // Get the active spreadsheet and sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();

  // Clear the existing data in the sheet
  sheet.clear();

  // Set the headers in the first row
  const headers = ['Classroom ID', 'Name', 'Teacher 1', 'Teacher 2', 'Teacher 3', 'Teacher 4', 'Enrollment Code'];
  sheet.appendRow(headers);

  // Get the list of courses where the user is a teacher
  const courses = Classroom.Courses.list({ teacherId: 'me' }).courses || [];

  // Iterate over each course and populate the data
  for (const course of courses) {
    // Get the list of teachers for the course
    const teachers = Classroom.Courses.Teachers.list(course.id).teachers || [];
    const teacherEmails = teachers.map(teacher => teacher.profile.emailAddress);

    // Create a row with course details
    const row = [
      course.id,                   // Classroom ID
      course.name,                 // Name
      teacherEmails[0] || '',      // Teacher 1
      teacherEmails[1] || '',      // Teacher 2
      teacherEmails[2] || '',      // Teacher 3
      teacherEmails[3] || '',      // Teacher 4
      course.enrollmentCode || ''  // Enrollment Code
    ];

    // Append the row to the sheet
    sheet.appendRow(row);
  }
}

