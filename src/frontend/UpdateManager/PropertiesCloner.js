// PropertiesCloner.js

/**************************************************
 * PropertiesCloner Class
 * Gets all script and document properties, serialises them
 * and stores them in a hidden Google Sheet so that they can be deserialised again.
 * Currently this is used to manage updates of sheets.
 **************************************************/
class PropertiesCloner extends BaseSheetManager {
    /**
     * A subclass of BaseSheetManager for cloning Document and Script properties.
     * @param {string} [sheetName='propertiesStore'] - The name of the sheet to store properties.
     */
    constructor(sheetName = 'propertiesStore') {
      super(); // calls BaseSheetManager constructor
      this.createOrGetSheet(sheetName);
    }
  
    /**
     * Serialises all Document and Script properties to the 'propertiesStore' sheet.
     */
    serialiseProperties() {
      const docProperties = PropertiesService.getDocumentProperties();
      const scriptProperties = PropertiesService.getScriptProperties();
  
      // Prepare data array with a header row: [Type, Key, Value]
      const data = [['Type', 'Key', 'Value']];
  
      // Document Properties
      const docKeys = docProperties.getKeys();
      docKeys.forEach(key => {
        data.push(['DOCUMENT', key, docProperties.getProperty(key)]);
      });
  
      // Script Properties
      const scriptKeys = scriptProperties.getKeys();
      scriptKeys.forEach(key => {
        data.push(['SCRIPT', key, scriptProperties.getProperty(key)]);
      });
  
      // Write data to sheet and then hide it
      this.setAllValues(data);
      this.sheet.hideSheet();
    }
  
    /**
     * Deserialises properties stored in 'propertiesStore' back into Document and Script properties.
     * @param {boolean} [deleteSheetAfter=false] - Whether to delete the sheet after deserialising.
     */
    deserialiseProperties(deleteSheetAfter = false) {
      const docProperties = PropertiesService.getDocumentProperties();
      const scriptProperties = PropertiesService.getScriptProperties();
  
      // Get all values from the sheet, excluding the header row
      const allValues = this.getAllValues();
      // Remove the header row
      const rows = allValues.slice(1);
  
      rows.forEach(row => {
        const [type, key, value] = row;
  
        if (type === 'DOCUMENT') {
          docProperties.setProperty(key, value);
        } else if (type === 'SCRIPT') {
          scriptProperties.setProperty(key, value);
        }
      });
  
      if (deleteSheetAfter) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        ss.deleteSheet(this.sheet);
      }
    }
  }