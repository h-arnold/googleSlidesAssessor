// SlideExtractor.js

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
     * Tasks are identified by page elements with descriptions starting with '#'.
     * @param {string} slideId - The ID of the Google Slides presentation.
     * @return {Task[]} - An array of Task instances extracted from the slides.
     */
    extractTasksFromSlides(slideId) {
        const presentation = SlidesApp.openById(slideId);
        const slides = presentation.getSlides();
        let index = 0

        const tasks = [];

        slides.forEach((slide) => {
            const pageElements = slide.getPageElements();
            const currentSlideId = this.getSlideId(slide); // Retrieve slideId using helper

            pageElements.forEach(pageElement => {
                const description = pageElement.getDescription();

                // Identify task elements by description starting with '#'
                if (description.startsWith('#')) {
                    index++
                    const key = description.substring(1).trim(); // Remove '#' and trim

                    // Extract content from the page element
                    let content = '';
                    let taskType = '';
                    const type = pageElement.getPageElementType();

                    if (type === SlidesApp.PageElementType.SHAPE) {
                        content = this.extractTextFromShape(pageElement.asShape());
                        taskType = "text";
                    } else if (type === SlidesApp.PageElementType.TABLE) {
                        content = this.extractTextFromTable(pageElement.asTable());
                        taskType = "table";
                    } else {
                        console.log(`Unsupported PageElementType: ${type}`);
                        return; // Skip unsupported types
                    }

                    // Parse the content to create a Task instance
                    const task = this.parseTask(key, content, currentSlideId, taskType, index);
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
     * The content should follow a specific format to extract necessary fields.
     * @param {string} key - The task key extracted from the slide.
     * @param {string} content - The raw content of the task.
     * @param {string} slideId - The ID of the slide where the task is located.
     * @param {string|null} studentId - The ID of the student who completed the task. Pass null if it's the reference slide 
     * @return {Task|null} - The created Task instance or null if parsing fails.
     */
    parseTask(key, content, slideId, taskType, index) {
        // Define a delimiter or format to parse task details from content
        // For example, assume content is in the following format:
        // Title: Task Title
        // Type: Text/Table/Image
        // Reference: Reference content or URL
        // Notes: Additional notes

        const taskData = {

            "title": key,
            "type": taskType,
            "reference": content,
            "slideId": slideId
        };

        // Validate required fields
        if (!taskData.title || !taskData.type || !taskData.reference || !taskData.slideId) {
            console.log(`Incomplete task data for key ${key}. Required fields: Title, Type, Reference.`);
            return null;
        }

        // Determine imageCategory if taskType is Image
        let imageCategory = null;
        if (taskData.type.toLowerCase() === 'image') {
            // Assume the image category is specified in the notes or another field
            imageCategory = taskData.category || null; // Adjust based on your actual data structure
        }

        //Create a taskId - which an incrementing integer
        const taskId = index

        // Create and return the Task instance
        const task = new Task(
            taskId,
            taskData.title,
            taskData.type,
            taskData.slideId, // Pass the slideId to the Task instance
            imageCategory,
            taskData.reference,
            taskData.notes || ''
        );

        return task;
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
}
