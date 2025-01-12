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
* @returns {{
*   status: 'copied' | 'skipped',
*   file: GoogleAppsScript.Drive.File | null,
*   fileId: string | null,
*   message: string
* }} An object describing the outcome.
* 
* Possible statuses:
*   - 'copied': The file was copied successfully.
*   - 'skipped': A file with the same name already exists; nothing was copied.
*/
  static copyTemplateSheet(templateSheetId, destinationFolderId, newSheetName) {
    try {
      const templateSheetFile = DriveApp.getFileById(templateSheetId);
      const destinationFolder = DriveApp.getFolderById(destinationFolderId);

      // Check if a file with the same name exists in the destination folder
      const filesInFolder = destinationFolder.getFilesByName(newSheetName);
      if (filesInFolder.hasNext()) {
        const existingFile = filesInFolder.next();
        const message = `File with the name "${newSheetName}" already exists. Skipping copy.`;
        console.log(message);
        return {
          status: 'skipped',
          file: existingFile,
          fileId: existingFile.getId(),
          message
        };
      }

      // Proceed to copy the template sheet
      const copiedSheetFile = templateSheetFile.makeCopy(newSheetName, destinationFolder);
      const successMsg = `Template sheet copied successfully. Copied sheet ID: ${copiedSheetFile.getId()}`;
      console.log(successMsg);

      return {
        status: 'copied',
        file: copiedSheetFile,
        fileId: copiedSheetFile.getId(),
        message: successMsg
      };
    } catch (error) {
      console.error(`Failed to copy template sheet: ${error.message}`);
      throw error; // or return { status: 'error', file: null, fileId: null, message: error.message };
    }
  }


  /**
   * Shares a folder with a list of email addresses, capturing the result for each email.
   * @param {string} destinationFolderId - The ID of the folder to share.
   * @param {Set<string>} emails - A set of email addresses to share the folder with.
   * @returns {{
   *   status: 'complete' | 'partial' | 'none',
   *   message: string,
   *   details: Array<{
   *     email: string,
   *     status: 'shared' | 'failed',
   *     message: string
   *   }>
   * }} An object describing the overall result.
   * 
   * Possible statuses:
   *   - 'complete': All emails were shared successfully.
   *   - 'partial': Some emails succeeded, some failed.
   *   - 'none': No emails were processed (e.g., if the set is empty).
   */
  static shareFolder(destinationFolderId, emails) {
    // Prepare a results array to store each email's outcome
    const details = [];
    let successCount = 0;
    let failCount = 0;

    if (!emails || emails.size === 0) {
      const noEmailsMsg = 'No emails provided; nothing to share.';
      console.log(noEmailsMsg);
      return {
        status: 'none',
        message: noEmailsMsg,
        details
      };
    }

    try {
      const destinationFolder = DriveApp.getFolderById(destinationFolderId);

      emails.forEach(email => {
        try {
          destinationFolder.addEditor(email);
          console.log(`Shared destination folder with: ${email}`);

          details.push({
            email,
            status: 'shared',
            message: `Successfully shared with ${email}`
          });
          successCount++;
        } catch (error) {
          const failMsg = `Failed to share folder with ${email}: ${error.message}`;
          console.error(failMsg);

          details.push({
            email,
            status: 'failed',
            message: failMsg
          });
          failCount++;
        }
      });
    } catch (error) {
      // If we fail to access the folder itself or anything else
      // you could either throw or just return an "all-failed" status
      console.error(`Failed to access destination folder: ${error.message}`);
      throw error;
    }

    // Determine final overall status
    let overallStatus = 'complete';
    if (successCount === 0 && failCount > 0) {
      // Everything failed
      overallStatus = 'partial'; // or 'none', if you'd rather treat it that way
    } else if (successCount > 0 && failCount > 0) {
      // Some succeeded, some failed
      overallStatus = 'partial';
    }

    const overallMsg = `Shared folder with ${successCount} email(s) successfully, ${failCount} failed.`;
    console.log(overallMsg);

    return {
      status: overallStatus, // 'complete', 'partial', or 'none'
      message: overallMsg,
      details
    };
  }
}
