// ─── Prompt Templates ────────────────────────────────────────────────────────

export function buildGeneratePostPrompt(topic: string): string {
  return `
You are an AI content assistant for T-World, a professional social media and content platform.

A user wants to create a social media post about the following topic:
"${topic}"

Return ONLY a valid JSON object (no markdown, no code fences) with exactly these three fields:
{
  "short": "A concise, engaging post of 1–2 sentences suitable for Twitter/X.",
  "long": "A detailed, professional post of 3–5 sentences with context and insight.",
  "bullets": ["First key point", "Second key point", "Third key point"]
}

Requirements:
- Professional, engaging tone
- Relevant to the topic
- No hashtags in the output (they are added separately)
- Return ONLY the JSON object, nothing else
`.trim();
}

export function buildImprovePostPrompt(content: string, instruction: string): string {
  return `
You are an AI content assistant for T-World.

The user wants to "${instruction}" the following post content:
"${content}"

Return ONLY a valid JSON object:
{
  "content": "The improved version of the post"
}

Requirements:
- Keep the core message intact unless rewriting
- Professional and engaging tone
- Return ONLY the JSON object, nothing else
`.trim();
}

export function buildHashtagPrompt(content: string): string {
  return `
You are an AI content assistant for T-World.

Suggest relevant hashtags for this post:
"${content}"

Return ONLY a valid JSON object:
{
  "hashtags": ["#example1", "#example2", "#example3", "#example4", "#example5"]
}

Requirements:
- 3–7 hashtags maximum
- Relevant to the content
- Include the # symbol
- Return ONLY the JSON object, nothing else
`.trim();
}

export function buildMediaRecommendationPrompt(postContext: string, files: Array<{ id: string; filename: string; description: string; tags: string[]; type: string }>): string {
  const fileList = files.map(f =>
    `- ID: ${f.id} | File: ${f.filename} | Type: ${f.type} | Tags: ${f.tags.join(', ')} | Description: ${f.description}`
  ).join('\n');

  return `
You are an AI content assistant for T-World.

The user is writing a post about:
"${postContext}"

Here are the available approved media files:
${fileList}

Analyse which files are relevant to the post context. Rank them by relevance.

Return ONLY a valid JSON object:
{
  "recommendations": [
    {
      "fileId": "the file id",
      "filename": "the filename",
      "relevanceScore": 0.95,
      "reason": "Short explanation of why this file is relevant"
    }
  ]
}

Rules:
- Only include files that are genuinely relevant (score >= 0.5)
- If no files are relevant, return { "recommendations": [] }
- relevanceScore must be between 0 and 1
- Return ONLY the JSON object, nothing else
`.trim();
}
