# T-World — AI-Powered Files, Docs & Smart Posting

AI-assisted post creation system built for the **Tongston AI Engineering & Agent Development Technical Assessment**.

## Features

* AI post generation using Google Gemini
* Short, long, and bullet-point content
* Post improvement and regeneration
* AI hashtag suggestions
* Real file upload and drag & drop
* Files & Docs integration
* Approved-file filtering
* AI-powered media recommendations
* MongoDB persistence
* AI request logging
* Structured AI output validation
* Production-oriented error handling

## Tech Stack

* **Frontend:** React + TypeScript
* **Backend:** Node.js + Express + TypeScript
* **Database:** MongoDB + Mongoose
* **AI:** Google Gemini
* **Storage:** Local development storage with AWS S3-ready architecture

## Architecture

```text
Frontend
   ↓
Express API
   ↓
AI Services
   ↓
Gemini
   ↓
Validation
   ↓
MongoDB
```

Media recommendations:

```text
Post Context
   ↓
Approved Files
   ↓
Metadata Retrieval
   ↓
Relevance Ranking
   ↓
Recommendations
```

## Gemini Configuration

The development model is:

```text
gemini-2.5-flash-lite
```

Environment variables:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
MONGODB_URI=
PORT=5000
```

API keys and database credentials are kept server-side and are not committed to Git.

## Main APIs

```text
POST /api/ai/generate-post
POST /api/ai/improve-post
POST /api/ai/suggest-hashtags
POST /api/ai/recommend-media

GET  /api/files
GET  /api/files?status=approved
POST /api/files/upload
```

## File Moderation

```text
initiated
    ↓
scanning
    ↓
approved / rejected
```

Only **approved** files can be attached or recommended.

## AI Flow

```text
User Prompt
    ↓
AI Service
    ↓
Gemini
    ↓
Structured Output
    ↓
Validation
    ↓
Frontend
```

## Production Considerations

The architecture is designed to support:

* AWS S3
* Model routing/fallback
* Embeddings and vector search
* Monitoring and logging
* Rate limiting
* Stronger authentication and authorization

## Setup

```bash
git clone https://github.com/CyberMindX-AI/tworld-ai-assessment.git
cd tworld-ai-assessment
```

Install dependencies in `backend` and `frontend`, configure `.env`, then run the development servers.

## Author

**Darasimi Makinde**

AI / Backend / Full-Stack Developer

Built for the **Tongston AI Engineering & Agent Development Technical Assessment**.
