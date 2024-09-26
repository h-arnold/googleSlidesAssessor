// SlideExtractor.gs

/**
 * SlideExtractor Class
 * 
 * Handles extraction and processing of content from Google Slides presentations.
 */
class SlideExtractor {
    /**
     * Constructs a SlideExtractor instance.
     */
    constructor() {
        // Initialize any required properties here
    }

    /**
     * Extracts Task instances from a Google Slides presentation.
     * Differentiates between reference and empty content based on slide IDs.
     * If contentType is null or undefined, defaults to parsing as reference content.
     * @param {string} slideId - The ID of the Google Slides presentation.
     * @param {string|null} contentType - Type of content to extract: "reference", "empty", or null for default.
     * @return {Task[]} - An array of Task instances extracted from the slides.
     */
    extractTasksFromSlides(slideId, contentType = "reference") { // Default to "reference"
        const presentation = SlidesApp.openById(slideId);
        const slides = presentation.getSlides();
        let tasks = [];

        slides.forEach((slide) => {
            const pageElements = slide.getPageElements();
            const currentSlideId = this.getSlideId(slide); // Retrieve slideId using helper

            pageElements.forEach(pageElement => {
                const description = pageElement.getDescription();

                // Identify task elements by description starting with '#'
                if (description.startsWith('#')) {
                    const key = description.substring(1).trim(); // Remove '#' and trim

                    // Extract content from the page element
                    let content = '';
                    let taskType = '';
                    const type = pageElement.getPageElementType();

                    if (type === SlidesApp.PageElementType.SHAPE) {
                        content = this.extractTextFromShape(pageElement.asShape());
                        taskType = "Text"; // Capitalize to match expected values
                    } else if (type === SlidesApp.PageElementType.TABLE) {
                        content = this.extractTextFromTable(pageElement.asTable());
                        taskType = "Table";
                    } else if (type === SlidesApp.PageElementType.IMAGE) {
                        // If images are part of tasks, handle accordingly
                        // For example:
                        content = this.extractImageDescription(pageElement.asImage());
                        taskType = "Image";
                    } else {
                        console.log(`Unsupported PageElementType: ${type}`);
                        return; // Skip unsupported types
                    }

                    // Parse the content to create a Task instance
                    const task = this.parseTask(key, content, currentSlideId, taskType, contentType);
                    if (task) {
                        tasks.push(task);
                    }
                }
            });
        });

        return tasks;
    }

    /**
     * Parses raw task content to create a Task instance.
     * Differentiates between reference, empty, and default content types.
     * @param {string} key - The task key extracted from the slide.
     * @param {string} content - The raw content of the task.
     * @param {string} slideId - The ID of the slide where the task is located.
     * @param {string} taskType - The type of the task: "Text", "Table", or "Image".
     * @param {string|null} contentType - Type of content: "reference", "empty", or null for default.
     * @return {Task|null} - The Task instance or null if parsing fails.
     */
    parseTask(key, content, slideId, taskType, contentType) {
        if (contentType === "reference") {
            // For reference content, populate taskReference and leave emptyContent blank
            return new Task(
                key,
                taskType,
                slideId,
                null, // imageCategory can be set as needed
                content, // taskReference
                '',      // taskNotes can be set as needed
                ''       // emptyContent will be populated separately
            );
        } else if (contentType === "empty") {
            // For empty content, populate emptyContent and leave taskReference blank
            return new Task(
                key,
                taskType,
                slideId,
                null, // imageCategory can be set as needed
                '',    // taskReference is blank
                '',    // taskNotes can be set as needed
                content // emptyContent
            );
        } else {
            // Default behavior when contentType is null or undefined
            // Parse as reference content
            return new Task(
                key,
                taskType,
                slideId,
                null, // imageCategory can be set as needed
                content, // taskReference
                '',      // taskNotes can be set as needed
                ''       // emptyContent will be populated separately
            );
        }
    }

    /**
     * Helper function to retrieve the slide ID.
     * @param {GoogleAppsScript.Slides.Slide} slide - The slide object.
     * @return {string} - The unique ID of the slide.
     */
    getSlideId(slide) {
        return slide.getObjectId();
    }

    /**
     * Extracts text from a shape element.
     * @param {GoogleAppsScript.Slides.Shape} shape - The shape element to extract text from.
     * @return {string} - The extracted text from the shape.
     */
    extractTextFromShape(shape) {
        if (!shape || !shape.getText) {
            console.log("The provided element is not a shape or does not contain text.");
            return '';
        }

        const text = shape.getText().asString();
        return text;
    }

    /**
     * Converts a Google Slides Table to a Markdown-formatted string.
     * @param {GoogleAppsScript.Slides.Table} table - The table element to convert.
     * @return {string} - The Markdown-formatted table.
     */
    convertTableToMarkdown(table) {
        if (!table || !(table.getNumRows() && table.getNumColumns())) {
            console.log("The provided element is not a table or is empty.");
            return '';
        }

        const numRows = table.getNumRows();
        const numCols = table.getNumColumns();
        let markdownTable = '';

        // Extract all rows' data
        let rows = [];
        for (let i = 0; i < numRows; i++) {
            let row = [];
            for (let j = 0; j < numCols; j++) {
                const cell = table.getCell(i, j);
                const text = cell.getText().asString().trim();
                // Escape pipe characters in Markdown
                const escapedText = text.replace(/\|/g, '\\|');
                row.push(escapedText);
            }
            rows.push(row);
        }

        // Assume first row as header
        const header = rows[0];
        const separator = header.map(() => '---');
        const dataRows = rows.slice(1);

        // Create header row
        markdownTable += '| ' + header.join(' | ') + ' |\n';

        // Create separator row
        markdownTable += '| ' + separator.join(' | ') + ' |\n';

        // Create data rows
        dataRows.forEach(row => {
            markdownTable += '| ' + row.join(' | ') + ' |\n';
        });

        return markdownTable;
    }

    /**
     * Extracts text from a table element and converts it to Markdown.
     * @param {GoogleAppsScript.Slides.Table} table - The table element to extract text from.
     * @return {string} - The extracted Markdown text from the table.
     */
    extractTextFromTable(table) {
        return this.convertTableToMarkdown(table);
    }

    /**
     * Extracts image description or relevant metadata from an image element.
     * @param {GoogleAppsScript.Slides.Image} image - The image element to extract data from.
     * @return {string} - The extracted description or metadata.
     */
    extractImageDescription(image) {
        // Assuming that the image has alt text or description that specifies the category
        // e.g., "Diagram of the system architecture"
        const description = image.getDescription();
        return description || '';
    }
}
