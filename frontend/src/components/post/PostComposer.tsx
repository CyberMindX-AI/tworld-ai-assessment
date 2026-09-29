import { useState } from 'react';
import { Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import type { MediaFile, HashtagSuggestion, PostImprovement, ContentIdea } from '../../services/api';

interface PostComposerProps {
  content: string;
  setContent: (content: string) => void;
  media: MediaFile[];
  setMedia: React.Dispatch<React.SetStateAction<MediaFile[]>>;
  onAttachMedia: () => void;
  onPreview: () => void;
  setHashtags: (tags: HashtagSuggestion[]) => void;
  setImprovements: (improvements: PostImprovement[]) => void;
  setIdeas: (ideas: ContentIdea[]) => void;
  setIsAiLoading: (loading: boolean) => void;
  onAiGenerated: () => void;
}

export default function PostComposer({ 
  content, setContent, media, setMedia, onAttachMedia, onPreview,
  setHashtags, setImprovements, setIdeas, setIsAiLoading, onAiGenerated
}: PostComposerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async (format: 'short' | 'long' | 'bullets' = 'short') => {
    if (!content.trim()) return;
    setIsGenerating(true);
    setError('');
    setIsAiLoading(true);
    
    try {
      const res = await api.generatePost(content, format);

      // The backend returns { short, long, bullets[] }
      let generated = '';
      if (format === 'bullets' && Array.isArray(res.bullets)) {
        generated = res.bullets.map((b: string) => `• ${b}`).join('\n');
      } else if (format === 'long') {
        generated = res.long || res.short || '';
      } else {
        generated = res.short || res.long || '';
      }

      setGeneratedContent(generated);
      onAiGenerated();
      
      try {
        const tagsRes = await api.suggestHashtags(content);
        // Backend returns { hashtags: string[] }
        const normalized = Array.isArray(tagsRes)
          ? tagsRes
          : (tagsRes as any).hashtags?.map((t: string) => ({ tag: t })) ?? [];
        setHashtags(normalized);
        setImprovements([]);
        setIdeas([]);
      } catch (e) {
        // Ignore secondary failures
      }
    } catch (err) {
      setError('AI generation failed or is unavailable.');
    } finally {
      setIsGenerating(false);
      setIsAiLoading(false);
    }
  };

  const handleAccept = () => {
    setContent(generatedContent);
    setGeneratedContent('');
  };

  const charCount = content.length;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-10 w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2 text-slate-800">Create Post</h1>
        <p className="text-slate-500">Create and publish content with AI assistance.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all min-h-[300px] mb-8">
        <textarea
          className="flex-1 w-full p-6 resize-none outline-none rounded-t-xl text-slate-800 text-lg bg-transparent"
          placeholder="What do you want to post about?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
        />
        
        {media.length > 0 && (
          <div className="px-6 pb-4 flex gap-4 overflow-x-auto border-t border-slate-100 pt-4">
            {media.map((m, i) => (
              <div key={i} className="relative w-32 h-24 bg-slate-100 rounded-md border border-slate-200 flex-shrink-0 flex items-center justify-center">
                <span className="text-xs text-slate-500 font-medium uppercase truncate px-2">{m.filename}</span>
                <button 
                  onClick={() => setMedia(media.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-md"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-slate-50 rounded-b-xl">
          <button 
            onClick={onAttachMedia}
            className="px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors flex items-center space-x-2 font-medium bg-white border border-slate-200 shadow-sm"
          >
            <ImageIcon size={18} className="text-indigo-600" />
            <span>Attach Media</span>
          </button>
          
          <div className="flex items-center space-x-6">
            <span className={`text-sm font-medium ${charCount > 280 ? 'text-red-500' : 'text-slate-400'}`}>
              {charCount} / 280
            </span>
            <button 
              onClick={() => handleGenerate('short')}
              disabled={isGenerating || content.length === 0}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              <span>Generate</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle size={20} className="mr-3" />
          <span>{error}</span>
        </div>
      )}

      {generatedContent && (
        <div className="mb-8 bg-indigo-50/50 border border-indigo-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-indigo-900 flex items-center">
              Suggested Content
            </h3>
            <div className="flex bg-white rounded-md border border-indigo-100 p-1 shadow-sm">
              <button onClick={() => handleGenerate('short')} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded">Short</button>
              <button onClick={() => handleGenerate('long')} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded">Long</button>
              <button onClick={() => handleGenerate('bullets')} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded">Bullets</button>
            </div>
          </div>
          
          <textarea
            className="w-full p-4 resize-none outline-none rounded-lg text-slate-800 bg-white border border-indigo-100 shadow-inner mb-4"
            value={generatedContent}
            onChange={(e) => setGeneratedContent(e.target.value)}
            rows={5}
          />
          
          <div className="flex items-center justify-end space-x-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 bg-white shadow-sm">Improve</button>
            <button onClick={() => handleGenerate('short')} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 bg-white shadow-sm">Regenerate</button>
            <button onClick={handleAccept} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm">Accept</button>
          </div>
        </div>
      )}

      <div className="pt-8 border-t border-slate-200 flex justify-end mt-auto">
        <button 
          onClick={onPreview}
          disabled={content.length === 0}
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-md font-medium text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          Review & Publish
        </button>
      </div>
    </div>
  );
}
