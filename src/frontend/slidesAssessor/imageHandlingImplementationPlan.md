## **Overview**

### **Key Objectives:**

1. **Retain the Existing `getSlideImage` Method:**
   - Continue using the `getSlideImage` method in the `SlideExtractor` class to fetch images of entire slides for both reference/empty slides and student submissions.

2. **Remove Image Caching in `LLMRequestManager`:**
   - Adjust the caching logic by removing image caching due to Google Apps Script cache size limitations.

3. **Update `Task` and `StudentTask` Classes:**
   - Incorporate new properties for image URLs.
   - Update serialization and deserialization methods to handle these new properties.

4. **Create a Base `RequestManager` Class:**
   - Implement a `RequestManager` base class that encapsulates shared request handling functionalities, including retries, error handling, and batching.

5. **Implement the `ImageRequestManager` Class:**
   - Extend the `RequestManager` base class.
   - Handle image uploads using the shared functionalities from the base class.

6. **Implement the `LLMRequestManager` Class:**
   - Extend the `RequestManager` base class.
   - Handle LLM requests using the shared functionalities.

7. **Introduce a Separate `imageBatchSize` Setting:**
   - Add a new configuration parameter for controlling the batch size of image uploads.

8. **Verify and Enhance Error Handling in `getSlideImage`:**
   - Ensure that the `getSlideImage` method handles errors gracefully and logs them appropriately.

9. **Use UIDs to Associate Images with Student Responses:**
   - Utilize unique identifiers to correctly match images with their corresponding tasks and student responses.

10. **Use `toastMessage` for User Notifications:**
    - Provide immediate feedback to the user using the `Utils.toastMessage` method.

11. **Adjust the Workflow in the `Assignment` Class:**
    - Modify the workflow to process images appropriately, ensuring that image URLs are obtained before generating LLM requests.

12. **Thorough Testing and Debugging:**
    - Ensure that the updated system works as intended across all functionalities.

13. **Security Considerations:**
    - Ensure that API keys and sensitive data are handled securely.

14. **Update Documentation:**
    - Update code comments, documentation, and user guides to reflect changes.

15. **Deployment:**
    - Deploy the updated code to the production environment.

---

## **Implementation Steps**

### **Step 1: Update the `SlideExtractor` Class**

**File:** `SlideExtractor.gs`

**Objective:** Retain and use the `getSlideImage` method to extract images for reference, empty, and student slides without requiring slide element tagging.

#### Actions:

- **Use `getSlideImage` for Image Tasks:**
  - In the `extractTasksFromSlides` method, modify the handling of image tasks (`taskType === "Image"`) to use the `getSlideImage` method to obtain the image Blob of the entire slide.
  - Assign this Blob to `task.imageBlob` for reference slides and to a new property `task.emptyImageBlob` for empty slides.

- **Modify `parseTask` Method:**
  - Adjust the `parseTask` method to handle image Blobs for reference and empty content.
  - For image tasks, set `taskReference` and `emptyContent` appropriately (e.g., empty strings or relevant values), and assign the image Blobs to the respective properties.

#### Testing:

- **Test Extraction of Image Blobs:**
  - Verify that image Blobs are correctly extracted and assigned to `task.imageBlob` and `task.emptyImageBlob`.
  - Test with slides containing image tasks to ensure correct extraction.

---

### **Step 2: Update the `Task` Class**

**File:** `Task.gs`

**Objective:** Add properties for `referenceImageUrl` and `emptyImageUrl`, and update serialization methods.

#### Actions:

- **Add New Properties:**
  - Modify the `Task` constructor to include `referenceImageUrl` and `emptyImageUrl`, defaulting to `null`.

  ```javascript
  constructor(
    /* existing parameters */,
    referenceImageUrl = null,
    emptyImageUrl = null
  ) {
    // existing initializations
    this.referenceImageUrl = referenceImageUrl;
    this.emptyImageUrl = emptyImageUrl;
  }
  ```

- **Update `toJSON` Method:**
  - Include `referenceImageUrl` and `emptyImageUrl` in the serialized output.

  ```javascript
  toJSON() {
    return {
      // existing properties
      referenceImageUrl: this.referenceImageUrl,
      emptyImageUrl: this.emptyImageUrl,
      // existing properties
    };
  }
  ```

- **Update `fromJSON` Method:**
  - Read `referenceImageUrl` and `emptyImageUrl` from the JSON object.

  ```javascript
  static fromJSON(json) {
    const task = new Task(
      // existing parameters
    );
    task.referenceImageUrl = json.referenceImageUrl || null;
    task.emptyImageUrl = json.emptyImageUrl || null;
    return task;
  }
  ```

