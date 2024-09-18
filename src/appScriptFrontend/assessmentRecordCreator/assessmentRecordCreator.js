
var templateSheetId = "PUT YOUR TEMPLATE SHEET ID HERE"
var destinationFolderId = "PUT THE FOLDER YOU WANT TO STORE ALL YOUR ASSESSMENT SHEETS HERE"

function copyTemplateSheet(templateSheetId, destinationFolderId, newSheetName) {
  try {
    // Get the template sheet file by its ID
    const templateSheetFile = DriveApp.getFileById(templateSheetId);
    
    // Get the destination folder by its ID
    const destinationFolder = DriveApp.getFolderById(destinationFolderId);
    
    // Make a copy of the template sheet in the destination folder
    const copiedSheetFile = templateSheetFile.makeCopy(newSheetName, destinationFolder);
    
    console.log('Template sheet copied and renamed successfully.');
    console.log('Copied sheet ID: ' + copiedSheetFile.getId());

    return copiedSheetFile
    
  } catch (e) {
    console.log('Failed to copy and rename the template sheet. Error: ' + e.message);
  }
}

function copyTemplateForActiveCourses() {
  // Get the active spreadsheet and the 'Active Courses' sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const activeCoursesSheet = spreadsheet.getSheetByName('Active Courses');
  
  if (!activeCoursesSheet) {
    console.log('Active Courses sheet not found.');
    return;
  }

  // Get the range of data in the 'Active Courses' sheet
  const dataRange = activeCoursesSheet.getDataRange();
  const data = dataRange.getValues();
  
  // Iterate over each row of data, starting from the second row (index 1)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const courseId = row[0];
    const courseName = row[1];
    
    if (courseId && courseName) {
      try {
        // Use the copyTemplateSheet function to copy and rename the template sheet
        const copiedSheetFile = copyTemplateSheet(templateSheetId, destinationFolderId, courseName);
        
        console.log(`Copied and renamed template sheet for course: ${courseName}`);
        
        // Append values to the 'ClassInfo' sheet in the copied spreadsheet
        appendClassInfoValues(copiedSheetFile.getId(), courseName, courseId);
        
      } catch (e) {
        console.log(`Failed to copy and rename template sheet for course: ${courseName}. Error: ${e.message}`);
      }
    } else {
      console.log(`Invalid course ID or name at row ${i + 1}`);
    }
  }
  //Shares the folder with all the assessment sheets in with everyone who has access to the google classroom
  shareDestinationFolderWithTeachers(destinationFolderId)
}


function appendClassInfoValues(copiedSheetId, className, courseId) {
  try {
    // Open the copied spreadsheet by its ID
    const copiedSpreadsheet = SpreadsheetApp.openById(copiedSheetId);
    
    // Get the 'ClassInfo' sheet
    const classInfoSheet = copiedSpreadsheet.getSheetByName('ClassInfo');
    
    if (!classInfoSheet) {
      console.log('ClassInfo sheet not found in the copied spreadsheet.');
      return;
    }
    
    // Append the values to columns A and B
    classInfoSheet.appendRow(["Class", className]);
    classInfoSheet.appendRow(["Course ID", courseId]);
    
    console.log('Appended class info values successfully.');
  } catch (e) {
    console.log('Failed to append class info values. Error: ' + e.message);
  }
}

function shareDestinationFolderWithTeachers(destinationFolderId) {
  // Get the active spreadsheet and the 'Active Courses' sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const activeCoursesSheet = spreadsheet.getSheetByName('Active Courses');
  
  if (!activeCoursesSheet) {
    console.log('Active Courses sheet not found.');
    return;
  }

  // Get the range of data in the 'Active Courses' sheet
  const dataRange = activeCoursesSheet.getDataRange();
  const data = dataRange.getValues();
  
  // Collect all teacher emails from the spreadsheet
  let teacherEmails = new Set();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    for (let j = 2; j <= 5; j++) { // Assuming teacher emails are in columns C to F (indexes 2 to 5)
      if (row[j] && row[j] !== '') {
        teacherEmails.add(row[j]);
      }
    }
  }
  
  // Get the destination folder by its ID
  const destinationFolder = DriveApp.getFolderById(destinationFolderId);
  
  // Share the destination folder with each teacher email
  teacherEmails.forEach(email => {
    try {
      destinationFolder.addEditor(email);
      console.log(`Shared destination folder with: ${email}`);
    } catch (e) {
      console.log(`Failed to share destination folder with: ${email}. Error: ${e.message}`);
    }
  });
}

function shareDestinationFolderWithTeachers(destinationFolderId) {
  // Get the active spreadsheet and the 'Active Courses' sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const activeCoursesSheet = spreadsheet.getSheetByName('Active Courses');
  
  if (!activeCoursesSheet) {
    console.log('Active Courses sheet not found.');
    return;
  }

  // Get the range of data in the 'Active Courses' sheet
  const dataRange = activeCoursesSheet.getDataRange();
  const data = dataRange.getValues();
  
  // Collect all unique teacher emails from the spreadsheet
  const teacherEmails = new Set();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    for (let j = 2; j <= 5; j++) { // Assuming teacher emails are in columns C to F (indexes 2 to 5)
      if (row[j] && row[j] !== '') {
        teacherEmails.add(row[j]);
      }
    }
  }
  
  // Get the destination folder by its ID
  const destinationFolder = DriveApp.getFolderById(destinationFolderId);
  
  // Share the destination folder with each unique teacher email
  teacherEmails.forEach(email => {
    try {
      destinationFolder.addEditor(email);
      console.log(`Shared destination folder with: ${email}`);
    } catch (e) {
      console.log(`Failed to share destination folder with: ${email}. Error: ${e.message}`);
    }
  });
}
