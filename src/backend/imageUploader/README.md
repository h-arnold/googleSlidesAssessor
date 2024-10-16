# Image Uploader

- [Image Uploader](#image-uploader)
  - [Here be data protection related dragons! Read carefully!!!](#here-be-data-protection-related-dragons-read-carefully)
  - [Overview](#overview)
  - [Upload Image Cloud Function](#upload-image-cloud-function)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Setup and Deployment](#setup-and-deployment)
    - [1. Clone the Repository](#1-clone-the-repository)
    - [2. Install Dependencies](#2-install-dependencies)
    - [3. Configure Environment Variables](#3-configure-environment-variables)
    - [4. Set Up Google Cloud Permissions](#4-set-up-google-cloud-permissions)
    - [5. Deploy the Cloud Function](#5-deploy-the-cloud-function)
  - [Usage](#usage)
    - [API Endpoint](#api-endpoint)
    - [Example Request](#example-request)
    - [Example Using `curl`](#example-using-curl)
    - [Example Response](#example-response)
  - [Local Testing](#local-testing)
    - [1. Install Functions Framework](#1-install-functions-framework)
    - [2. Update `package.json`](#2-update-packagejson)
    - [3. Run the Function Locally](#3-run-the-function-locally)
    - [4. Test with `curl`](#4-test-with-curl)
  - [Configuration](#configuration)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues and Solutions](#common-issues-and-solutions)
    - [Accessing Logs](#accessing-logs)
  - [Security Considerations](#security-considerations)

This tool is used to upload student slide images to a secure location in readiness for the Langflow backend to assess them. Because I aim to keep things as ephemeral as possible, uploading images to a stateless Langflow instance won't work very well because the instance with the RAM disk that contains the images may well have disappeared by the time you come to assess the images.

When the Langflow team make concurrency work more reliably, this may not be necessary.




## Here be data protection related dragons! Read carefully!!!

If you are based in Europe or any part of the world with vaguely sensible privacy laws, you must take extra care to ensure that PII of minors (children) is kept extra safe.

Google Slides Assessor is designed so that **no PII whatsoever** is sent outside of the Google Workspace domain that you are running the frontend script from. However, it is possible that PII may be sent outside inadvertently. To protect against this, you must ensure that data is stored securely and for the **shortest amount of time possible**.

Therefore, when setting up your Google Cloud bucket, you should bear the following in mind:

 - Set the soft delete period to 0 days, so once a file is deleted, it is deleted permanently.
 - Host your bucket in a single region so that it is not duplicated without your knowledge.
 - Set up a separate service account soley for the purpose of running the Google Cloud function and keep its permissions to the bear minimum.
 - Set the object lifecycle to hard-delete objects once they become 24 hours old (you can't easily set it for less than that.)
 - Ensure that the link expiry time is kept to an absolute minimum. I recommend setting it to 15 minutes because that is the execution limit on Google App Script, meaning that links will not persist beyond the time it takes to run the script once.

 Doing the above will mean that for 24 hours, your student's work should be stored securely, in a location compliant with your local privacy laws. Once 24 hours elapses, the slides are gone, never to be seen again by anyone, as it should be.

## Overview

The **Upload Image Cloud Function** is a serverless function deployed on Google Cloud Platform (GCP) that allows users to upload PNG images via a simple HTTP API. Upon receiving a valid image, the function performs the following actions:

1. **Validates** the incoming request, ensuring the image is a PNG and does not exceed 1MB in size.
2. **Uploads** the image to a specified Google Cloud Storage (GCS) bucket.
3. **Generates** a signed URL for the uploaded image, allowing temporary access.

## Upload Image Cloud Function

![Cloud Function](https://img.shields.io/badge/Google%20Cloud-Function-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18.x-green)
![License](https://img.shields.io/badge/License-MIT-blue.svg)



## Features

- **PNG Only**: Accepts only PNG images to ensure consistency and security.
- **Size Limitation**: Restricts image uploads to a maximum of **1MB**.
- **API Key Authentication**: Validates requests using a predefined API key.
- **Signed URLs**: Generates signed URLs with configurable expiration times for secure access.
- **Environment Configurable**: All settings are managed via environment variables for flexibility.
- **Robust Validation**: Includes multiple layers of validation to ensure data integrity and security.

## Prerequisites

Before setting up the Upload Image Cloud Function, ensure you have the following:

- **Google Cloud Account**: Access to [Google Cloud Platform](https://cloud.google.com/).
- **Google Cloud SDK**: Installed and configured. [Installation Guide](https://cloud.google.com/sdk/docs/install).
- **Node.js**: Version **18.x** or later. [Download Node.js](https://nodejs.org/en/download/).
- **Git**: For cloning the repository. [Download Git](https://git-scm.com/downloads).

## Setup and Deployment

Follow the steps below to set up and deploy the Upload Image Cloud Function.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/upload-image-cloud-function.git
cd upload-image-cloud-function
```

*Replace `your-username` with your actual GitHub username.*

### 2. Install Dependencies

Ensure you have **Node.js** installed. Then, install the necessary dependencies:

```bash
npm install
```

### 3. Configure Environment Variables

The function relies on several environment variables for configuration. You can set these during deployment.

- **BUCKET_NAME**: Name of the Google Cloud Storage bucket where images will be stored.
- **URL_EXPIRY_MINUTES**: Expiry time for the signed URL in minutes.
- **API_KEY**: (Optional) API key for authenticating requests.

**Example:**

```bash
export BUCKET_NAME=your-gcs-bucket-name
export URL_EXPIRY_MINUTES=60
export API_KEY=your-secure-api-key
```

*Ensure that `your-gcs-bucket-name` and `your-secure-api-key` are replaced with your actual bucket name and desired API key.*

### 4. Set Up Google Cloud Permissions

The Cloud Function requires specific IAM roles to interact with Google Cloud Storage and generate signed URLs.

1. **Identify the Service Account**:

   The default service account for Cloud Functions is typically in the format:
   
   ```
   [PROJECT_ID]@appspot.gserviceaccount.com
   ```

   To find your service account:

   ```bash
   gcloud functions describe uploadImage --format="value(serviceAccountEmail)"
   ```

2. **Grant Required Roles**:

   Assign the following roles to the service account:

   - **Storage Object Admin** (`roles/storage.objectAdmin`): Allows creating, deleting, and updating objects in GCS.
   - **Service Account Token Creator** (`roles/iam.serviceAccountTokenCreator`): Grants permission to sign blobs for generating signed URLs.

   **Using `gcloud` CLI**:

   ```bash
   SERVICE_ACCOUNT_EMAIL=$(gcloud functions describe uploadImage --format="value(serviceAccountEmail)")

   gcloud projects add-iam-policy-binding your-project-id \
     --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
     --role="roles/storage.objectAdmin"

   gcloud iam service-accounts add-iam-policy-binding ${SERVICE_ACCOUNT_EMAIL} \
     --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
     --role="roles/iam.serviceAccountTokenCreator"
   ```

   *Replace `your-project-id` with your actual GCP project ID.*

### 5. Deploy the Cloud Function

Use the `gcloud` CLI to deploy the function with the configured environment variables.

```bash
gcloud functions deploy uploadImage \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars BUCKET_NAME=your-gcs-bucket-name,URL_EXPIRY_MINUTES=60,API_KEY=your-secure-api-key
```

*Replace `your-gcs-bucket-name` and `your-secure-api-key` with your actual bucket name and API key.*

**Notes:**

- **Runtime**: Ensure you're using `nodejs18` or a compatible Node.js version.
- **Trigger**: The function is triggered via HTTP requests.
- **Authentication**: `--allow-unauthenticated` allows public access. If you prefer restricted access, omit this flag and set up appropriate authentication.

## Usage

Once deployed, you can interact with the Upload Image Cloud Function via HTTP POST requests.

### API Endpoint

```
https://<REGION>-<PROJECT_ID>.cloudfunctions.net/uploadImage
```

*Replace `<REGION>` and `<PROJECT_ID>` with your function's region and GCP project ID.*

### Example Request

**HTTP Method**: `POST`  
**Content-Type**: `application/json`

**Request Body**:

```json
{
  "apiKey": "your-secure-api-key",
  "image": "iVBORw0KGgoAAAANSUhEUgAAAAUA..." // Base64-encoded PNG image string
}
```

**Fields**:

- **apiKey**: Your predefined API key for authentication.
- **image**: Base64-encoded string of the PNG image (maximum size: 1MB).

### Example Using `curl`

```bash
curl -X POST https://<REGION>-<PROJECT_ID>.cloudfunctions.net/uploadImage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-secure-api-key",
    "image": "iVBORw0KGgoAAAANSUhEUgAAAAUA..." // Replace with your base64 string
  }'
```

### Example Response

**Success (HTTP 200)**:

```json
{
  "url": "https://storage.googleapis.com/your-gcs-bucket-name/images/unique-id.png?GoogleAccessId=...&Expires=...&Signature=..."
}
```

**Error Responses**:

- **400 Bad Request**: Invalid input data.
- **403 Forbidden**: Invalid API key.
- **413 Payload Too Large**: Image exceeds 1MB.
- **415 Unsupported Media Type**: Non-PNG image uploaded.
- **500 Internal Server Error**: Server-side issues.

## Local Testing

You can test the Cloud Function locally using the Functions Framework.

### 1. Install Functions Framework

```bash
npm install @google-cloud/functions-framework --save
```

### 2. Update `package.json`

Ensure the `start` script is defined:

```json
"scripts": {
  "start": "functions-framework --target=uploadImage"
}
```

### 3. Run the Function Locally

```bash
npm start
```

The function will be accessible at `http://localhost:8080`.

### 4. Test with `curl`

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-secure-api-key",
    "image": "iVBORw0KGgoAAAANSUhEUgAAAAUA..." // Replace with your base64 string
  }'
```

## Configuration

All configuration options are managed via environment variables, allowing flexibility without changing the codebase.

| Variable             | Description                                                 | Example                 |
| -------------------- | ----------------------------------------------------------- | ----------------------- |
| `BUCKET_NAME`        | Name of the Google Cloud Storage bucket to store images.    | `my-image-bucket`       |
| `URL_EXPIRY_MINUTES` | Expiry time for the signed URL in minutes.                  | `60`                    |
| `API_KEY`            | (Optional) API key for authenticating requests.            | `my-secure-api-key`     |

**Setting Environment Variables During Deployment**:

```bash
gcloud functions deploy uploadImage \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars BUCKET_NAME=my-image-bucket,URL_EXPIRY_MINUTES=60,API_KEY=my-secure-api-key
```

## Troubleshooting

### Common Issues and Solutions

1. **Function Fails to Deploy**

   - **Error**: `npm error code ETARGET`
   - **Solution**: Ensure all dependencies in `package.json` have valid versions. Remove specific version constraints if necessary.

2. **Invalid API Key**

   - **Error**: `Forbidden: Invalid API Key.`
   - **Solution**: Verify that the `API_KEY` in the request matches the one set in environment variables.

3. **Unsupported Media Type**

   - **Error**: `Unsupported Media Type: Only PNG images are allowed.`
   - **Solution**: Ensure the uploaded image is a valid PNG. Re-encode the image in base64 if necessary.

4. **Payload Too Large**

   - **Error**: `Payload Too Large: Image size exceeds 1MB limit.`
   - **Solution**: Compress or resize the image to be under 1MB before uploading.

5. **Signed URL Generation Failure**

   - **Error**: `Internal Server Error: Failed to generate signed URL.`
   - **Solution**: Ensure the service account has the `Service Account Token Creator` role. Verify IAM permissions.

6. **Environment Variable Not Set**

   - **Error**: `Internal Server Error: Bucket name not configured.`
   - **Solution**: Confirm that all required environment variables (`BUCKET_NAME`, etc.) are set correctly during deployment.

### Accessing Logs

To diagnose issues, review the Cloud Function logs.

**Using Google Cloud Console**:

1. Navigate to **Cloud Functions**.
2. Select your `uploadImage` function.
3. Click on the **Logs** tab.

**Using `gcloud` CLI**:

```bash
gcloud functions logs read uploadImage
```

## Security Considerations

- **API Key Management**: Store the API key securely. Consider using [Google Secret Manager](https://cloud.google.com/secret-manager) instead of environment variables for enhanced security.
- **IAM Permissions**: Assign the least privilege necessary. Only grant required roles to the service account.
- **HTTPS Enforcement**: Ensure all communications with the Cloud Function are over HTTPS to protect data in transit.
- **Input Validation**: Robustly validate all inputs to prevent injection attacks or malformed data.