/**
 * Displays the Configuration Dialog HTML modal.
 */
function showConfigurationDialog() {
    const html = HtmlService.createHtmlOutputFromFile('ConfigurationDialog')
        .setWidth(800)
        .setHeight(800) // Adjust the height as needed
        .setTitle('Configure Script Properties');

    // Show the modal dialog in the active Spreadsheet UI
    SpreadsheetApp.getUi().showModalDialog(html, 'Configure Script Properties');
}

/**
 * Adds a custom menu to the Google Sheets UI upon opening the spreadsheet.
 */
function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Configuration')
        .addItem('Configure Script Properties', 'showConfigurationDialog')
        .addToUi();
}