#### Testing:

- **Serialization and Deserialization Tests:**
  - Create unit tests to verify that `Task` objects serialize and deserialize correctly with the new properties.
  - Test with tasks that include and exclude the new properties to ensure backward compatibility.

---

### **Step 3: Update the `StudentTask` Class**

**File:** `StudentTask.gs`

**Objective:** Add the `studentImageUrl` property to responses and update methods accordingly.

#### Actions:

- **Modify `addResponse` Method:**
  - Add a new parameter `studentImageUrl`, defaulting to `null`.

  ```javascript
  addResponse(taskIndex, uid, slideId, response, studentImageUrl = null) {
    this.responses[taskIndex] = {
      uid: uid,
      slideId: slideId,
      response: response,
      studentImageUrl: studentImageUrl,
      assessment: null
    };
  }
  ```

- **Update `toJSON` Method:**
  - Include `studentImageUrl` when serializing responses.

  ```javascript
  toJSON() {
    return {
      // existing properties
      responses: Object.fromEntries(
        Object.entries(this.responses).map(([key, value]) => [
          key,
          {
            uid: value.uid,
            slideId: value.slideId,
            response: /* existing serialization */,
            studentImageUrl: value.studentImageUrl,
            assessment: value.assessment
          }
        ])
      )
    };
  }
  ```

- **Update `fromJSON` Method:**
  - Read `studentImageUrl` when deserializing responses.

  ```javascript
  static fromJSON(json) {
    const studentTask = new StudentTask(/* existing parameters */);
    // existing deserialization
    for (const [taskKey, responseObj] of Object.entries(json.responses)) {
      studentTask.responses[taskKey] = {
        uid: responseObj.uid,
        slideId: responseObj.slideId,
        response: /* existing deserialization */,
        studentImageUrl: responseObj.studentImageUrl || null,
        assessment: responseObj.assessment
      };
    }
    return studentTask;
  }
  ```

#### Testing:

- **Test Adding Responses with Image URLs:**
  - Verify that responses with `studentImageUrl` are added correctly.

- **Serialization and Deserialization Tests:**
  - Ensure that `StudentTask` objects serialize and deserialize correctly with the new property.

---

### **Step 4: Create the Base `RequestManager` Class**

**File:** `RequestManager.gs` (New file)

**Objective:** Implement a `RequestManager` base class that encapsulates shared functionalities for handling HTTP requests, including error handling and retries.

#### Actions:

- **Define the Base Class:**
  - The `RequestManager` will include shared functionalities for batching, retries with exponential backoff, and processing responses.

  ```javascript
  class RequestManager {
    constructor() {
      // ConfigurationManager instance for accessing configurations
      this.configManager = configurationManager;
    }

    sendRequestsInBatches(requests, batchSize) {
      if (!requests || requests.length === 0) return;

      const batches = [];
      for (let i = 0; i < requests.length; i += batchSize) {
        batches.push(requests.slice(i, i + batchSize));
      }

      batches.forEach((batch) => {
        const responses = this.sendSingleBatch(batch);
        this.processResponses(responses, batch);
      });
    }

    sendSingleBatch(batch) {
      try {
        return UrlFetchApp.fetchAll(batch);
      } catch (error) {
        console.error("Error sending batch:", error);
        return [];
      }
    }

    processResponses(responses, batch) {
      throw new Error("processResponses must be implemented by subclasses.");
    }

    retryRequest(request, maxRetries = 3) {
      request.retries = request.retries || 0;

      if (request.retries < maxRetries) {
        request.retries += 1;
        const delay = Math.pow(2, request.retries) * 1000;
        Utilities.sleep(delay);
        try {
          const response = UrlFetchApp.fetch(request.url, request);
          this.processResponses([response], [request]);
        } catch (error) {
          this.retryRequest(request, maxRetries);
        }
      } else {
        console.error(`Max retries exceeded for UID: ${request.uid}`);
      }
      } else {
        console.error(`Max retries exceeded for UID: ${request.uid}`);
        Utils.toastMessage(`Failed to process request for UID: ${request.uid}`, "Error", 5);
      }
    }
  }
  ```

#### Testing:

- **Unit Tests for Base Class:**
  - Test the batching logic and retry mechanism independently to ensure correct functionality.

---

### **Step 5: Implement the `ImageRequestManager` Class**

**File:** `ImageRequestManager.gs` (New file)

**Objective:** Extend the `RequestManager` base class to handle image uploads using shared functionalities such as batching, retries, and error handling.

#### Actions:

