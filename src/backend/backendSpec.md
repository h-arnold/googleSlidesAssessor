- [1. Overview](#1-overview)
- [2. Functional Requirements](#2-functional-requirements)
- [3. High-Level Architecture](#3-high-level-architecture)
- [4. Detailed Component Specification](#4-detailed-component-specification)
    - [4.1 `app.ts`](#41-appts)
    - [4.2 `index.ts`](#42-indexts)
    - [4.3 `config/config.ts`](#43-configconfigts)
    - [4.4 `middlewares/authMiddleware.ts`](#44-middlewaresauthmiddlewarets)
    - [4.5 `routes/`](#45-routes)
    - [4.6 `controllers/analysisController.ts`](#46-controllersanalysiscontrollerts)
    - [4.7 `controllers/healthController.ts`](#47-controllershealthcontrollerts)
    - [4.8 `services/analysisService.ts`](#48-servicesanalysisservicets)
    - [4.9 `services/langchainService.ts`](#49-serviceslangchainservicets)
    - [4.10 `flows/`](#410-flows)
    - [4.11 `prompts/`](#411-prompts)
    - [4.12 `utils/promptLoader.ts`](#412-utilspromptloaderts)
    - [4.13 `utils/logger.ts`](#413-utilsloggerts)
    - [4.14 `utils/errorHandler.ts`](#414-utilserrorhandlerts)
    - [4.15 `tests/`](#415-tests)
- [5. Deployment \& Runtime Specification](#5-deployment--runtime-specification)
- [6. Security Considerations](#6-security-considerations)
- [7. Monitoring and Logging](#7-monitoring-and-logging)
- [8. Testing Strategy](#8-testing-strategy)
  - [Final Notes](#final-notes)


# 1. Overview

The **Google Slides Assessor** program is a Node.js + Express server designed to handle requests from Google Apps Script and evaluate user-provided content (e.g., Google Slides or textual documents) using **LangChain**. The program supports multiple “flows” (also known as chains) depending on the document type. Each flow retrieves its prompt from a Markdown file, invokes an LLM (Large Language Model) via LangChain, and returns a structured response.

Key Features:
1. **Multiple LangChain Flows**: Choose the correct flow based on document type.  
2. **Markdown-Based Prompts**: Easy to maintain, version, and read.  
3. **JWT Authentication**: Secure access to the API for authorised clients (e.g., your Google Apps Script).  
4. **Scalability**: Runs in containers on Google Cloud Run or Kubernetes, with automatic horizontal scaling based on demand.

---

# 2. Functional Requirements

1. **Document Analysis Endpoint**  
   - **Input**: A document type (e.g., “slides” or “doc”), plus any relevant text/data extracted by Google Apps Script.  
   - **Process**:  
     1. Identify which flow to call (e.g., `slideFlow` or `docFlow`).  
     2. Read the appropriate Markdown prompt and inject the user’s data.  
     3. Call the LangChain chain to generate a response.  
     4. Return the analysis or structured result in JSON format.  
   - **Output**: JSON object containing the LLM’s analysis or summary of the content.

2. **Health Check Endpoint**  
   - **Input**: None.  
   - **Process**: Verify service is running and accessible.  
   - **Output**: Simple status JSON (e.g., `{ status: "ok" }`).

3. **Authentication**  
   - **JWT Required**: Incoming requests must supply a valid JWT token in the `Authorization` header.  
   - **Invalid Token**: The system responds with 401 (Unauthorised).  

4. **Error Handling**  
   - **Invalid Input**: If the document type is unrecognised or data is missing, respond with 400 (Bad Request).  
   - **LLM Errors**: If the LLM or chain fails, respond with 500 (Internal Server Error), logging the exception internally.

5. **Performance Goals**  
   - **Typical Response Time**: Under 1 second for simple queries; a few seconds if the LLM flow is more complex.  
   - **Scalability**: The system should handle multiple concurrent requests (if the Cloud Run concurrency is >1 or multiple Kubernetes pods are running).

---

# 3. High-Level Architecture

```
+---------------+                +-------------------+
| Google Apps   |  (HTTP)       |  Node.js Service  |
| Script        | ----------->  |  (Express + JWT)  |
+---------------+               |  +---------------+ |
                                |  | Controller    | |
                                |  |  +-----------+ |----> Invokes flows
                                |  | Service      | |
                                +--+---------------+
                                   ^      |
                                   |      | 
                      Calls LLM  <--------+---->  LangChain (JS/TS)
                                   |
                                   |
                     Reads         |
            Markdown-based prompts |
                                   v
                                /prompts
```

1. **Google Apps Script**  
   - Sends HTTP requests (with JWT tokens) to the Node.js service endpoints.  
2. **Node.js + Express**  
   - Validates JWT.  
   - Routes requests to the relevant controller.  
3. **Controllers**  
   - Orchestrate the service logic.  
4. **Services**  
   - House the main application logic; interact with **LangChain** flows.  
5. **Flows (LangChain)**  
   - Defined for each document type (e.g., `slideFlow.ts`, `docFlow.ts`).  
   - Read prompts from Markdown files in the `/prompts` directory.  
   - Call the configured LLM.  
6. **Markdown Prompts**  
   - Files are stored under `/src/prompts/*.md` and loaded at runtime.  

---

# 4. Detailed Component Specification

Below is a recommended directory structure (slightly adapted from previous discussions), with each component’s purpose clearly described.

```
my-google-slides-assessor/
├── package.json
├── tsconfig.json
├── .eslintrc.js             
├── .prettierrc              
├── .env                     
├── README.md
└── src/
    ├── app.ts              
    ├── index.ts            
    │
    ├── config/
    │   └── config.ts       
    │
    ├── middlewares/
    │   └── authMiddleware.ts   
    │
    ├── routes/
    │   └── index.ts       
    │   └── analysis.ts     
    │   └── health.ts       
    │
    ├── controllers/
    │   └── analysisController.ts  
    │   └── healthController.ts    
    │
    ├── services/
    │   └── analysisService.ts     
    │   └── langchainService.ts    
    │
    ├── flows/
    │   └── index.ts        
    │   └── slideFlow.ts    
    │   └── docFlow.ts      
    │
    ├── prompts/
    │   └── slide-analysis.md
    │   └── doc-analysis.md
    │
    ├── utils/
    │   └── promptLoader.ts 
    │   └── logger.ts       
    │   └── errorHandler.ts 
    │
    └── tests/
        └── analysis.spec.ts
```

### 4.1 `app.ts`
- **Purpose**:  
  - Initialise the Express application.  
  - Apply global middlewares (e.g., `express.json()`, `logger`).  
  - Mount the main router (`/src/routes/index.ts`).
- **Key Exports**: The configured Express `app`.

### 4.2 `index.ts`
- **Purpose**:  
  - The application entry point.  
  - Imports `app` from `app.ts` and starts listening on a specified port.  
- **Key Steps**:  
  1. Read config from `.env` or environment variables.  
  2. `app.listen(PORT, ...)`.

### 4.3 `config/config.ts`
- **Purpose**:  
  - Centralise reading environment variables (e.g., `PORT`, `JWT_SECRET`, LLM keys).  
  - Provide typed constants to the rest of the system.
- **Example**:
  ```ts
  import dotenv from 'dotenv';
  dotenv.config();

  export const PORT = process.env.PORT || 3000;
  export const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret';
  export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
  ```

### 4.4 `middlewares/authMiddleware.ts`
- **Purpose**:  
  - Check the `Authorization: Bearer <token>` header.  
  - Validate JWT with `jsonwebtoken.verify()`.  
  - Return `401` if invalid.
- **Usage**:  
  - Applied to all protected routes (like the analysis endpoint).

### 4.5 `routes/`
- **`index.ts`**  
  - Combines all route modules. For example:
    ```ts
    import { Router } from 'express';
    import analysisRouter from './analysis';
    import healthRouter from './health';

    const router = Router();
    router.use('/analysis', analysisRouter);
    router.use('/health', healthRouter);

    export default router;
    ```

- **`analysis.ts`**  
  - Defines the route(s) for document/slide analysis (`POST /analyse-document`, etc.).
  - Applies the `authMiddleware` if needed.

- **`health.ts`**  
  - Defines a simple route to check the server’s health (`GET /health`).

### 4.6 `controllers/analysisController.ts`
- **Purpose**:  
  - Orchestrate the analysis process for inbound requests.  
  - Extract necessary parameters (document type, text content, etc.).  
  - Call `analysisService` to perform the actual logic.  
  - Send back the result in JSON.

- **Example**:
  ```ts
  import { Request, Response } from 'express';
  import { runAnalysis } from '../services/analysisService';

  export async function analyseDocument(req: Request, res: Response) {
    try {
      const { documentType, content } = req.body;
      const analysisResult = await runAnalysis(documentType, content);
      return res.json({ result: analysisResult });
    } catch (err) {
      // Return a structured error response
      return res.status(500).json({ error: 'Analysis failed' });
    }
  }
  ```

### 4.7 `controllers/healthController.ts`
- **Purpose**:  
  - Return a simple status to confirm the service is up and running.  
- **Example**:
  ```ts
  import { Request, Response } from 'express';

  export function healthCheck(req: Request, res: Response) {
    return res.json({ status: 'ok' });
  }
  ```

### 4.8 `services/analysisService.ts`
- **Purpose**:  
  - Main service logic for handling analysis requests.  
  - Decides which flow to call based on `documentType`.  
  - Interacts with `langchainService` for any shared LLM configurations.

- **Example**:
  ```ts
  import { runSlideFlow } from '../flows/slideFlow';
  import { runDocFlow } from '../flows/docFlow';

  export async function runAnalysis(documentType: string, content: string) {
    switch (documentType) {
      case 'slides':
        return await runSlideFlow(content);
      case 'doc':
        return await runDocFlow(content);
      default:
        throw new Error('Unsupported document type');
    }
  }
  ```

### 4.9 `services/langchainService.ts`
- **Purpose**:  
  - Configure or initialise shared LangChain objects (e.g., LLM clients).  
  - Provide a common place to store LLM keys or handle logic that’s repeated across multiple flows.

- **Example**:
  ```ts
  import { OpenAI } from 'langchain';

  export const openAIApi = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
  });
  // Additional configuration or helper functions
  ```

### 4.10 `flows/`
- **Example**: `slideFlow.ts` or `docFlow.ts`
- **Purpose**:  
  - Define the chain logic for each document type.  
  - Load the relevant Markdown prompt.  
  - Use the LLM client from `langchainService`.  
  - Return the chain’s result (text or JSON).

- **Simple Implementation**:
  ```ts
  import { openAIApi } from '../services/langchainService';
  import { loadPrompt } from '../utils/promptLoader';

  export async function runSlideFlow(content: string): Promise<string> {
    const promptTemplate = await loadPrompt('slide-analysis.md');
    const prompt = promptTemplate.replace('{{content}}', content);

    const response = await openAIApi.call({
      prompt,
      maxTokens: 1000,
    });

    return response; // or parse as needed
  }
  ```

### 4.11 `prompts/`
- **Purpose**:  
  - Stores Markdown prompt files for each flow. For example, `slide-analysis.md` might contain:
    ```
    You are an expert at analysing slide presentations.
    Given the content below, summarise key points:
    {{content}}
    ```
- **File Usage**:
  - Use a helper (e.g., `promptLoader.ts`) to read these files synchronously or asynchronously.

### 4.12 `utils/promptLoader.ts`
- **Purpose**:  
  - Provides a function to read `.md` files from the `prompts` directory.  
  - Handles any templating or variable replacement logic.

- **Example**:
  ```ts
  import fs from 'fs';
  import path from 'path';

  export async function loadPrompt(filename: string): Promise<string> {
    const filePath = path.join(__dirname, '..', 'prompts', filename);
    return fs.promises.readFile(filePath, 'utf-8');
  }
  ```

### 4.13 `utils/logger.ts`
- **Purpose**:  
  - Configure logging (e.g., using `winston` or `pino`).  
  - Provide a consistent interface for logging errors, info, etc.

### 4.14 `utils/errorHandler.ts`
- **Purpose**:  
  - A central Express error-handling middleware, if you prefer to funnel all errors through a common function.  
  - Could log errors and return uniform responses to the client.

### 4.15 `tests/`
- **Purpose**:  
  - Houses test files.  
  - **Unit Tests**: Validate each flow, prompt-loading logic, etc.  
  - **Integration Tests**: Test the entire request/response cycle using a tool like **Supertest**.  
  - **Mocking**: Mock the LLM responses to avoid cost and unpredictability.

---

# 5. Deployment & Runtime Specification

1. **Dockerfile**  
   - Your container image should install dependencies, build TypeScript, and run `npm start`.  
2. **Google Cloud Run** (or **Kubernetes**)  
   - Configure environment variables for `JWT_SECRET`, `OPENAI_API_KEY` in a secure manner.  
   - Set concurrency if desired. For short requests, concurrency >1 is typically fine.  
   - Auto-scaling will spin up more container instances as load grows.

---

# 6. Security Considerations

1. **JWT**  
   - Use robust secret management (e.g., do not commit your JWT secret).  
   - Rotate secrets periodically if required.  
2. **Transport Security**  
   - Always use HTTPS in production (Cloud Run or a Kubernetes Ingress with TLS).  
3. **Rate Limiting** (Optional)  
   - If you expect a high request volume or want to guard against misuse, implement a rate limiter like `express-rate-limit`.

---

# 7. Monitoring and Logging

1. **Logging**  
   - Capture all incoming requests (method, path, status code).  
   - Log LLM errors or unexpected chain failures in detail.  
2. **Monitoring**  
   - Consider integrating with Google Cloud Logging or a third-party tool (Datadog, New Relic, etc.).  
3. **Alerts**  
   - Use an error tracking service (e.g., Sentry) for immediate notifications on exceptions.

---

# 8. Testing Strategy

1. **Unit Tests**  
   - Each flow function should be tested to ensure correct prompt loading and LLM calls.  
   - Mock the LLM response for consistency.  
2. **Integration Tests**  
   - Use **Supertest** to spin up an Express server and test full endpoints (analysis, health).  
   - Validate JWT authentication (requests without or with invalid tokens should fail).  
3. **Continuous Integration**  
   - Run tests automatically on push/merge.  
   - Optionally, measure coverage with tools like **Istanbul**/**nyc**.

---

## Final Notes

- This specification aims to balance clarity, maintainability, and scalability.  
- By placing flows in separate files, you can easily add more analysis types (e.g., PDF flow, spreadsheet flow) in the future.  
- Maintaining prompts in Markdown keeps them version-controlled and user-friendly.  
- JWT authentication and container-based scaling (Cloud Run/Kubernetes) give you a robust, stateless architecture from day one.

With this detailed specification, you have a strong foundation for implementing the Google Slides Assessor service. You can refine as you discover new requirements or edge cases, but the outlined structure and components should cover the core functionality and design patterns for a maintainable, scalable LLM-driven application.