# Image Uploader

This folder contains the source code for a Google Cloud function which takes an API key and a base64 encoded image. 

The function uploads this image to a pre-defined google cloud bucket and returns a signed URL that will last 15 minutes before expiring by default.

## Here be data protection related dragons! Read carefully!!!

If you are based in Europe or any part of the world with vaguely sensible privacy laws, you must take extra care to ensure that PII of minors (children) is kept extra safe.

Google Slides Assessor is designed so that **no PII whatsoever** is sent outside of the Google Workspace domain that you are running the frontend script from. However, it is possible that PII may be sent outside inadvertently. To protect against this, you must ensure that data is stored securely and for the **shortest amount of time possible**.

Therefore, when setting up your Google Cloud bucket, you should bear the following in mind:

 - Set the soft delete period to 0 days, so once a file is deleted, it is deleted permanently.
 - Host your bucket in a single region so that it is not duplicated without your knowledge.
 - Set up a separate service account soley for the purpose of running the Google Cloud function and keep its permissions to the bear minimum.
 - Set the object lifecycle to hard-delete objects once they become 24 hours old (you can't easily set it for less than that.)
 - Ensure that the link expiry time is kept to an absolute minimum. I recommend setting it to 1800 because that is the execution limit on Google App Script, meaning that links will not persist beyond the time it takes to run the script once.