- **Extend `RequestManager`:**

  ```javascript
  class ImageRequestManager extends RequestManager {
    constructor() {
      super();
    }

    generateRequestObjects(imagesToUpload) {
      const requests = [];
      const apiKey = this.configManager.getImageUploaderApiKey();
      const uploadUrl = this.configManager.getImageUploadUrl();

      imagesToUpload.forEach(imageObj => {
        const base64Image = Utilities.base64Encode(imageObj.imageBlob.getBytes());

        const payload = {
          apiKey: apiKey,
          imageData: base64Image
        };

        const request = {
          url: uploadUrl,
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true,
          uid: imageObj.uid,
          imageObj: imageObj
        };

        requests.push(request);
      });

      return requests;
    }

    processResponses(responses, batch) {
      responses.forEach((response, index) => {
        const request = batch[index];
        const uid = request.uid;
        const imageObj = request.imageObj;

        if (response.getResponseCode() === 200) {
          try {
            const responseData = JSON.parse(response.getContentText());
            const imageUrl = responseData.imageUrl;

            if (imageUrl) {
              imageObj.callback(uid, imageUrl);
            } else {
              console.warn(`No imageUrl found in response for UID: ${uid}`);
              this.retryRequest(request);
            }
          } catch (error) {
            console.error(`Error parsing response for UID: ${uid} - ${error.message}`);
            this.retryRequest(request);
          }
        } else {
          console.error(`Non-200 response for UID: ${uid} - Code: ${response.getResponseCode()}`);
          this.retryRequest(request);
        }
      });
    }
  }
  ```

- **Generate Request Objects:**
  - Create request objects for image uploads, including the image data and necessary headers (e.g., API key).
  - Use UIDs to track the association between image URLs and tasks.

- **Process Responses:**
  - Parse responses to extract the image URLs and assign them to the correct task using UIDs.
  - Implement retries for failed requests.

- **Error Handling:**
  - Handle common errors, such as network timeouts, invalid API keys, and unsupported file formats.
  - Use `Utils.toastMessage` to notify the user of persistent errors.

#### Testing:

- **Test Image Uploads:**
  - Upload sample images and verify that image URLs are correctly associated with tasks and student responses.

- **Error Handling Tests:**
  - Simulate error conditions (e.g., invalid API key or network issues) and verify that the retry mechanism works as expected.

---

### **Step 6: Implement the `LLMRequestManager` Class**

**File:** `LLMRequestManager.gs`

**Objective:** Extend the `RequestManager` base class to handle LLM requests using shared functionalities.

#### Actions:

- **Extend `RequestManager`:**

  ```javascript
  class LLMRequestManager extends RequestManager {
    constructor() {
      super();
    }

    generateRequestObjects(tasks) {
      const requests = [];
      tasks.forEach(task => {
        const payload = {
          // Construct payload based on the task's data
        };

        const request = {
          url: this.configManager.getLLMEndpoint(),
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true,
          uid: task.uid
        };

        requests.push(request);
      });

      return requests;
    }

    processResponses(responses, batch) {
      responses.forEach((response, index) => {
        const request = batch[index];
        const uid = request.uid;

        if (response.getResponseCode() === 200) {
          try {
            const responseData = JSON.parse(response.getContentText());
            const assessment = responseData.assessment;

            if (assessment) {
              // Assign assessment to the correct task using the uid
            } else {
              console.warn(`No assessment found in response for UID: ${uid}`);
              this.retryRequest(request);
            }
          } catch (error) {
            console.error(`Error parsing response for UID: ${uid} - ${error.message}`);
            this.retryRequest(request);
          }
        } else {
          console.error(`Non-200 response for UID: ${uid} - Code: ${response.getResponseCode()}`);
          this.retryRequest(request);
        }
      });
    }
  }
  ```

- **Generate Request Objects:**
  - Create request objects for LLM assessments, including image URLs (if applicable) and other task data.

- **Process Responses:**
  - Parse LLM responses and assign assessments to the correct student tasks using UIDs.
  - Implement retries for failed requests.

#### Testing:

- **Test LLM Requests:**
  - Verify that LLM requests are correctly generated, including image URLs if applicable.
  - Ensure responses are correctly processed and assigned to student tasks.

- **Error Handling Tests:**
  - Simulate various failure scenarios and ensure the retry logic is triggered appropriately.

---

### **Step 7: Introduce a Separate `imageBatchSize` Setting**

**File:** `ConfigurationManager.gs`

**Objective:** Add a new configuration parameter for controlling the batch size of image uploads.

#### Actions:

