# Setting up Google Slides Assessor

- [Setting up Google Slides Assessor](#setting-up-google-slides-assessor)
    - [Prerequisites](#prerequisites)
  - [Core Components](#core-components)
      - [The Langflow Backend](#the-langflow-backend)
      - [Google Slides Assessor Library](#google-slides-assessor-library)
      - [The Assessment Records](#the-assessment-records)
      - [Overview Sheet](#overview-sheet)
  - [The Setup Process](#the-setup-process)
    - [Setting up the Langflow Backend](#setting-up-the-langflow-backend)
    - [Setting up the Google App Script Frontend](#setting-up-the-google-app-script-frontend)
      - [Creating the assessment records](#creating-the-assessment-records)
      - [\[Configuring Google Slides AI Assessor\](TODO: add later)](#configuring-google-slides-ai-assessortodo-add-later)
      - [\[Setting up the overview sheet\] (TODO: add in later)](#setting-up-the-overview-sheet-todo-add-in-later)
      - [Tagging your resources for automated assessment.](#tagging-your-resources-for-automated-assessment)

### Prerequisites
 - **A Google Gemini API Key:** Respect your students privacy and make sure you use the PAYG option which doesn't use API responses to train future models.
- **A Google Workspace for Education Account:** and active Google Classrooms from which to pull your students' Google Slides documents.
  
## Core Components

Understanding what each component does will help you understand how this system works together.

#### The Langflow Backend

[Langflow](https://github.com/langflow-ai/langflow) provides the LLM (large lanaguage model) backend for the Assessment Records.

#### Google Slides Assessor Library

This is a standalone Google App Script file that is referenced by the Assessment Records and contains most of the code that does the assessment and the data analysis. Referencing the library has two key advantages:
  - **Ease of updates:** When there is an update to the Google Slides Assessor, you just update this file rather than each of the Assessment Records.
  - **Centralised assessment store:** Once one person has entered the reference and template slide IDs for an assignment, it is stored in the `ScriptProperties` of that script, meaning that it only needs to be entered once for each assignment.
  - **Protection of configuration values:** You should set the script to view-only to people other than you, preventing the accidental modification of key settings by members of your team.

#### The Assessment Records

This is where the assessment data for each class is stored, and the compoent most of your team will use the most. 

#### Overview Sheet

This sheet pulls all the data from the Assessment Records so that you can analyse it as you please. 

## The Setup Process

I've laid out the instructions below according to the order with which they need to be set up.

### Setting up the Langflow Backend

The quickest and easiest way to set up a testing instance is using the [Langflow Cloud Service](TODO: add link). Unless something changes, make sure you use this **for testing only**. This is because I don't believe there are any GDPR guarantees for this service and you don't want to inadvertently send student data to a non-GDPR compliant desintation.

**TODO: Write instructions on how to deploy Langflow to Google Cloud Run in as secure and GDPR compliant way as possible.** 

### Setting up the Google App Script Frontend

This section focuses on the things that a Head of Department will need to set up in advance of their team using the tool. This process involves:

 1. Generating the assessment records for each class.
 2. Configuring the Google Slides Assessor so that it can find the backend.
 3. Setting up the overview sheet so that it can analyse all the data.

#### [Creating the assessment records](settingUpAssessmentRecords.md)

Most of your assessing will happen from these assessment records, with one being created for each class. This tutorial tells you how to set that all up with a minimum (but still a fair bit of) fuss.

#### [Configuring Google Slides AI Assessor](TODO: add later)

Please complete

#### [Setting up the overview sheet] (TODO: add in later)

Please complete

#### Tagging your resources for automated assessment.

Google Slides Assessor needs you to tag the parts of your task that you want assessed. This section shows you how!
