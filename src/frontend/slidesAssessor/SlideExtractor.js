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
     * Differentiates between task titles, images, and notes based on slide element descriptions.
     * @param {string} documentId - The ID of the Google Slides presentation.
     * @param {string|null} contentType - Type of content to extract: "reference", "empty", or null for default.
     * @return {Task[]} - An array of Task instances extracted from the slides.
     */
    extractTasksFromSlides(documentId, contentType = "reference") { // Default to "reference"
        const presentation = SlidesApp.openById(documentId);
        const slides = presentation.getSlides();
        let tasks = [];
        let lastTask = null; // To keep track of the last parsed Task for assigning notes

        slides.forEach((slide) => {
            const pageElements = slide.getPageElements();
            const currentSlideId = this.getSlideId(slide); // Retrieve slideId using helper

            // Identify all image tasks (tags starting with '~')
            const imageTasks = pageElements.filter(pe => {
                const desc = pe.getDescription();
                return desc && desc.startsWith('~');
            });

            // Create a map of image task keys to their images
            const imageTaskMap = {};

            imageTasks.forEach(imageTaskElement => {
                const key = imageTaskElement.getDescription().substring(1).trim(); // Remove '~' and trim
                imageTaskMap[key] = {
                    slideId: currentSlideId,
                    images: [] // Will populate later
                };
            });

            // Iterate through all page elements to build tasks
            pageElements.forEach(pageElement => {
                const description = pageElement.getDescription();

                if (!description || description.length === 0) {
                    return; // Skip elements without descriptions
                }

                const tag = description.charAt(0);
                const key = description.substring(1).trim(); // Remove the tag and trim

                switch (tag) {
                    case '#': // Text-Based Task Title
                        // Ensure the page element is of a supported type (Shape or Table)
                        let content = '';
                        let taskType = '';
                        const type = pageElement.getPageElementType();

                        if (type === SlidesApp.PageElementType.SHAPE) {
                            content = this.extractTextFromShape(pageElement.asShape());
                            taskType = "Text"; // Capitalize to match expected values
                        } else if (type === SlidesApp.PageElementType.TABLE) {
                            content = this.extractTextFromTable(pageElement.asTable());
                            taskType = "Table";
                        } else {
                            console.log(`Unsupported PageElementType for text-based task title: ${type}`);
                            return; // Skip unsupported types
                        }

                        // Parse the task and add to the tasks array
                        const task = this.parseTask(key, content, currentSlideId, taskType, contentType);
                        if (task) {
                            tasks.push(task);
                            lastTask = task; // Update the lastTask reference
                        }
                        break;

                    case '~': // Image-Based Task Title
                        // Image tasks are handled separately after collecting all images within their boundaries
                        break;

                    case '^': // Notes
                        if (lastTask) {
                            const notesContent = this.extractTextFromPageElement(pageElement);
                            lastTask.taskNotes = notesContent;
                        } else {
                            console.warn(`Note found without an associated task. Description: ${description}`);
                        }
                        break;

                    default:
                        // Unsupported tag
                        console.log(`Unsupported tag "${tag}" in description: ${description}`);
                        break;
                }
            });

            // Associate images with their respective image tasks
            imageTasks.forEach(imageTaskElement => {
                const key = imageTaskElement.getDescription().substring(1).trim(); // Remove '~' and trim
                // Find all images within the boundary of the image task element
                const imagesWithin = this.getImagesWithinBoundary(slide, imageTaskElement);
                const imageBlobs = imagesWithin.map(img => img.getBlob().setName(`Image_${img.getObjectId()}.png`));

                // Create and add the image task
                const imageTask = this.parseTask(key, imageBlobs, currentSlideId, "Image", contentType);
                if (imageTask) {
                    tasks.push(imageTask);
                    lastTask = imageTask; // Update the lastTask reference
                }
            });

            // Handle empty content by adding the slide image as a regular image task
            if (contentType === "empty") {
                const imageBlob = this.getSlideImage({
                    documentId: documentId,
                    slideId: currentSlideId
                });

                if (imageBlob) {
                    tasks.forEach(task => {
                        if (task.taskType === "Image") {
                            if (!task.imageBlobs) {
                                task.imageBlobs = [];
                            }
                            // Add the empty slide image blob to the imageBlobs array
                            task.imageBlobs.push(imageBlob);
                        }
                    });
                } else {
                    console.log(`Failed to retrieve empty slide image for slide ID: ${currentSlideId}`);
                }
            }
        });

        return tasks;
    }

    /**
     * Finds all image elements within the boundary of a given container element.
     * @param {GoogleAppsScript.Slides.Slide} slide - The slide containing the elements.
     * @param {GoogleAppsScript.Slides.PageElement} containerElement - The container element defining the boundary.
     * @return {GoogleAppsScript.Slides.Image[]} - An array of image elements within the boundary.
     */
    getImagesWithinBoundary(slide, containerElement) {
        // Retrieve the positional and dimensional properties of the container element
        const containerLeft = containerElement.getLeft();
        const containerTop = containerElement.getTop();
        const containerWidth = containerElement.getWidth();
        const containerHeight = containerElement.getHeight();

        const pageElements = slide.getPageElements();
        let imagesWithin = [];

        pageElements.forEach(pe => {
            if (pe.getPageElementType() === SlidesApp.PageElementType.IMAGE) {
                const image = pe.asImage();

                // Retrieve the positional and dimensional properties of the image
                const imageLeft = image.getLeft();
                const imageTop = image.getTop();
                const imageWidth = image.getWidth();
                const imageHeight = image.getHeight();

                // Check if the image is within or overlaps the container boundary
                if (this.isWithin(
                    containerLeft, containerTop, containerWidth, containerHeight,
                    imageLeft, imageTop, imageWidth, imageHeight
                )) {
                    imagesWithin.push(image);
                }
            }
        });

        return imagesWithin;
    }

    /**
     * Checks if one bounding box is within or overlaps another.
     * @param {number} outerLeft - The left position of the outer bounding box.
     * @param {number} outerTop - The top position of the outer bounding box.
     * @param {number} outerWidth - The width of the outer bounding box.
     * @param {number} outerHeight - The height of the outer bounding box.
     * @param {number} innerLeft - The left position of the inner bounding box.
     * @param {number} innerTop - The top position of the inner bounding box.
     * @param {number} innerWidth - The width of the inner bounding box.
     * @param {number} innerHeight - The height of the inner bounding box.
     * @return {boolean} - True if the inner bounding box is within or overlaps the outer bounding box, false otherwise.
     */
    isWithin(outerLeft, outerTop, outerWidth, outerHeight, innerLeft, innerTop, innerWidth, innerHeight) {
        // Calculate the right and bottom edges of both bounding boxes
        const outerRight = outerLeft + outerWidth;
        const outerBottom = outerTop + outerHeight;
        const innerRight = innerLeft + innerWidth;
        const innerBottom = innerTop + innerHeight;

        // Check for horizontal overlap
        const horizontallyOverlaps = (innerLeft < outerRight) && (innerRight > outerLeft);
        // Check for vertical overlap
        const verticallyOverlaps = (innerTop < outerBottom) && (innerBottom > outerTop);

        return horizontallyOverlaps && verticallyOverlaps;
    }

    /**
     * Fetches an image of a Google Slide and returns it as a Blob.
     * Retains the original logic of fetching the slide image via URL.
     * @param {Object} params - Parameters containing documentId and slideId.
     * @param {string} params.documentId - The ID of the Google Slides presentation.
     * @param {string} params.slideId - The ID of the specific slide within the presentation.
     * @return {Blob|null} - The Blob object of the slide image or null if not successful.
     */
    getSlideImage(params) {
        // Construct the URL using the provided parameters
        const url = `https://docs.google.com/presentation/d/${params.documentId}/export/png?id=${params.documentId}&pageid=${params.slideId}`;

        const options = {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
            },
            muteHttpExceptions: true
        };

        try {
            // Use the UrlFetchApp service to fetch the image from the URL
            const response = UrlFetchApp.fetch(url, options);
            const responseCode = response.getResponseCode();

            if (responseCode !== 200) {
                console.log(`Error: Received response code ${responseCode} for slide ID ${params.slideId}`);
                return null;
            }

            // Get the Blob object from the response
            const blob = response.getBlob().setName(`Slide_${params.slideId}.jpg`);

            console.log("Slide image successfully retrieved!");

            // Return the Blob object
            return blob;
        } catch (e) {
            console.log(`Unable to download slide image for slide ID ${params.slideId}: ${e.message}`);
            return null;
        }
    }

    /**
     * Parses raw task content to create a Task instance.
     * Handles image blobs uniformly regardless of content type.
     * @param {string} key - The task key extracted from the slide.
     * @param {string|Blob[]} content - The raw content of the task (text, table, or array of image Blobs).
     * @param {string} slideId - The ID of the slide where the task is located.
     * @param {string} taskType - The type of the task: "Text", "Table", or "Image".
     * @param {string|null} contentType - Type of content: "reference", "empty", or null for default.
     * @return {Task|null} - The Task instance or null if parsing fails.
     */
    parseTask(key, content, slideId, taskType, contentType) {
        // Initialize imageBlobs as an empty array if the task is of type "Image"
        let imageBlobs = null;
        if (taskType === "Image") {
            imageBlobs = Array.isArray(content) ? content : [content];
        }

        return new Task(
            key,
            taskType,
            slideId,
            null, // imageCategory can be set as needed
            taskType === "Image" ? '' : content, // For Image tasks, taskReference can be left blank or used differently
            null,    // taskNotes will be assigned separately if present
            '',      // emptyContent will be populated separately
            imageBlobs, // Assign imageBlobs only for Image tasks
            null,    // referenceImageUrls can be set as needed
            null     // emptyImageUrls have been removed
        );
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
        return text.trim();
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

        if (rows.length === 0) return '';

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
     * Extracts text from any page element (Shape, Table, Image).
     * @param {GoogleAppsScript.Slides.PageElement} pageElement - The page element to extract text from.
     * @return {string} - The extracted text or image description.
     */
    extractTextFromPageElement(pageElement) {
        const type = pageElement.getPageElementType();

        if (type === SlidesApp.PageElementType.SHAPE) {
            return this.extractTextFromShape(pageElement.asShape());
        } else if (type === SlidesApp.PageElementType.TABLE) {
            return this.extractTextFromTable(pageElement.asTable());
        } else if (type === SlidesApp.PageElementType.IMAGE) {
            return this.extractImageDescription(pageElement.asImage());
        } else {
            console.log(`Unsupported PageElementType for notes: ${type}`);
            return '';
        }
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
        return description ? description.trim() : '';
    }
}

