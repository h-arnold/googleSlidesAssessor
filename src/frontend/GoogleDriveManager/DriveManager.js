// DriveManager.js

/**
 * Handles Drive-related operations.
 */
class DriveManager {
    /**
     * Copies a template sheet to the destination folder with a new name.
     * If a file with the same name already exists, the method skips copying.
     * @param {string} templateSheetId - The ID of the template sheet.
     * @param {string} destinationFolderId - The ID of the destination folder.
     * @param {string} newSheetName - The new name for the copied sheet.
     * @returns {GoogleAppsScript.Drive.File|null} The copied file or null if skipped.
     */
    static copyTemplateSheet(templateSheetId, destinationFolderId, newSheetName) {
        try {
            const templateSheetFile = DriveApp.getFileById(templateSheetId);
            const destinationFolder = DriveApp.getFolderById(destinationFolderId);

            // Check if a file with the same name exists in the destination folder
            const filesInFolder = destinationFolder.getFilesByName(newSheetName);
            if (filesInFolder.hasNext()) {
                console.log(`File with the name "${newSheetName}" already exists. Skipping copy.`);
                return null; // Skip copying
            }

            // Proceed to copy the template sheet
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