- **Add Configuration Keys and Getter/Setter Methods:**

  ```javascript
  static get CONFIG_KEYS() {
    return {
      IMAGE_BATCH_SIZE: 'imageBatchSize',
      IMAGE_UPLOAD_URL: 'imageUploadUrl',
      IMAGE_UPLOADER_API_KEY: 'imageUploaderApiKey',
    };
  }

  getImageBatchSize() {
    const value = parseInt(this.getProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_BATCH_SIZE), 10);
    return isNaN(value) ? 5 : value; // Default value
  }

  setImageBatchSize(batchSize) {
    if (!Number.isInteger(batchSize) || batchSize <= 0) {
      throw new Error("Image Batch Size must be a positive integer.");
    }
    this.setProperty(ConfigurationManager.CONFIG_KEYS.IMAGE_BATCH_SIZE, batchSize);
  }
  ```

- **Validate Values:**
  - Ensure the batch size is a valid positive integer before setting it in the configuration.

#### Testing:

- **Test Configuration Settings:**
  - Set and retrieve the new configuration properties, ensuring they behave as expected.

- **Validation Tests:**
  - Test invalid inputs for batch size and verify that appropriate errors are thrown.

---

### **Step 8: Verify and Enhance Error Handling in `getSlideImage`**

**File:** `SlideExtractor.gs`

**Objective:** Ensure that the `getSlideImage` method handles errors gracefully and logs them appropriately.

#### Actions:

- **Add Error Handling in `getSlideImage`:**
  - Ensure all exceptions are caught using `try-catch` blocks, with proper logging of errors.
  - Log detailed error messages, including the slide ID and error context.

- **Return `null` on Error:**
  - Modify the method to return `null` if an image cannot be retrieved, allowing the process to continue without failing entirely.

#### Testing:

- **Simulate Error Conditions:**
  - Test scenarios where image retrieval fails (e.g., invalid slide IDs, network issues), and verify that the method handles errors correctly.

---

### **Step 9: Use UIDs to Associate Images with Responses**

**Files:** `StudentTask.gs`, `ImageRequestManager.gs`

**Objective:** Use unique identifiers (UIDs) to ensure correct association of images with tasks and student responses.

#### Actions:

- **In `StudentTask`:**
  - Ensure that a UID is generated for each response when `addResponse` is called.

- **In `ImageRequestManager`:**
  - Include UIDs in each request object when uploading images.
  - Use the UIDs to match image URLs with their corresponding tasks or student responses in the `processResponses` method.

#### Testing:

- **Test UID Association:**
  - Verify that image URLs are correctly associated with their corresponding responses and tasks using UIDs.

---

### **Step 10: Use `toastMessage` for User Notifications**

**Files:** `Utils.gs`, `ImageRequestManager.gs`, `LLMRequestManager.gs`

**Objective:** Provide immediate feedback to the user using the `Utils.toastMessage` method.

#### Actions:

- **Replace Console Logs with `toastMessage`:**
  - In `ImageRequestManager` and `LLMRequestManager`, replace console logs intended for user notifications with calls to `Utils.toastMessage`.
  - Use appropriate message titles like "Error", "Warning", "Info", or "Success" to reflect the message context.

#### Testing:

- **Trigger Error Scenarios:**
  - Simulate errors (e.g., failed requests or invalid inputs) to verify that toast messages are displayed to the user.

---

### **Step 11: Adjust Workflow in the `Assignment` Class**

**File:** Assignment.gs

**Objective:** Modify the workflow to process images appropriately, ensuring that image URLs are obtained before generating LLM requests.

**Actions:**

- **In populateTasksFromSlides:**
  - After extracting tasks, collect image Blobs for reference and empty slides where taskType === "Image".
  - Create a list of images to upload, including the UID and task reference.
  - Use ImageRequestManager to upload these images in batches.
  - Assign the obtained image URLs to task.referenceImageUrl and task.emptyImageUrl.

- **In processAllSubmissions:**
  - After extracting student responses, collect image Blobs from student responses for image tasks.
  - Create a list of images to upload, including the UID and response reference.
  - Use ImageRequestManager to upload these images in batches.
  - Assign the obtained image URLs to response.studentImageUrl in StudentTask.

- **Ensure Sequential Processing:**
  - Make sure that image URLs are obtained before generating LLM requests.

- **Adjust assessResponses Method:**
  - Ensure that LLMRequestManager is called after all image URLs are assigned.

**Testing:**

- **End-to-End Testing:**
  - Run the entire workflow with assignments containing image tasks.
  - Verify that image URLs are correctly assigned and that LLM requests include these URLs.

## **Dependencies and Grouping**

This breakdown clarifies which steps can be performed independently and which rely on prior steps for effective implementation. Testing should be completed after each step whenever possible to catch issues early.

