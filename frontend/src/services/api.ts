const BASE_URL = 'http://localhost:5000/api';

export interface MediaFile {
  id: string;
  filename: string;
  type: string;
  status: string;
  url?: string;
  thumbnailUrl?: string;
  metadata?: any;
  relevanceExplanation?: string;
}

export interface HashtagSuggestion {
  tag: string;
}

export interface PostImprovement {
  suggestion: string;
}

export interface ContentIdea {
  idea: string;
}

export const api = {
  async generatePost(topic: string, format: 'short' | 'long' | 'bullets' = 'short') {
    const res = await fetch(`${BASE_URL}/ai/generate-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: topic, mode: format })
    });
    if (!res.ok) throw new Error('Failed to generate post');
    return res.json();
  },

  async recommendMedia(topic: string): Promise<MediaFile[]> {
    const res = await fetch(`${BASE_URL}/ai/recommend-media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postContext: topic })
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  async suggestHashtags(content: string): Promise<HashtagSuggestion[]> {
    const res = await fetch(`${BASE_URL}/ai/suggest-hashtags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error('Failed to suggest hashtags');
    return res.json();
  },

  async getFiles(query?: { status?: string; type?: string }): Promise<MediaFile[]> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.type) params.append('type', query.type);
    
    const url = `${BASE_URL}/files${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json();
  },

  async uploadFile(file: File): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  },

  async publishPost(payload: {
    content: string;
    hashtags: string[];
    mediaIds: string[];
    aiGenerated: boolean;
  }) {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to publish post');
    return res.json();
  }
};
