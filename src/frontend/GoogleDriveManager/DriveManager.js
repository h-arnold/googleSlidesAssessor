// DriveManager.js

/**
 * Handles Drive-related operations.
 */
class DriveManager {
    /**
     * Copies a template sheet to the destination folder with a new name.
     * @param {string} templateSheetId - The ID of the template sheet.
     * @param {string} destinationFolderId - The ID of the destination folder.
     * @param {string} newSheetName - The new name for the copied sheet.
     * @returns {GoogleAppsScript.Drive.File} The copied file.
     */
    static copyTemplateSheet(templateSheetId, destinationFolderId, newSheetName) {
        try {
            const templateSheetFile = DriveApp.getFileById(templateSheetId);
            const destinationFolder = DriveApp.getFolderById(destinationFolderId);
            const copiedSheetFile = templateSheetFile.makeCopy(newSheetName, destinationFolder);
            console.log('Template sheet copied and renamed successfully.');
            console.log('Copied sheet ID: ' + copiedSheetFile.getId());
            return copiedSheetFile;
        } catch (error) {
            console.error(`Failed to copy template sheet: ${error.message}`);
            throw error;
        }
    }

    /**
     * Shares a folder with a list of email addresses.
     * @param {string} destinationFolderId - The ID of the folder to share.
     * @param {Set<string>} emails - A set of email addresses to share the folder with.
     */
    static shareFolder(destinationFolderId, emails) {
        try {
            const destinationFolder = DriveApp.getFolderById(destinationFolderId);
            emails.forEach(email => {
                try {
                    destinationFolder.addEditor(email);
                    console.log(`Shared destination folder with: ${email}`);
                } catch (error) {
                    console.error(`Failed to share folder with ${email}: ${error.message}`);
                }
            });
        } catch (error) {
            console.error(`Failed to access destination folder: ${error.message}`);
            throw error;
        }
    }
}