### **Steps That Can Be Done Independently:**

1. **Step 1:** Update `SlideExtractor` class.
   - *Testing:* Verify that the `getSlideImage` method works as expected without caching. Ensure image extraction from slides functions correctly.

2. **Step 2:** Update `Task` class.
   - *Testing:* Verify the addition of `referenceImageUrl` and `emptyImageUrl` properties through serialization and deserialization tests.

3. **Step 3:** Update `StudentTask` class.
   - *Testing:* Validate the addition of `studentImageUrl` property and ensure it serializes/deserializes correctly.

4. **Step 8:** Verify error handling in `getSlideImage`.
   - *Testing:* Test the robustness of `getSlideImage` by simulating error conditions.

5. **Step 10:** Use `toastMessage` for user notifications.
   - *Testing:* Ensure that `toastMessage` notifications are triggered correctly for relevant error or success conditions.

### **Steps That Depend on Prior Steps:**

1. **Step 4:** Create `RequestManager` base class.
   - *Dependencies:* This should be done before implementing `ImageRequestManager` and `LLMRequestManager`.
   - *Testing:* Unit tests should validate batching, retry mechanisms, and error handling independently.

2. **Step 5:** Implement `ImageRequestManager`.
   - *Dependencies:* Depends on `RequestManager` base class (Step 4) and `Task` class updates (Step 2).
   - *Testing:* Test image uploads in batches, ensure UIDs match the correct task associations, and verify retry and error handling mechanisms.

3. **Step 6:** Implement `LLMRequestManager`.
   - *Dependencies:* Depends on `RequestManager` base class (Step 4) and updates to `Task` and `StudentTask` classes (Steps 2 and 3).
   - *Testing:* Verify that LLM requests include appropriate image URLs, correctly parse responses, and handle errors/retries.

4. **Step 7:** Introduce `imageBatchSize` setting in `ConfigurationManager`.
   - *Dependencies:* Ensure it is set before testing `ImageRequestManager`.
   - *Testing:* Validate that batch sizes are correctly applied and that the setting can be changed without issues.

5. **Step 9:** Use UIDs to associate images with responses.
   - *Dependencies:* `StudentTask` and `ImageRequestManager`.
   - *Testing:* Verify that UIDs correctly associate images with student responses, checking batch processing and error handling.

6. **Step 11:** Adjust workflow in `Assignment` class.
   - *Dependencies:* Dependent on Steps 1-6 and 9, particularly `ImageRequestManager` and `LLMRequestManager`.
   - *Testing:* Ensure that image URLs are correctly assigned to tasks, responses, and included in LLM requests.

### **Testing Should Be Performed After Each Step Where Possible**

- Implement unit tests, followed by integration tests that cover the entire workflow.
- Focus on error handling, retry logic, and message notification to catch issues early.
- Validate that each component works before moving on to the next dependent step to prevent compounding errors.

---

## **End-to-End Testing and Debugging**

This phase aims to validate the complete workflow, encompassing all classes and methods introduced in this plan.

1. **Run Through All Scenarios:**
   - Test with a variety of task types, including text, table, and image tasks, to ensure the system can handle all cases.
   - Include assessments that lack image tasks to verify system versatility.

2. **Edge Case Handling:**
   - Assess the behaviour under non-standard conditions (e.g., very large image uploads, network delays).
   - Test the system’s handling of intermittent API failures and ensure that exponential backoff and retries work correctly.

3. **Performance Evaluation:**
   - Ensure batch processing is optimised for both image uploads and LLM requests. This can involve testing larger batch sizes to check for latency or rate-limiting issues.
   - Track response times and memory usage for each component to ensure the system operates efficiently under expected loads.

4. **Error and Message Verification:**
   - Ensure `Utils.toastMessage` displays the correct notifications, providing clear and actionable feedback to the user.
   - Confirm that error handling logs relevant details without exposing sensitive information.

---

## **Deployment and Post-Deployment Monitoring**

1. **Deployment to Production:**
   - Deploy the code to the production environment once all tests are completed successfully.
   - Use feature flags if needed to control the rollout of changes.

2. **Monitor for Issues:**
   - Implement logging for monitoring post-deployment performance and to capture any unexpected issues.
   - Be prepared to rollback if critical issues are encountered.

3. **User Feedback:**
   - Gather feedback from users, especially on the performance and any error notifications, to improve the system iteratively.

---

This final implementation plan captures all required steps in detail and includes structured testing and debugging strategies to ensure each component functions as expected in isolation and as part of the larger system. If there are further aspects you’d like to expand on, just let me know!
