// index.js

const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const sizeOf = require('image-size'); // To verify image dimensions and type

// Initialize the Google Cloud Storage client
const storage = new Storage();

// Maximum allowed image size in bytes (1MB)
const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['png'];

exports.uploadImage = async (req, res) => {
  try {
    console.log('Received request:', req.method);

    // Only allow POST requests
    if (req.method !== 'POST') {
      console.warn('Method not allowed:', req.method);
      res.status(405).send({ error: 'Method Not Allowed. Use POST.' });
      return;
    }

    // Ensure Content-Type is application/json
    if (!req.is('application/json')) {
      console.warn('Invalid Content-Type:', req.get('Content-Type'));
      res.status(400).send({ error: 'Bad Request: Content-Type must be application/json.' });
      return;
    }

    // Parse the request body
    const { apiKey, image } = req.body;
    console.log('Parsed request body:', { apiKey: apiKey ? 'Provided' : 'Missing', image: image ? 'Provided' : 'Missing' });

    // Validate API Key if required
    const expectedApiKey = process.env.API_KEY;
    if (expectedApiKey) {
      if (apiKey !== expectedApiKey) {
        console.warn('Invalid API Key:', apiKey);
        res.status(403).send({ error: 'Forbidden: Invalid API Key.' });
        return;
      } else {
        console.log('API Key validated successfully.');
      }
    } else {
      console.log('No API Key required.');
    }

    if (!image) {
      console.warn('Missing image data.');
      res.status(400).send({ error: 'Bad Request: Missing image data.' });
      return;
    }

    // Decode the base64 image
    let buffer;
    try {
      buffer = Buffer.from(image, 'base64');
      console.log('Image decoded successfully.');
    } catch (decodeError) {
      console.error('Error decoding image:', decodeError);
      res.status(400).send({ error: 'Bad Request: Invalid base64 image data.' });
      return;
    }

    // Check image size
    if (buffer.length > MAX_IMAGE_SIZE) {
      console.warn('Image size exceeds 1MB:', buffer.length, 'bytes.');
      res.status(413).send({ error: 'Payload Too Large: Image size exceeds 1MB limit.' });
      return;
    }
    console.log(`Image size: ${buffer.length} bytes.`);

    // Verify image type using image-size
    let dimensions;
    try {
      dimensions = sizeOf(buffer);
      console.log('Image dimensions and type:', dimensions);
    } catch (imageError) {
      console.error('Error verifying image type:', imageError);
      res.status(400).send({ error: 'Bad Request: Uploaded file is not a valid image.' });
      return;
    }

    // Log both type and mime for debugging
    console.log(`Image type: ${dimensions.type}, MIME type: ${dimensions.mime}`);

    // Ensure the image is a PNG by checking type
    if (!ALLOWED_IMAGE_TYPES.includes(dimensions.type)) {
      console.warn('Unsupported image type:', dimensions.type);
      res.status(415).send({ error: 'Unsupported Media Type: Only PNG images are allowed.' });
      return;
    }
    console.log('Image type is PNG.');

    // Generate a unique filename
    const filename = `images/${uuidv4()}.png`; // PNG extension
    console.log('Generated filename:', filename);

    // Reference to the GCS bucket
    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) {
      console.error('Environment variable BUCKET_NAME is not set.');
      res.status(500).send({ error: 'Internal Server Error: Bucket name not configured.' });
      return;
    }
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);
    console.log(`Uploading to bucket: ${bucketName}, file: ${filename}`);

    // Upload the image to GCS
    try {
      await file.save(buffer, {
        metadata: {
          contentType: 'image/png', // Ensuring the correct MIME type
        },
        resumable: false, // Use non-resumable uploads for smaller files
      });
      console.log('Image uploaded successfully.');
    } catch (uploadError) {
      console.error('Error uploading image to GCS:', uploadError);
      res.status(500).send({ error: 'Internal Server Error: Failed to upload image.' });
      return;
    }

    // Generate a signed URL
    const expiryMinutes = parseInt(process.env.URL_EXPIRY_MINUTES, 10);
    if (isNaN(expiryMinutes) || expiryMinutes <= 0) {
      console.warn('Invalid URL_EXPIRY_MINUTES:', process.env.URL_EXPIRY_MINUTES);
      res.status(500).send({ error: 'Internal Server Error: Invalid URL expiry time.' });
      return;
    }
    const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
    console.log(`Generating signed URL, expires in ${expiryMinutes} minutes.`);

    let signedUrl;
    try {
      [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: expiresAt,
      });
      console.log('Signed URL generated successfully:', signedUrl);
    } catch (signedUrlError) {
      console.error('Error generating signed URL:', signedUrlError);
      res.status(500).send({ error: 'Internal Server Error: Failed to generate signed URL.' });
      return;
    }

    // Respond with the signed URL
    res.status(200).send({ url: signedUrl });
    console.log('Response sent successfully.');

  } catch (error) {
    console.error('Unexpected error in uploadImage function:', error);
    res.status(500).send({ error: 'Internal Server Error.' });
  }
};
