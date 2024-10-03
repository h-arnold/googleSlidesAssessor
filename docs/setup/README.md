# How to set up the Google Slides Assessor

- [How to set up the Google Slides Assessor](#how-to-set-up-the-google-slides-assessor)
  - [Prerequisites](#prerequisites)
  - [The Main Google Slides Assessor Components](#the-main-google-slides-assessor-components)
    - [The Langflow Backend](#the-langflow-backend)
    - [Google Slides Assessor Library](#google-slides-assessor-library)
    - [Assessment Record Generator](#assessment-record-generator)
    - [Assessment Record Template](#assessment-record-template)
  - [Setting up Google Slides Assessor](#setting-up-google-slides-assessor)
    - [Creating the assessment records](#creating-the-assessment-records)
    - [Setting up Langflow](#setting-up-langflow)


At this stage in its development, Google Slides Assessor needs a fair bit of work to get it set up. Once it's up and running though, it's easy to keep a track of it.

## Prerequisites
 - **A langflow instance:** this is the backend that does the assessment of the student's work. At some point I will be offering a hosted solution at cost.
 - **An LLM API Key:** I currently use Google Gemini Flash 1.5 and GPT4o-mini due to their price/performance ratio.
- **A Google Workspace for Education Account:** and active Google Classrooms from which to pull your students' Google Slides documents.

## The Main Google Slides Assessor Components

### The Langflow Backend

Langflow provides the AI services to the Google App Scripts. As well as making it much easier to create complex flows than it would be by interacting with the LLM providers APIs directly, it also makes it really easy to change providers and prompts as the AI landscape changes.

### Google Slides Assessor Library

This Google Script holds most of the client side code for processing and displaying assessment data. The Assessment Record template calls this library rather than containing a copy of the code so that you can update the Google Slides Assessor without having to update each class' sheet.

### Assessment Record Generator

This Google Sheet will either create or get your existing Google Classrooms and make a copy of the Assessment Record Template with the required details for each class. 

### Assessment Record Template

This document holds the Assessment Record for each class. When you do an Assessment Run, the assessment data is stored here.

## Setting up Google Slides Assessor

**Important:** you need to follow these instructions in the order that they're given exactly. Missing a step could result in it not working.

### [Creating the assessment records](settingUpAssessmentRecords.md)

Most of your assessing will happen from these assessment records, with one being created for each class. This tutorial tells you how to set that all up with a minimum (but still a fair bit of) fuss.

### Setting up Langflow

There are lots of ways you can set up and use Langflow. I personally host it using Google Cloud Run because it allows me to scale up to 33 instances (enough to process an entire class' worth of slides concurrently). I will share my deployment instructions at some point but in the meantime, please refer to the 'deployment' section of the Langflow Docs.
Once your Langflow instance is up and running, follow the instructions below to set up the Google Slides Assessor with your Langflow instance.
