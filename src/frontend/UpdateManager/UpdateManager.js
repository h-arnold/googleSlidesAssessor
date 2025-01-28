/**
 * Update Manager Class
 * Orchestrates the copying of spreadsheet data, including Script and Document Properties from 
 * the 'Admin' and Assessment Record sheets to updated templates which have the latest version of 
 * code. This class is necessary because most education establishments don't allow AppScript API
 * access (for obvious reasons) and copy and pasting code manually is slow and unwieldy.
 * 
 */

class UpdateManager{
    constructor() {
        this.sheet = SpreadsheetApp.getActiveSpreadsheet();
        this.ui = new UIManager(this.sheet);
        this.progressTracker = new ProgressTracker();
        this.classroomSheet = new ClassroomSheetManager('Classrooms', this.sheet.getId());
    }

    cloneAllSheets(assessmentRecordSheets, templateSheetId, adminSheetId) {
      const destinationFolderId = `1kNeyJanDBpF6XaRSx2zc-W6vP6UaPECN`
      Object.keys(assessmentRecordSheets).forEach(className => {    
        
        SheetCloner.cloneEverything({
          "templateSheetId" : templateSheetId,
          "newSpreadsheetName" :  className,
          "sourceSpreadsheetId": assessmentRecordSheets[className],
          "copyDocProps": true,
          "copyScriptProps": true,
          "destinationFolderId": destinationFolderId
        })

      })

    }

    /**
     * Gets the class name and file ID of all assessment records listed in the 
     * 'Classrooms Sheet'
     */
    getAssessmentRecordDetails() {
    const headerIndicies = this.classroomSheet.getColumnIndicesFromHeader([`Name`,`AR File ID`]);
    const sheetsData = this.classroomSheet.getData()
    //Remove header rows
    sheetsData.shift()

    let assessmentRecordSheets = {}

    sheetsData.forEach(row => {
      //Adds a element to the assessmentRecordsheet object if there's a file ID in the row.
      if (row[headerIndicies.arfileid]) {
        assessmentRecordSheets[row[headerIndicies.name]] = row[headerIndicies.arfileid];
        }
      });
      
      return assessmentRecordSheets;
    }



}