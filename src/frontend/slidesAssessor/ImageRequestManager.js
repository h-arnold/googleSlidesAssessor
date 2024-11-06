/**
 * ImageRequestManager Class
 *
 * Handles uploading images to the image upload service.
 */
class ImageRequestManager extends BaseRequestManager {
  constructor() {
    super();
    this.configurationManager = new ConfigurationManager();
    this.uploadUrl = this.configurationManager.getImageUploadUrl();
    this.apiKey = this.configurationManager.getImageUploaderApiKey();
  }

  /**
   * Uploads an image Blob as multipart/form-data and returns the URL.
   * @param {Blob} imageBlob - The image Blob to upload.
   * @return {string} - The URL of the uploaded image.
   */
  uploadImage(imageBlob) {
    const boundary = '---GoogleAppScriptBoundary';
    const imageBytes = imageBlob.getBytes();
    const imageFileName = 'uploaded_image.png';

    // Construct the multipart payload in binary format
    const payloadParts = [
        Utilities.newBlob(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${imageFileName}"\r\nContent-Type: image/png\r\n\r\n`).getBytes(),
        imageBytes,
        Utilities.newBlob(`\r\n--${boundary}--`).getBytes()
    ];

    // Combine all parts into one payload blob
    const fullPayload = Utilities.newBlob(payloadParts.reduce((acc, part) => acc.concat(part), []));

    // Set up the request options
    const request = {
        url: this.uploadUrl,
        method: 'post',
        contentType: `multipart/form-data; boundary=${boundary}`,
        payload: fullPayload.getBytes(),
        headers: {
            'accept': 'application/json',
            'x-api-key': this.apiKey,
        },
        muteHttpExceptions: true
    };

    try {
        const response = this.sendRequestWithRetries(request);
        const responseData = JSON.parse(response.getContentText());
        if (responseData && responseData.file_path) {
            console.log(`Returned image URL is: ${responseData.file_path}`);
            return responseData.file_path;
        } else {
            throw new Error('Invalid response from image upload service.');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image.');
    }
  }
}
