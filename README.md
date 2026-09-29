# T-World AI-Assisted Post Creation

This repository contains the complete assessment solution for the T-World AI Engineering & Agent Development project.

## Architecture

The project consists of two main parts:
1. **Frontend**: A React + TypeScript + Tailwind CSS application focused on a clean, single-page "Create Post" experience.
2. **Backend**: A Node.js + Express + TypeScript API that interfaces with MongoDB for logging and file storage, and OpenAI for LLM-based generation.

## Setup Instructions

### Backend (Server)
1. `cd server`
2. `npm install`
3. Create a `.env` file with your `OPENAI_API_KEY` and `MONGODB_URI`.
4. Run `npm run dev` to start the server on port 3000.

### Frontend (Client)
1. `cd frontend`
2. `npm install`
3. Run `npm run dev` to start the Vite server.

## API Endpoints

- `POST /ai/generate-post`: Generates short, long, and bulleted content using the LLM.
- `POST /ai/recommend-media`: Ranks and retrieves approved files relevant to the post context.
- `POST /ai/suggest-hashtags`: Suggests hashtags based on content.
- `GET /files`: Retrieves files (can filter by `status=approved` or `type`).
- `POST /files/upload`: Uploads a file, setting initial status to `initiated`.

## File Lifecycle & Storage
Files undergo a moderation flow: `initiated -> scanning -> approved/rejected`. 
For local development, files are handled using `multer`. In production, this abstraction should be replaced with AWS S3 (`storageKey` references the bucket object).

## LLM & Logging
Generative AI calls are managed by a dedicated `LLMService` to abstract provider details and implement cost-aware model selection. All requests and their metadata (latency, tokens) are logged to MongoDB via the `AILog` model.
