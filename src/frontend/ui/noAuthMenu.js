// Global instances
const scriptAppManager = new ScriptAppManager();
const ui = SpreadsheetApp.getUi();

/**
 * Global onOpen trigger function
 */
function onOpen() {
    const menu = ui.createMenu('Assessment Bot')
        .addItem('Authorize', 'handleAuth')
        .addToUi();
}

/**
 * Global authorization handler
 */
function handleAuth() {
    const authFlow = scriptAppManager.handleAuthFlow();
    if (authFlow.needsAuth) {
        const htmlContent = `
      <div style="text-align: center; padding: 20px;">
        <h2>Authorization Required</h2>
        <p>Click the button below to authorize:</p>
        <button onclick="window.open('${authFlow.authUrl}', '_blank'); google.script.host.close();" 
                style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
          Authorize Access
        </button>
      </div>`;

        const html = HtmlService.createHtmlOutput(htmlContent)
            .setWidth(450)
            .setHeight(250);
        ui.showModalDialog(html, 'Authorization Required');
    } else {
        const mainController = new mainController()
        mainController.onOpen();
    }
}