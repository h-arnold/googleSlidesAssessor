# Update workflow plan 

## 0. Get user to choose a version to update to

 - Calls method which gets all assessment bot versions.
 - GUI provides dropdown for user to choose update version
 - Sets versionNo attribute for the update Manager

## 1. Update Admin Sheet

 - Serialise script properties
 - Make a copy of template update
 - Copy all sheets to update
 - Move and rename old sheet to archive folder
 - Get Url of new admin sheet, open it and prompt user to close old admin sheet.

 ## 2. Setup process from admin sheet

  - Check whether admin sheet is new or updated (does AR File Id Column exist in Classrooms sheet?)
  - If new, prompt user to set configuration values and do initialisation
  - If updated, make a copy of template AR
  - Get script ID of new admin sheet and prompt user to change library ID to that
  - Upon confirmation, begin copy process
  - Move and rename ARs into archive folder.

## 3. Additional logic needed for assessment records

 - Deserialise any document properties on opening the sheet (or running any Assessment Bot function)
 - Serialise any document properties (and only document properties) when the ProgressTracker.complete() method is called to store any updates.