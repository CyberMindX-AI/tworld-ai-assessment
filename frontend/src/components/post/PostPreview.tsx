import { ArrowLeft, Loader2 } from 'lucide-react';
import type { MediaFile } from '../../services/api';

interface PostPreviewProps {
  content: string;
  media: MediaFile[];
  hashtags: string[];
  onEdit: () => void;
  onPublish: () => void;
  isPublishing: boolean;
}

export default function PostPreview({ content, media, hashtags, onEdit, onPublish, isPublishing }: PostPreviewProps) {
  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto w-full">
      <div className="p-8 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10 w-full max-w-6xl mx-auto">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onEdit}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Review & Publish</h1>
            <p className="text-sm text-slate-500">Review your final content before publishing.</p>
          </div>
        </div>
        <button 
          onClick={onPublish}
          disabled={isPublishing}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-8 py-2.5 rounded-md font-medium transition-colors shadow-md text-lg"
        >
          {isPublishing && <Loader2 size={18} className="animate-spin" />}
          <span>{isPublishing ? 'Publishing…' : 'Publish Now'}</span>
        </button>
      </div>

      <div className="flex-1 p-10 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-700 border-b border-slate-100 pb-2">Content Draft</h2>
            <div className="bg-slate-50 rounded-xl shadow-inner border border-slate-200 p-8">
              <div className="text-slate-800 text-lg whitespace-pre-wrap leading-relaxed font-sans">
                {content || 'No content provided.'}
              </div>
            </div>
          </div>

          {hashtags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {media.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Attached Media</h3>
              <div className="grid gap-4 grid-cols-2">
                {media.map((m, i) => (
                  <div key={i} className="aspect-video bg-white border border-slate-200 shadow-sm rounded-lg flex flex-col items-center justify-center p-4">
                    <span className="text-slate-500 font-medium truncate w-full text-center mb-2">{m.filename}</span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded uppercase tracking-wide">{m.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
