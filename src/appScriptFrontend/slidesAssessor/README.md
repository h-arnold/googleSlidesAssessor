# Google Slides Assessor
This script handles the bulk of the client side grunt work. It:

 - collates the student submissions for a given Google Classroom assignment
 - collects and uses the reference and empty slide Ids for comparison with the student work
 - parses all the data from said slides, converting them into distinct tasks based on how you tagged them in the reference and student slides.
 - sends all that data off to the Langflow backend (while keeping any PII firmly within your work Google Account)
 - creates an analysis sheet for you to see what the results of the assessment was.
 - creates and or updates an overview sheet which averages out all the Completeness, Accuracy and SPaG scores from all their work.

## Deployment

This script is intended to be deployed as a standalone Google App Script which is then used as a library by the template sheets. This has two main benefits:

 - It makes keeping the code up-to-date across all assessment records much easier.
 - It means that reference slide and empty slide IDs can be stored as a script property, meaning that only one person needs to enter them for a given assignment.

### Deployment steps
 1. Save this code as a standalone Google App Script. 
 2. Deploy it as a library. Make sure all users of the script have view access at least. Assuming you trust them, I recommend giving them edit access so you can set the Assessment Records to use the `HEAD` deployment, avoiding the need to update the deployment version each time you update in each assessment record.
 3. Update the Assessment Record Template with the script ID, making sure you call the library `AIAssess`.
