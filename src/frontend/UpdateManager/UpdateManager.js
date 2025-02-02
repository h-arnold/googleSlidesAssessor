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
    this.uiManager = new UIManager(this.sheet);
    this.classroomSheet = new ClassroomSheetManager('Classrooms', this.sheet.getId());
    this.versionDetails = this.fetchVersionDetails();
    this.versionNo = '0.4.0'; //Hard-coded value that needs to be updated with each release.
    this.assessmentRecordSheets = {};
    this.adminSheetsDetails = {};
    this.destinationFolderId = ""

    // These are the FileIds of the sheets that will be copied into the user's assessment record folder and populated with the values from the old versions.
    this.assessmentRecordTemplateId = this.getAssessmentRecordTemplateId();
    this.adminSheetTemplateId = this.getadminSheetTemplateId();
  }

  getAssessmentRecordTemplateId (versionNo = this.versionNo) {
    return this.versionDetails[versionNo].assessmentRecordTemplateFileId;
  }

  getadminSheetTemplateId (versionNo = this.versionNo) {
    return this.versionDetails[versionNo].adminSheetFileId;
  }

  /**
   * Clones assessment record sheets to a destination folder.
   * @param {Object} assessmentRecordSheets - Object containing assessment record sheets with className as keys.
   * @param {string} [destinationFolderId] - The ID of the destination folder. Defaults to configured assessment record destination folder.
   * @param {string} [templateSheetId] - The ID of the template sheet. Defaults to assessmentRecordTemplateId.
   * @returns {Object} The updated assessmentRecordSheets object with new sheet IDs.
   * @description For each class name in the assessmentRecordSheets object, creates a new sheet
   * based on the template and copies all properties from the source sheet.
   * Updates the original object with new sheet IDs and returns it.
   */
  cloneSheets(
    assessmentRecordSheets,
    destinationFolderId = configurationManager.getAssessmentRecordDestinationFolder(),
    templateSheetId = this.assessmentRecordTemplateId
  ) {
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
   * * Retrieves the template file IDs for the specified version.
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

  /**
   * Updates the admin sheet by creating a new version and archiving the old one.
   * This process includes:
   * 1. Serialising existing configuration (you can't copy script properties directly)
   * 2. Cloning the admin sheet to a new location
   * 3. Archiving the old version
   * 4. Opening the new sheet in a browser window
   * 
   * NOTE: the versionNo, assessmentRecordTemplateId and adminSheetTemplateId must be set before calling this method. 
   * Currently this is handled by the MainController.updateAdminSheet() method which recieves the values from the uiManager.ui.
   * 
   * 
   * @returns {string} The URL of the newly created admin sheet
   * @throws {Error} If any of the sheet operations fail
   */
  updateAdminSheet() {

    // Update configuration values prior to cloning. These get serialised in the next step so that they can be copied from sheet to sheet.
    configurationManager.setUpdateStage(1); // Sets the update stage to 1 (Admin Sheet Updated).

    // Serialises existing config
    const propsCloner = new PropertiesCloner();
    propsCloner.serialiseProperties();

    const adminSheetDetails = this.getAdminSheetDetails();
    const adminSheetName = Object.keys(this.adminSheetsDetails)

    const currentAdminSheetFileId = this.adminSheetsDetails[adminSheetName].originalSheetId;

    // Assumes that we want the admin sheet to be in the same folder as the last one.
    const parentFolderId = DriveManager.getParentFolderId(currentAdminSheetFileId);
    this.destinationFolderId = parentFolderId;

    // Clones the admin sheet
    this.cloneSheets(adminSheetDetails, this.destinationFolderId, this.adminSheetTemplateId);

    // The newSheetId property should be populated now.
    const newSheetId = this.adminSheetsDetails[adminSheetName].newSheetId;

    // Archives old admin sheet
    this.archiveOldVersions([currentAdminSheetFileId]); //archiveOldVersions expects array so we'll pass the single value as a single object array.

    //Gets the Url of the new sheet and opens it in a new window.
    const newSheetUrl = SpreadsheetApp.openById(newSheetId).getUrl();

    this.uiManager.ui.
    openUrlInNewWindow(newSheetUrl);

    // Returns the URL so that it can be fed to the GuiManager.ui.

    return newSheetUrl;
  }

  /**
   * Updates all assessment records by cloning them into the latest template and archiving old versions.
   * This method performs the following steps:
   * 1. Retrieves the assessment record template ID
   * 2. Fetches assessment record details
   * 3. Clones assessment record sheets into the latest template
   * 4. Archives old assessment record sheets
   * 5. Updates the classroom sheet with new assessment record file IDs
   * 
   * The progress of the update is tracked using the ProgressTracker singleton.
   * The update stage is set to 2 in the ConfigurationManager to indicate assessment records are updated.
   * 
   * @throws {Error} If assessment record template ID is not set or if any step in the process fails
   */
  updateAssessmentRecords (){
    const progressTracker = progressTracker.getInstance()
    let step = 0;
    progressTracker.startTracking('Updating all Assessment Records. This may take a while...')
    //Gets the assessment record template file Id - this should have been set when the admin sheet was updated.
    this.assessmentRecordTemplateId = configurationManager.getAssessmentRecordTemplateId()

    progressTracker.updateProgress(++step, 'Fetching Assessment Record Details')
    // Get the assessment record details
    this.getAssessmentRecordDetails();

    // Clones the assessment record sheets
    progressTracker.updateProgress(++step, 'Cloning Assessment Record sheets into latest template');
    this.cloneSheets(this.assessmentRecordSheets);

    // Archives old assessment record sheets
    progressTracker.updateProgress(++step, 'Archiving old Assessment Record sheets');
    const assessmentRecordFileIds = Object.values(this.assessmentRecordSheets)
      .map(item => item.originalSheetId);
    this.archiveOldVersions(assessmentRecordFileIds);

    // Updates the Classroom Sheet with the new Assessment Record File IDs
    progressTracker.updateProgress(++step, 'Updating Classroom Sheet with new Assessment Record File IDs');
    this.updateClassroomSheetWithNewAssessmentRecords();

    // Marks the task as complete
    progressTracker.complete();
    configurationManager.setUpdateStage(2); // Sets the update stage back to 2 (Up to date).
  }

  /**
   * This method makes it easier for the user to update the assessment records by:
   * 1. Giving them the scriptId of the current admin script (this one)
   * 2. Telling them to update the library of the assessment record template.
   * 3. Opening the Url of the assessment record template in a new window so that they can update the library.   * 
   */
  runAssessmentRecordUpdateWizard() {
    const ui = this.uiManager.ui
    this.destinationFolderId = configurationManager.getAssessmentRecordDestinationFolder();

    //Make a 'local' copy of the Assessment Record Template so that you can upate the library file.
    this.assessmentRecordTemplateId = this.copyAssessmentRecordTemplate();

    const assessmentRecordTemplateUrl = this.getAssessmentRecordTemplateUrl(this.assessmentRecordTemplateId)

    const sa = new ScriptAppManager();
    const adminScriptId = sa.getScriptId();

    const message = `Next, you need to update the assessment record template with a link to this library code. Instructions coming next.`

    ui.alert(`Let's finish the update`, message, ui.ButtonSet.OK);

    const instructions = `To update the Assessment Records, please follow these steps:
    1. Open the Assessment Record Template: ${assessmentRecordTemplateUrl}
    2. Click on 'Extensions' > 'App Script'
    3. Copy this Script ID: ${adminScriptId}
    4. Click on the plus (➕) button next to 'Libraries' in the left hand panel.
    5. Paste the Script ID and click 'Look up'.
    6. Select the latest version and click 'Add'.
    7. Click '💾' Save.`

    ui.alert('Update Instructions', instructions, ui.ButtonSet.OK);

    this.uiManager.openUrlInNewWindow(assessmentRecordTemplateUrl);

    // Remaining steps
  }

  /** Gets the URL of the assessment record template
   * @param {string} assessmentRecordTemplateId - The ID of the assessment record template.
   * @returns {string} The URL of the assessment record template.
   */
  getAssessmentRecordTemplateUrl(assessmentRecordTemplateId) {
    const assessmentRecordTemplate = SpreadsheetApp.openById(assessmentRecordTemplateId);
    return assessmentRecordTemplate.getUrl();
  }

  /**
   * Creates a copy of the assessment record template in the destination folder.
   * @returns {string} The ID of the newly created assessment record template copy.
   * @throws {Error} If copying the template fails.
   */
  copyAssessmentRecordTemplate() {
      const copiedAssessmentRecordTemplateId = DriveManager.copyTemplateSheet(
      this.assessmentRecordTemplateId,
      this.destinationFolderId, 
      `Assessment Record Template v${this.versionNo}`
      )
      return this.assessmentRecordTemplateId = copiedAssessmentRecordTemplateId.fileId;
  }


  }
