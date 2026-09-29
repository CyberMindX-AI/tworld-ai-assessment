# T-World AI-Assisted Post Creation System
## Assessment Submission Documentation

This document fulfills the written deliverables for the T-World AI Engineering Assessment, including the System Design, Model & Cost Reflection, and Production Readiness Note.

---

### 1. System Design & Architecture

**Architecture Overview**
The system follows a classic decoupled architecture:
1. **Frontend**: React (TypeScript) SPA that manages application state, composer UI, and media selection.
2. **Backend**: Node.js + Express API. It strictly separates concerns:
   - `routes/`: Express route definitions
   - `controllers/`: HTTP request/response parsing
   - `services/`: Core business logic (`ai.service`, `file.service`)
   - `models/`: Mongoose MongoDB schemas
3. **AI Layer**: Google Gemini API integration (abstracted behind an LLM service interface).
4. **Database**: MongoDB (Atlas) for persisting Posts, File metadata, and AI operational logs.

**AI Workflow & Prompt Strategy**
- **Generation**: The prompt strategy uses a strong system instruction that defines the AI's persona as a professional content creator. It forces the output into a strict JSON schema using structured prompting, ensuring the frontend always receives reliable data formats (Short, Long, Bullets).
- **Context Injection**: When users attach media, the AI is aware of the file metadata, allowing it to tailor the post text to the specific attachments.
- **Retrieval & Ranking**: The media recommendation engine uses a keyword-based overlap algorithm. It extracts keywords from the user's draft post and matches them against the `tags` and `name` of *approved* files in the database.

**AWS / S3 Assumptions**
The system assumes that files are uploaded directly to S3 (e.g., via presigned URLs). The backend MongoDB only stores the *metadata* (URL, storageKey, mimetype, approval status). The AI and retrieval layers operate entirely on this metadata, never needing to parse the heavy binary files directly.

**GitHub-Ready Structure**
The codebase is structured for easy handover. Shared TypeScript interfaces ensure frontend/backend contract alignment. Error handling is centralized in a middleware layer, and the AI logic is completely isolated so it can be swapped out without touching the API routes.

---

### 2. Model, Cost & Compute Strategy

**Model Choice**
- **Assumed Model**: `gemini-3.5-flash-lite` (via Google GenAI API). This is a highly efficient, fast, and cost-effective model perfect for standard text generation and metadata matching.
- **Premium Model Justification**: If the system needed to analyze complex images (multimodal) or generate deep, long-form technical articles from scratch, routing to a heavier premium model (like GPT-4o or Gemini 1.5 Pro) would be justified.
- **Open-Source / Lightweight Alternatives**: The media recommendation and hashtag generation tasks do *not* strictly require an external API. A lightweight, locally hosted model (e.g., Llama 3 8B or Mistral) running on internal AWS compute could easily handle hashtag extraction and basic semantic matching. This would drastically reduce API costs and latency for simple tasks, preserving the external API budget for complex post drafting.
- **Cost Awareness**: The architecture tracks token usage in the `AILog` MongoDB collection, allowing the product team to monitor exactly how much the AI feature is costing per user.

---

### 3. Production Readiness Reflection

**1. What is the most fragile part of the solution?**
The reliance on external LLM APIs for structured JSON output. If the model hallucinates or breaks the JSON schema, the frontend parsing will fail. We mitigate this with fallback UI states, but it remains a fragility.

**2. What would you monitor first after launch?**
The `AILog` collection — specifically looking at latency, error rates (timeouts), and token usage to ensure costs remain within budget and the UX remains snappy.

**3. What would you improve first before calling it production-ready?**
Implementing true Semantic Vector Search (e.g., Pinecone or pgvector) instead of keyword matching for media retrieval, and adding rate-limiting to the AI endpoints to prevent abuse.

**4. What assumptions need validation?**
The assumption that users want AI to rewrite their *entire* post. The product team should validate if users prefer inline autocomplete (Copilot style) rather than full-post generation.

**5. Handover requirements?**
A successor engineer would need to understand the Express error-handling flow and the specific JSON schemas the frontend expects from the AI service.

**6. Most compute-intensive part at scale?**
The media recommendation engine. If the system scales to millions of files, performing realtime text-matching on every keystroke will crash the database. It must be moved to an optimized search index (ElasticSearch/Vector DB).

**7. API vs. Open-Source decision logic?**
Privacy and cost. If T-World processes sensitive enterprise documents, we cannot send them to a closed API. We would route those specific context-heavy prompts to a self-hosted open-source model.

**8. Where does model routing sit?**
It sits entirely within `services/ai/`. The controller just asks for `generatePost()`. The AI service inspects the user tier or prompt complexity and decides whether to invoke the local Llama model or the external Gemini API.

**9. GitHub merge prerequisites?**
Adding automated unit tests (Jest) for the retrieval logic, and CI/CD pipelines to ensure TypeScript compiles cleanly before deployment.

---

### 4. Sample Outputs & Fallback Scenarios

**Example Prompt**: "How AI is changing education in Africa"
**Generated Output (Short)**: "Artificial intelligence is rapidly transforming industries across Africa, driving unprecedented innovation from Lagos to Nairobi. Discover how local talent and homegrown solutions are shaping a smarter future."

**Handling Weak Input**: If a user types just "test", the prompt orchestration wraps it with system instructions to expand it into a generic but professional post about testing and validation.
**Handling Failure**: If the API times out or the DB disconnects, the system utilizes a graceful failsafe, returning a hardcoded, highly relevant fallback structure so the user is never stuck with a broken UI. Rejected files are strictly filtered at the database query level (`status: 'approved'`), guaranteeing they never enter the AI context window.
