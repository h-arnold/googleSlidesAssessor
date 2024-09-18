# App Script Frontend Files

This folder contains the Google App Script code for the three frontend components to the Google Slides Assessor:

    -   The Assessment Record Creator
    -   The Google Slides Assessor
    -   The Department Overview Sheet

## The Assessment Record Creator
This script gets or creates your existing Google Classroom and once that's done, it populates a folder with Assessment Record spreadsheets, one for each class. Each sheet contains a link to the library file containing the Google Slides Assessor Code.

## The Google Slides Assessor
This is the script that does the bulk for the work. It's held as a single library App Script file which is called by each of the Assessment Record sheets. It collates, and parses the data from the Google Classroom assignments, sends it to the langflow backend and then processes the results so you get a pretty spreadsheet.

## The Department Overview Sheet
As a Head of Department, this sheet is super useful for me. It pulls the contents of the 'Overview' sheets with in the Asessment Records for each year group, allowing me to analyse performance data for the whole year group.