// UpdateManager.gs

// Declaring this global constant here for now in lieu of a better way of defining this later on. This needs to be updated with each
// version update (for now) as this is appended to the admin sheet filename.
/**
 * Update Manager Class
 * Orchestrates the copying of spreadsheet data, including Script and Document Properties from 
 * the 'Admin' and Assessment Record sheets to updated templates which have the latest version of 
 * code. This class is necessary because most education establishments don't allow AppScript API
 * access (for obvious reasons) and copy and pasting code manually is slow and unwieldy.
 * 
 */

class UpdateManager {
  constructor() {
    this.sheet = SpreadsheetApp.getActiveSpreadsheet();
    this.ui = new UIManager(this.sheet);
    this.progressTracker = new ProgressTracker();
    this.classroomSheet = new ClassroomSheetManager('Classrooms', this.sheet.getId());
    this.versionNo = "0.4.0";
    this.assessmentRecordSheets = {};
    this.adminSheetsDetails = {};
  }

  cloneSheets(assessmentRecordSheets, templateSheetId) {
    const destinationFolderId = `1kNeyJanDBpF6XaRSx2zc-W6vP6UaPECN`
    Object.keys(assessmentRecordSheets).forEach(className => {

      const newSheet = SheetCloner.cloneEverything({
        "templateSheetId": templateSheetId,
        "newSpreadsheetName": className,
        "sourceSpreadsheetId": assessmentRecordSheets[className].originalSheetId,
        "copyDocProps": true,
        "copyScriptProps": true,
        "destinationFolderId": destinationFolderId
      })

      assessmentRecordSheets[className].newSheetId = newSheet.fileId
    })

    return assessmentRecordSheets

  }

  /**
   * Gets the class name and file ID of all assessment records listed in the 
   * 'Classrooms Sheet'
   */
  getAssessmentRecordDetails() {
    const headerIndicies = this.classroomSheet.getColumnIndicesFromHeader([`Name`, `AR File ID`]);
    const sheetsData = this.classroomSheet.getData()
    //Remove header rows
    sheetsData.shift()

    let assessmentRecordSheets = {}

    sheetsData.forEach(row => {
      //Adds a element to the assessmentRecordsheet object if there's a file ID in the row.
      if (row[headerIndicies.arfileid]) {
        assessmentRecordSheets[row[headerIndicies.name]] = {
          "originalSheetId": row[headerIndicies.arfileid],
          "newSheetId": "" //leave this attribute blank for now
        }
      }
    });

    return this.assessmentRecordSheets = assessmentRecordSheets
  }

  /** 
   * Helper method to get admin sheet (the sheet this script is bound to) details
   * in readiness for cloning.
   */

  getAdminSheetDetails() {
    let adminSheet = {}
    const adminSheetName = `Assessment Bot v${this.versionNo}`
    adminSheet[adminSheetName] = {
      "originalSheetId": this.sheet.getId(),
      "newSheetId": "" //leave blank for now.
    }
    return this.adminSheetsDetails = adminSheet;

  }

  /**
   * Updates the 'Classoom' sheet in the new Admin Spreadsheet with the latest Assessment Record sheet Ids.
   * 
   */
  updateClassroomSheetWithNewAssessmentRecords() {
    const newClassroomSheet = new ClassroomSheetManager('Classrooms', this.adminSheetsDetails.newSheetId);
    const currentValues = newClassroomSheet.getData();
    let updatedValues = currentValues;
    let arFileIdColumnIndex = newClassroomSheet.getColumnIndicesFromHeader('AR File ID');
    arFileIdColumnIndex = arFileIdColumnIndex.arfileid

    //Update Classroom Sheet Array with new Sheet Values

    Object.keys(this.assessmentRecordSheets).forEach(className => {
      const sheetDetails = this.assessmentRecordSheets[className];

      for (const row of updatedValues) {
        if (row.includes(sheetDetails.originalSheetId)) {
          row[arFileIdColumnIndex] = sheetDetails.newSheetId;
          break;  // Stop iterating once updated
        }
      }
    });

    this.classroomSheet.setData(updatedValues);

  }

  /** 
   * Moves the old versions of the Assessment Records and Admin Sheet to a folder called Archive {date} 
   * in the parent folder.
   */

  archiveOldVersions() {
    // Create Archive Folder
    const parentFolder = DriveManager.getParentFolderId(this.sheet.getId());
    const date = Utils.getDate();
    const archiveFolder = DriveManager.createFolder(parentFolder, `Archive ${date}`);

    // Get an array of the original FileIds
    const assessmentRecordFileIds = Object.values(this.assessmentRecordSheets)
      .map(item => item.originalSheetId);

    // Move all the files to the archive folder
    DriveManager.moveFiles(archiveFolder.newFolderId, assessmentRecordFileIds, ` - ARCHIVED - ${date}`);
  }



}