function onOpen() {
    let ui = SpreadsheetApp.getUi();
    ui.createMenu('Classroom Creator')
        .addItem('Get Google Classrooms', 'fetchGoogleClassrooms')
        .addItem('Create Google Classrooms', 'createGoogleClassrooms')
        .addItem('Update Google Classrooms', 'updateGoogleClassrooms')
        .addItem('Set Up Assessment Docs', 'copyTemplateForActiveCourses')
        .addToUi();

    ui.createMenu('Preferences')
        .addItem('Set Google Slides Assessor Preferences', 'setPrefs')
        .addToUi();
}

// Placeholder functions to call the configuration modal to set up the Google Slides Assessor
// IMPORTANT: Make sure you add the Google Slides Assessor Library script as a library here and call it 'AIAsses'

function setPrefs() {
    AIAssess.showConfigurationDialog();
}

function getConfiguration() {
    return AIAssess.getConfiguration();
}


function saveConfigruation(formData) {
    return AIAssess.saveConfiguration(formData);
}