# Deploying Langflow Server

Langflow provides the LLM backend to the Google Slides Assessor. There are lots of deployment options, [including a fully hosted option with DataStax](https://www.datastax.com/products/langflow) which is fine for testing, but not, as far as I can tell, GDPR compliant.

Below are the instructions for deploying Langflow to a Google Cloud Run instance. I recommend using a serverless option like Google Cloud run because:

 - **High resource usage**: Langflow requires at least 1vCPU and 2GBs of RAM per worker. Running this on a VPS is relatively expensive.
 - **Bursty usage**: Once set up, Langflow will not be needed most of the time, but when it is needed, you will want multiple instances to get results in a timely manner. Serverless usage means you can quickly scale up for the burst and then scale back down to zero.
 - **Generous Free Tier**: For 24/7 usage, Google Cloud Run is very expensive. For the my usage though, I rarely need to pay extra.

### **Prerequisites**

1. **Google Cloud Project**:
   - Ensure you have an active Google Cloud project with billing enabled.

2. **Google Cloud CLI**:
   - Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and authenticate:
     ```bash
     gcloud auth login
     gcloud config set project [PROJECT_ID]
     ```

3. **Enable Required APIs**:
   - Enable the following APIs:
     ```bash
     gcloud services enable run.googleapis.com container.googleapis.com secretmanager.googleapis.com
     ```

4. **PostgreSQL Database**:
   - A PostgreSQL database is required for this deployment. Supabase offers free PostgreSQL databases with GDPR-compliant data centres in Europe, making it a suitable choice. 

5. **Setup Necessary Resources**:
   - **Service Account**:
     Ensure the service account `<SERVICE_ACCOUNT_NAME>` exists and has the following permissions:
     - Cloud Run Invoker
     - Secret Manager Secret Accessor
     - Storage Object Viewer (if accessing GCS bucket)

   - **Secrets**:
     Create the secrets referenced in the YAML file:
     ```bash
     gcloud secrets create <SUPERUSER_PASSWORD_SECRET> --replication-policy="automatic"
     gcloud secrets create <DATABASE_URL_SECRET> --replication-policy="automatic"
     gcloud secrets create <POSTGRES_CERT_SECRET> --replication-policy="automatic"
     ```

     Store the required values in these secrets:
     ```bash
     echo -n "<SUPERUSER_PASSWORD>" | gcloud secrets versions add <SUPERUSER_PASSWORD_SECRET> --data-file=-
     echo -n "<DATABASE_URL>" | gcloud secrets versions add <DATABASE_URL_SECRET> --data-file=-
     echo -n "<CERT_CONTENT>" | gcloud secrets versions add <POSTGRES_CERT_SECRET> --data-file=-
     ```

   - **GCS Bucket**:
     Create the bucket `<GCS_BUCKET_NAME>` if it doesn’t exist:
     ```bash
     gcloud storage buckets create <GCS_BUCKET_NAME> --location=<REGION>
     ```

---

### **Deployment Steps**

1. **Prepare the YAML File**:
   - Replace placeholders (`<SERVICE_NAME>`, `<REGION>`, etc.) with actual values. Ensure the YAML file is saved locally as `service.yaml`.

2. **Deploy the Service**:
   Run the following command to deploy the service:
   ```bash
   gcloud run services replace service.yaml
   ```

   This command will create or update the service based on the YAML configuration.

3. **Verify the Deployment**:
   - Check the status of the service:
     ```bash
     gcloud run services describe <SERVICE_NAME> --region=<REGION>
     ```
   - Note the generated URL to access the service.

---

### **Post-Deployment Tasks**

1. **Test the Service**:
   - Access the service using the provided URL and verify functionality.

2. **Monitor and Debug**:
   - Monitor logs to ensure the service is running as expected:
     ```bash
     gcloud logs read --service=<SERVICE_NAME> --region=<REGION>
     ```

3. **Scaling and Autoscaling**:
   - The configuration allows up to 5 instances with 20 concurrent requests per instance. Adjust `autoscaling.knative.dev/maxScale` or `containerConcurrency` if needed.

4. **Secure Access (Optional)**:
   - Restrict access to authorised users or services by configuring IAM roles and policies:
     ```bash
     gcloud run services add-iam-policy-binding <SERVICE_NAME> \
       --region=<REGION> \
       --member="user:<EMAIL>" \
       --role="roles/run.invoker"
     ```

---

### **Notes**

- **Execution Environment**: The service is configured for `gen2`. Verify compatibility with your application requirements.
- **Secrets Handling**: Secrets are securely accessed using Secret Manager. Avoid embedding sensitive information directly in the YAML file.
- **Volume Mounts**: Ensure the bucket and `emptyDir` configurations meet your performance and security needs.
