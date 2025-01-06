# Using the Assessor

## What you need

Using the Assessor is very straightfoward. To get it to assess a piece of work you need three things:

 1. **The Slide Template**: This is the blank template you'd distribute to your students on Google Classroom.
 2. **The Reference Slides:** This is the completed version of the blank template the Slides Assessor will be comparting the students work against. It should be equivalent to what you would score a `5` for Completeness, Accuracy and SPaG (spelling, punctuation and grammar).
 3. **The students' work**: This should be the same as the blank template, but completed by your students and attached to a Google Classroom Assignment.

## Tagging

For the Assessor to know which parts of the document to assess, the relevant sections need to be 'Tagged'. At the moment, you can tag the following object types to be marked:

 - Text `#`
 - Tables `#`
 - Whole slide images `~`

Tip: Assessing whole slide images is slower and potentially less accurate than Text or Table type assessment so if your task is text or table based only, make sure you tag it as such.

### How to tag an task for assessment

Tip: I recommend creating the *Slide Template* first and tagging that. Make a copy of this and add in your answers to afterwards to create the *Reference Slides*. This will ensure the tagging is consistent.

#### Text or Table Tasks

 1. Open or create the template.
 2. Select the textbox or table you want to assess.
 3. Push `Ctrl` + `Alt` + `Y` to open the formatting options.
 4. Select `Alt Text`.
 5. In the `Description Box` add your tag e.g.
    - `# Task 1 - Fill in the gaps`
    - `# Task 2 - Meaning of life`.

#### Image Tasks

 1. Open or create the template.
 2. Select the textbox or table you want to assess.
 3. Push `Ctrl` + `Alt` + `Y` to open the formatting options.
 4. Select `Alt Text`.
 5. In the `Description Box` add your tag e.g.
    - `~ Task 1 - Complete this diagram`
    - `~ Task 2 - Sequence Block Code`.

**Note:** You can have text, table and image tasks in the same document.

### Distributing tasks to your students

Attach the *Slide Template* to your Google Classroom Assignment as normal.

## Assessing student work

### Prerequesites 

If you've follwed the process above you should have:

 1. **A Slide Template** - this is what your students complete
 2. **Reference Slides** - this is a completed version of the *Slide Template* which would score a `5` for completeness, accuracy and SPaG. 
 3. **A Google Classroom assignment with the *Slide Template* attached for the students to complete** - remember to get students to complete at least some of the task first!

If you're missing any of these components, go back and do those first.

### Getting the Slide IDs

You will need the *Reference Slides* and *Slide Template* IDs to assess the piece of work. To get these you need to:

 1. Open each document.
 2. Select the part of the URL after the `/d/` and before the `/edit`. 
   - E.g. `https://docs.google.com/presentation/d/THIS_BIT_IS_THE_SLIDE_ID/edit#slide=id.g2addc53a3a4_0_188`
 3. Copy that part of the string.

**Tip:** You only need to do this once for assignments of the same name. Therefore, encourage everyone in the department to name their assignments consistently.

**Note:** While this process is finicky and labourious, implementing a GUI method of this would require access to the `PickerAPI`. API access is blocked for most educational accounts.

### The Assessment Process

 1. Open the Assessment Record Google Sheet for the class you want to assess.
 2. Click `Assessment Bot` from the Menu at the top of the screen.
 3. Click `Assess Student Work`.
 4. Select the Assignment you want to assess and click `Go`.
 5. Enter the Slide IDs for the *Reference* (top) and *Template* (bottom) [which you got earlier](#getting-the-slide-ids) and click `Go`.
 6. Wait patiently - an assessment run can take anywhere between 2 and 10 minutes depending on the size and complexity of the document. Image tasks take *a lot* longer than text and table tasks.
 7. Once the process is complete, you should have a lovely RAG coloured table of all the students work.

