Below is a comprehensive action plan that integrates all the previous discussions, outlining the extended flow, class structure, and responsibilities. The plan details how to evolve the current Slides-based system into one that can also handle Google Docs, using an `AbstractContentManager` superclass, a `DocContentManager` subclass, a `DocParser` class, and optional `MarkdownExporter` and `LLMDocRequestManager` classes. All points discussed are integrated in a single, coherent roadmap.

---

### Action Plan

**Overall Goal:**  
Extend the existing Google Slides AI Assessor (which parses tasks and responses from Slides and then assesses them using an LLM) to also handle Google Docs. The solution should maintain a clean architectural separation of concerns, remain extensible, and reuse existing assessment logic.

---

### Architectural Changes

1. **Introduce an AbstractContentManager Superclass**  
   - **Purpose**: Provide a common interface for extracting tasks and student responses, regardless of the source document type (Slides or Docs).
   - **Key Responsibilities**:
     - Define abstract methods:
       - `extractTasks(referenceDocumentId, emptyDocumentId)`  
       - `fetchStudentSubmissions(courseId, assignmentId)`  
       - `extractStudentResponses(documentId, tasks)`
     - Potentially handle generic logic like interacting with the Classroom API to fetch submissions and filter attachments, while deferring the source-type specifics to subclasses.

2. **Create a DocContentManager Subclass**  
   - **Purpose**: Handle Google Docs as a content source, implementing the abstract methods defined in `AbstractContentManager`.
   - **Key Responsibilities**:
     - `extractTasks()`:
       1. Export the reference and empty Docs to Markdown.
       2. Use `DocParser.parseTasksFromMarkdown(referenceMarkdown, emptyMarkdown)` to get structured tasks.
       3. Return a mapping of `taskTitle` to `Task`.
     - `fetchStudentSubmissions()`:
       1. Query Google Classroom submissions.
       2. Identify Google Docs attachments.
       3. Assign found `documentId` to the correct `StudentTask`.
     - `extractStudentResponses()`:
       1. Export the student’s Doc to Markdown.
       2. Pass the Markdown plus known tasks to `DocParser.parseResponsesFromMarkdown()`.
       3. Store the parsed student responses in `StudentTask`.

3. **Extend the Existing SlideContentManager**  
   - **Change**: Make `SlideContentManager` extend `AbstractContentManager`.
   - **Purpose**: Keep existing Slide-based logic intact, but comply with the abstract interface.
   - **Responsibilities (Unchanged)**:
     - `extractTasks()` uses the existing `extractTasksFromSlides()`.
     - `fetchStudentSubmissions()` filters for Google Slides attachments.
     - `extractStudentResponses()` uses `extractTasksFromSlides()` on student documents to find their responses.

4. **Introduce a DocParser**  
   - **Purpose**: Convert exported Markdown from Docs into structured `Task` objects or student responses, leveraging the LLM for natural language parsing.
   - **Key Responsibilities**:
     - `parseTasksFromMarkdown(referenceMarkdown, emptyMarkdown)`:  
       - Send both Markdown strings to the LLM (via `LLMDocRequestManager` or a parsing endpoint on `LLMRequestManager`).
       - Receive a JSON structure of tasks and convert them into `Task` objects.
     - `parseResponsesFromMarkdown(studentMarkdown, tasks)`:  
       - Send student’s Markdown and known tasks to LLM.
       - Receive a mapping of `taskTitle` → `studentResponse`.
       - Return this mapping for `DocContentManager` to assign to `StudentTask`.

5. **Optional: MarkdownExporter**  
   - **Purpose**: A utility class (purely for formatting tasks and responses as Markdown).
   - **Use Cases**:
     - If needed, `SlideContentManager` can delegate table-to-Markdown conversion to `MarkdownExporter`.
     - Keep Markdown formatting logic standardised between Slides and Docs if the need arises.
   - **Methods**:
     - `formatTableAsMarkdown(rows: string[][])`: Convert extracted table data into a Markdown table.
     - `formatTextAsMarkdown(text: string)`: Ensure uniform text formatting.

   *(This class is optional. If complexity doesn’t warrant it, formatting can remain within the content managers.)*

