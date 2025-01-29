// UpdateManager.gs

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
    this.versionNo = "";
    this.assessmentRecordSheets = {};
    this.adminSheetsDetails = {};

    // These are the FileIds of the sheets that will be copied into the user's assessment record folder and populated with the values from the old versions.
    this.assessmentRecordTemplateId = ""
    this.adminSheetTemplateId = ""
  }

  cloneSheets(assessmentRecordSheets) {
    const destinationFolderId = configurationManager.getAssessmentRecordDestinationFolder()
    Object.keys(assessmentRecordSheets).forEach(className => {

      const newSheet = SheetCloner.cloneEverything({
        "templateSheetId": this.assessmentRecordTemplateId,
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
      "newSheetId": this.adminSheetTemplateId
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

  /**
   * Retrieves the template file IDs for the specified version.
   * Validates the retrieved file Ids using DriveManager.isValidGoogleDriveFileId()
   * @param {string} versionNumber - The version number to look up.
   * @returns {void} - Sets the file IDs as class properties directly.
   */
  getTemplateFileIds(versionNumber) {
    // 1. Access Configuration: Get the Update_Details_Url
    const updateDetailsUrl = configurationManager.getUpdateDetailsUrl();

    if (!updateDetailsUrl) {
      console.error("Update_Details_Url not found in configuration.");
      return;
    }

    // 2. Fetch JSON: Download assessmentBotVersions.json using BaseRequestManager
    const request = {
      url: updateDetailsUrl,
      method: "GET",
      muteHttpExceptions: true // Prevents errors from being thrown for non-200 responses.
    };

    const requestManager = new BaseRequestManager();
    const response = requestManager.sendRequestWithRetries(request);

    if (!response) {
      console.error("Failed to fetch assessmentBotVersions.json.");
      return;
    }

    //Get the response code
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      console.error(`Failed to fetch assessmentBotVersions.json. Status Code: ${responseCode} Returned Message: ${response.getContentText()}.`);
      return;
    }

    try {
      const data = JSON.parse(response.getContentText());

      // 3. Extract IDs: Get file IDs for the given version
      const versionData = data[versionNumber];
      if (!versionData) {
        console.error(`Version ${versionNumber} not found in assessmentBotVersions.json`);
        return;
      }

      //Extract the fileIds from the versionData
      const assessmentRecordTemplateId = versionData.assessmentRecordTemplateFileId;
      const adminSheetTemplateId = versionData.adminSheetFileId;

      // Validate file Ids using DriveManager.isValidGoogleDriveFileId()
      if (!DriveManager.isValidGoogleDriveFileId(assessmentRecordTemplateId)) {
        throw new Error(`Invalid assessmentRecordTemplate ID: ${assessmentRecordTemplateId}`);
      }

      if (!DriveManager.isValidGoogleDriveFileId(adminSheetTemplateId)) {
        throw new Error(`Invalid adminSheetTemplate ID: ${adminSheetTemplateId}`);
      }

      // 4. Set Class Properties: Store IDs in class properties
      this.assessmentRecordTemplateId = assessmentRecordTemplateId;
      this.adminSheetTemplateId = adminSheetTemplateId;
      this.versionNo = versionNumber

      //Success!
      console.log(`Successfully set the file ids for version ${versionNumber}.`);

    } catch (error) {
      console.error(`Error getting or validating data from assessmentBotVersions.json: ${error}`);
      return;
    }
  }

}