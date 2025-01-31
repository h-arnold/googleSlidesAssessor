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
    this.versionDetails = this.fetchVersionDetails();
    this.versionNo = "";
    this.assessmentRecordSheets = {};
    this.adminSheetsDetails = {};
    this.destinationFolderId = ""

    // These are the FileIds of the sheets that will be copied into the user's assessment record folder and populated with the values from the old versions.
    this.assessmentRecordTemplateId = ""
    this.adminSheetTemplateId = ""
  }

  cloneSheets(
    assessmentRecordSheets, 
    destinationFolderId = configurationManager.getAssessmentRecordDestinationFolder()
    ) {
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
   * @param {}
   */

  archiveOldVersions(assessmentRecordFileIds) {
    // Create Archive Folder
    const parentFolder = DriveManager.getParentFolderId(this.sheet.getId());
    const date = Utils.getDate();
    const archiveFolder = DriveManager.createFolder(parentFolder, `Archive ${date}`);

    // If no array is passed, it will default to the assessmentRecordSheets details.
    if (!assessmentRecordFileIds) {
          // Get an array of the original FileIds
      assessmentRecordFileIds = Object.values(this.assessmentRecordSheets)
      .map(item => item.originalSheetId);
    }



    // Move all the files to the archive folder
    DriveManager.moveFiles(archiveFolder.newFolderId, assessmentRecordFileIds, ` - ARCHIVED - ${date}`);
  }

  /**
 * Fetches the entire assessmentBotVersions.json and returns its contents.
 * @returns {Object|null} - Parsed JSON object containing version details, or null if fetching fails.
 */
  fetchVersionDetails() {
    // 1. Access Configuration: Get the Update_Details_Url
    const updateDetailsUrl = configurationManager.getUpdateDetailsUrl();

    if (!updateDetailsUrl) {
      console.error("Update_Details_Url not found in configuration.");
      return null;
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
      return null;
    }

    // Get the response code
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      console.error(`Failed to fetch assessmentBotVersions.json. Status Code: ${responseCode} Returned Message: ${response.getContentText()}.`);
      return null;
    }

    try {
      return JSON.parse(response.getContentText());
    } catch (error) {
      console.error(`Error parsing assessmentBotVersions.json: ${error}`);
      return null;
    }
  }

  /**
   * Retrieves the template file IDs for the specified version.
   * Validates the retrieved file Ids using DriveManager.isValidGoogleDriveFileId()
   * @param {string} versionNumber - The version number to look up.
   * @returns {void} - Sets the file IDs as class properties directly.
   */
  getTemplateFileIds() {
    const versionNumber = this.versionNo;
    const versionData = this.fetchVersionDetails();

    if (!versionData) {
      console.error("Failed to retrieve version details.");
      return;
    }

    // Validate and extract the specific version details
    const versionInfo = versionData[versionNumber];
    if (!versionInfo) {
      console.error(`Version ${versionNumber} not found in assessmentBotVersions.json`);
      return;
    }

    // Extract file IDs
    const assessmentRecordTemplateId = versionInfo.assessmentRecordTemplateFileId;
    const adminSheetTemplateId = versionInfo.adminSheetFileId;

    // Validate file Ids using DriveManager.isValidGoogleDriveFileId()
    if (!DriveManager.isValidGoogleDriveFileId(assessmentRecordTemplateId)) {
      console.error(`Invalid assessmentRecordTemplate ID: ${assessmentRecordTemplateId}`);
      return;
    }

    if (!DriveManager.isValidGoogleDriveFileId(adminSheetTemplateId)) {
      console.error(`Invalid adminSheetTemplate ID: ${adminSheetTemplateId}`);
      return;
    }

    // Store IDs in class properties
    this.assessmentRecordTemplateId = assessmentRecordTemplateId;
    this.adminSheetTemplateId = adminSheetTemplateId;
    this.versionNo = versionNumber;

    // Success
    console.log(`Successfully set the file IDs for version ${versionNumber}.`);
  }


  updateAdminSheet() {

    this.versionNo = `0.4.0`;     // Replace this with a passed value once the gui is sorted
    this.getTemplateFileIds();

    // Serialises existing config
    const propsCloner = new PropertiesCloner();
    propsCloner.serialiseProperties();

    const adminSheetDetails = this.getAdminSheetDetails();

    const date = new Date();
    const formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");

    const adminSheetName = Object.keys(this.adminSheetsDetails)

    const currentAdminSheetFileId = this.adminSheetsDetails[adminSheetName].originalSheetId;

    // Assumes that we want the admin sheet to be in the same folder as the last one.
    const parentFolderId = DriveManager.getParentFolderId(currentAdminSheetFileId);
    this.destinationFolderId = parentFolderId;

    // Clones the admin sheet
    this.cloneSheets(adminSheetDetails, this.destinationFolderId);

    // The newSheetId property should be populated now.
    const newSheetId = this.adminSheetsDetails[adminSheetName].newSheetId;

    // Archives old admin sheet
    this.archiveOldVersions([currentAdminSheetFileId]); //archiveOldVersions expects array so we'll pass the single value as a single object array.

    // Passes the Url of the new sheet back to the GUI so that 
    const newSheetUrl = SpreadsheetApp.openById(newSheetId).getUrl();
    return newSheetUrl;
  }

}

function testUpdateAdminSheet() {
  const um = new UpdateManager()
  um.updateAdminSheet();
}