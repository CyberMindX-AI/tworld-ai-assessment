# T-World AI Post Creation — System Design & Production Reflection

## Architecture
UI → Express API → AI orchestration → approved-file retrieval/ranking → MongoDB/file metadata → structured response → UI.

The AI layer is deliberately separated from retrieval. The recommendation service receives post context, but its candidate set is first restricted to `status=approved`. This makes moderation a backend security boundary rather than a frontend convention.

## AI workflow
1. Validate user input.
2. Build a controlled prompt.
3. Inject the post topic/context.
4. Call an API-based LLM when configured.
5. Parse the response into a strict schema.
6. Return short, long, bullet, hashtag, improvement and related-idea fields.
7. On provider failure, timeout or malformed output, return a deterministic fallback instead of a broken UI.

## Retrieval/ranking
The assessment's required metadata retrieval is implemented first. Query tokens are compared against file names and tags. Matching terms receive the strongest weight; relevant image media gets a small type boost. Only approved assets enter the ranking function.

A production version can add embeddings/vector search for semantic matching and combine vector similarity with metadata, recency, permissions and user history.

## Model strategy / cost
The demo assumes a small API model for normal generation because post drafting is a latency-sensitive product action. A premium model could be reserved for difficult rewriting or high-value content workflows. Hashtag extraction can remain deterministic or use a lightweight model. A small/open-source model could later handle classification, tagging or ranking where privacy, volume and inference cost justify self-hosting.

Open-source deployment introduces model hosting, GPU/CPU capacity, licensing and operational overhead. API models reduce infrastructure work but create provider cost, network latency and data-governance considerations.

## AWS/S3 assumptions
The existing platform owns the upload/moderation workflow. The post composer should reference approved S3-backed assets rather than re-uploading local files. The API stores metadata and references, while AWS handles object storage and the existing moderation workflow handles approval state.

## Production reflection
### 1. Most fragile part
Recommendation relevance is the most fragile part: metadata can be incomplete and keyword matching can produce false positives. Production should combine embeddings, richer tagging and evaluation data.

### 2. Monitor first
Monitor AI latency, provider errors/timeouts, fallback rate, recommendation click/selection rate, empty-result rate, and rejected-file leakage. Rejected-file leakage should be treated as a high-severity correctness/security event.

### 3. Improve before production
Add authentication/authorization, real user/file ownership boundaries, durable queues where appropriate, richer observability, automated tests, rate limiting, prompt/version tracking, content safety controls and retrieval evaluation.

### 4. Assumptions to validate
The exact Files & Docs API contract, user permission model, AWS S3 object access method, moderation state transitions, frontend component interfaces, supported post types, and which LLM providers are approved by the product team.

### 5. Engineer handover
A successor needs to understand the API contracts, approved-file invariant, retrieval scoring, AI schema/prompt versions, environment variables, failure/fallback behaviour and the boundary between the existing AWS upload pipeline and this service.

### 6. Most expensive at scale
LLM generation is likely to dominate variable cost and latency. Embedding large libraries can also become significant. Retrieval should therefore narrow candidates before expensive model calls.

### 7. Model selection
Choose based on quality requirement, latency target, data sensitivity, volume, total cost, licensing and deployment constraints. Start with the smallest model that meets the quality bar and measure before routing more traffic to a premium model.

### 8. Routing/fallback location
Model routing belongs inside the AI service/orchestration layer, behind a stable application-level interface. The controller should not know which provider/model is used.

### 9. Merge readiness
Before merging into a real repository: align with its auth/session model, existing database conventions, AWS file identifiers, frontend API client, logging/observability stack, test framework, lint rules, environment management and CI pipeline.