6. **Optional: LLMDocRequestManager**  
   - **Purpose**: A specialised request manager for parsing tasks and responses from Docs-based Markdown.
   - **Key Responsibilities**:
     - `parseTasks(referenceMarkdown, emptyMarkdown)`: Send request to LLM, return raw JSON.
     - `parseStudentResponses(studentMarkdown, tasks)`: Send request to LLM, return raw JSON.
   - **Benefits**:
     - Keeps parsing requests separate from assessment requests, enabling custom prompts, retry logic, and error handling specifically for parsing Markdown-based content.
   
   *(If not introduced as a separate class, the existing `LLMRequestManager` can be adapted to handle parsing requests as well.)*

---

### Modified Workflow

1. **Assignment Setup**:
   - The `Assignment` class is constructed with `courseId`, `assignmentId`, `referenceDocumentId`, `emptyDocumentId`.
   - Decide `sourceType` (e.g., `"docs"` or `"slides"`) based on the provided documents or configuration.
   - Instantiate `contentManager` as either `DocContentManager` or `SlideContentManager` depending on `sourceType`.

2. **Extracting Tasks**:
   - `assignment.populateTasks()` calls `contentManager.extractTasks(referenceDocumentId, emptyDocumentId)`.
   - For Docs:  
     - `DocContentManager` → `exportDocToMarkdown()` for both reference and empty docs.  
     - `DocParser.parseTasksFromMarkdown()` → Returns `Task[]`.  
     - Convert to a map of `{ [taskTitle]: Task }` stored in `assignment.tasks`.
   - For Slides:
     - `SlideContentManager` uses `extractTasksFromSlides()` as before to populate `assignment.tasks`.

3. **Fetching Student Submissions**:
   - `assignment.fetchSubmittedWork()` calls `contentManager.fetchStudentSubmissions(courseId, assignmentId)`.
   - `AbstractContentManager` or its subclasses determine the correct MIME type and attach `documentId` to `StudentTask`.
   - For Docs, `DocContentManager` finds Google Doc attachments.
   - For Slides, `SlideContentManager` finds Google Slides attachments.

4. **Extracting Student Responses**:
   - `assignment.processAllSubmissions()` calls `contentManager.extractStudentResponses(documentId, tasks)` for each student.
   - For Docs:
     - `DocContentManager` → `exportDocToMarkdown(studentDocId)`.
     - `DocParser.parseResponsesFromMarkdown(studentMarkdown, tasks)`.
     - Assign returned responses to `StudentTask`.
   - For Slides:
     - `SlideContentManager` → `extractTasksFromSlides(studentDocId)` and map responses as before.

5. **Assessment**:
   - `assignment.assessResponses()` uses `LLMRequestManager` to generate assessment requests from tasks and responses.
   - The logic for assessment remains unchanged.
   - The existing caching, retries, and scoring logic applies equally to Docs-based tasks and responses.

---

### Additional Considerations

- **Error Handling**:  
  With Docs, the parsing relies on the LLM interpreting Markdown. If parsing fails, `LLMDocRequestManager` or `DocParser` should handle retries, log errors, or provide fallback instructions.
  
- **Prompt Templates**:  
  `LLMDocRequestManager` might store and manage prompt templates for parsing tasks/responses from Markdown. Versioning these prompts and refining them over time will ensure accurate parsing results.

- **Future Extensibility**:  
  This structure makes it straightforward to add other content types in the future (e.g., CSVs, PDFs). You could introduce `CsvContentManager` or `PdfContentManager` implementing the `AbstractContentManager` methods, and create corresponding parsers.

---

### Summary

This action plan:

- Integrates a new `AbstractContentManager` as a superclass, enabling the `Assignment` class to remain agnostic about the source.
- Introduces `DocContentManager` and `DocParser` to handle Docs → Markdown → Tasks/Responses logic.
- Leverages `LLMDocRequestManager` (optionally) for separate parsing request logic.
- Keeps `SlideContentManager` logic intact, simply making it a subclass of the abstract manager.
- Allows the final assessment pipeline to remain unchanged, ensuring minimal impact on downstream logic.

With these steps, the codebase transitions from a Slides-only workflow to a flexible, source-agnostic system capable of handling both Slides and Docs, all while maintaining a clean separation of concerns and a modular, maintainable architecture.