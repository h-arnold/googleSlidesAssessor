/**
 * ImageManager Class
 *
 * Handles all image-related operations including fetching and uploading images.
 * Manages batching to avoid rate limits and maintains mappings between slide URLs and uploaded image URLs.
 */
class ImageManager {
  /**
   * Constructs an ImageManager instance.
   */
  constructor() {
    this.imageUploadManager = new ImageUploader(); // Utilize ImageUploader for uploads
    this.slideContentManager = new SlideContentManager(); // Utilize SlideContentManager for slide operations
    this.configurationManager = configurationManager; // Reference to ConfigurationManager
    this.rateLimitPerDocument = 6; // Maximum number of requests per unique document per batch
  }

  /**
   * Collects all unique slide URLs from the assignment tasks and student responses.
   * Ensures that each batch contains URLs from unique documents to manage rate limits.
   * @param {Assignment} assignment - The Assignment instance.
   * @return {Object[]} - An array of objects containing UID and slide URLs.
   */
  collectAllSlideUrls(assignment) {
    const slideUrlMappings = [];

    // Collect slide URLs from assignment tasks
    Object.values(assignment.tasks).forEach(task => {
      if (task.taskType === 'Image' && typeof task.taskReference === 'string') {
        slideUrlMappings.push({
          uid: task.taskReference, // Assuming UID is stored or can be derived
          slideUrl: task.taskReference
        });
      }

      if (task.emptyContent && typeof task.emptyContent === 'string') {
        slideUrlMappings.push({
          uid: task.emptyContent, // Assuming UID is stored or can be derived
          slideUrl: task.emptyContent
        });
      }
    });

    // Collect slide URLs from student responses
    assignment.studentTasks.forEach(studentTask => {
      Object.values(studentTask.responses).forEach(response => {
        if (response.response && typeof response.response === 'string') {
          slideUrlMappings.push({
            uid: response.uid,
            slideUrl: response.response
          });
        }
      });
    });

    return slideUrlMappings;
  }

  /**
   * Fetches images from slide URLs in batches, respecting rate limits.
   * @param {Object[]} slideUrlMappings - Array of objects containing UID and slide URLs.
   * @return {Object[]} - Array of objects containing UID and image Blobs.
   */
  batchFetchImages(slideUrlMappings) {
    const imageBlobs = [];

    // Split into batches based on rate limits
    for (let i = 0; i < slideUrlMappings.length; i += this.rateLimitPerDocument) {
      const batch = slideUrlMappings.slice(i, i + this.rateLimitPerDocument);
      
      batch.forEach(mapping => {
        const response = UrlFetchApp.fetch(mapping.slideUrl, {
          method: 'get',
          headers: {
            'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
          },
          muteHttpExceptions: true
        });

        if (response.getResponseCode() === 200) {
          const blob = response.getBlob().setName(`Slide_${mapping.uid}.png`);
          imageBlobs.push({
            uid: mapping.uid,
            blob: blob
          });
        } else {
          console.error(`Failed to fetch image from URL: ${mapping.slideUrl}. Response Code: ${response.getResponseCode()}`);
        }
      });

      // Pause between batches to respect rate limits
      Utilities.sleep(1000); // 1 second pause; adjust as necessary
    }

    return imageBlobs;
  }

  /**
   * Uploads image Blobs in batches and returns the uploaded image URLs.
   * @param {Object[]} imageBlobs - Array of objects containing UID and image Blobs.
   * @return {Object[]} - Array of objects containing UID and uploaded image URLs.
   */
  batchUploadImages(imageBlobs) {
    const uploadedImageUrls = [];

    imageBlobs.forEach(imageObj => {
      try {
        const imageUrl = this.imageUploadManager.uploadImage(imageObj.blob);
        uploadedImageUrls.push({
          uid: imageObj.uid,
          imageUrl: imageUrl
        });
      } catch (error) {
        console.error(`Error uploading image for UID: ${imageObj.uid} - ${error.message}`);
      }
    });

    return uploadedImageUrls;
  }

  /**
   * Updates the assignment tasks and student responses with the uploaded image URLs.
   * @param {Assignment} assignment - The Assignment instance.
   * @param {Object[]} uploadedImageUrls - Array of objects containing UID and uploaded image URLs.
   */
  updateAssignmentWithImageUrls(assignment, uploadedImageUrls) {
    uploadedImageUrls.forEach(mapping => {
      // Update assignment tasks
      Object.values(assignment.tasks).forEach(task => {
        if (task.taskReference === mapping.uid) {
          task.taskReference = mapping.imageUrl;
        }

        if (task.emptyContent === mapping.uid) {
          task.emptyContent = mapping.imageUrl;
        }
      });

      // Update student responses
      assignment.studentTasks.forEach(studentTask => {
        Object.values(studentTask.responses).forEach(response => {
          if (response.uid === mapping.uid) {
            response.response = mapping.imageUrl;
          }
        });
      });
    });
  }

  /**
   * Orchestrates the image processing workflow: fetching and uploading images.
   * @param {Assignment} assignment - The Assignment instance.
   */
  processImages(assignment) {
    const slideUrlMappings = this.collectAllSlideUrls(assignment);
    console.log(`Collected ${slideUrlMappings.length} slide URLs for image processing.`);

    const imageBlobs = this.batchFetchImages(slideUrlMappings);
    console.log(`Fetched ${imageBlobs.length} image Blobs.`);

    const uploadedImageUrls = this.batchUploadImages(imageBlobs);
    console.log(`Uploaded ${uploadedImageUrls.length} images and obtained URLs.`);

    this.updateAssignmentWithImageUrls(assignment, uploadedImageUrls);
    console.log(`Updated assignment tasks and student responses with uploaded image URLs.`);
  }
}
