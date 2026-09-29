import { Sparkles, Hash, TrendingUp, Lightbulb, X } from 'lucide-react';
import type { HashtagSuggestion, PostImprovement, ContentIdea } from '../../services/api';

interface AIAssistantProps {
  hashtags: HashtagSuggestion[];
  improvements: PostImprovement[];
  ideas: ContentIdea[];
  isLoading: boolean;
  onClose: () => void;
}

export default function AIAssistant({ hashtags, improvements, ideas, isLoading, onClose }: AIAssistantProps) {
  const hasData = hashtags.length > 0 || improvements.length > 0 || ideas.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <Sparkles size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-slate-800">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          title="Close panel"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-5 space-y-7 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-7 h-7 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Analysing your content…</p>
          </div>
        )}

        {!isLoading && !hasData && (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <Sparkles size={28} className="mx-auto text-slate-300" />
            <p className="text-sm font-medium">No recommendations yet.</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a post or analyse your content to see suggestions here.
            </p>
          </div>
        )}

        {!isLoading && hasData && (
          <>
            {hashtags.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-3 text-slate-600">
                  <Hash size={16} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">Suggested Hashtags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-full shadow-sm cursor-default"
                    >
                      {t.tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {improvements.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-3 text-slate-600">
                  <TrendingUp size={16} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">Post Improvements</h3>
                </div>
                <div className="space-y-2">
                  {improvements.map((imp, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm text-sm text-slate-700">
                      {imp.suggestion}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {ideas.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-3 text-slate-600">
                  <Lightbulb size={16} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">Content Ideas</h3>
                </div>
                <div className="space-y-2">
                  {ideas.map((idea, i) => (
                    <div key={i} className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-900">
                      {idea.idea}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
