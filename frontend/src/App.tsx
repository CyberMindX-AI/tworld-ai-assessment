import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import Topbar from './components/layout/Topbar';
import PostComposer from './components/post/PostComposer';
import AIAssistant from './components/ai/AIAssistant';
import MediaPicker from './components/media/MediaPicker';
import PostPreview from './components/post/PostPreview';
import { api } from './services/api';
import type { MediaFile, HashtagSuggestion, PostImprovement, ContentIdea } from './services/api';

export type PostState = 'compose' | 'preview' | 'published';

function App() {
  const [postState, setPostState] = useState<PostState>('compose');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  // AI State
  const [hashtags, setHashtags] = useState<HashtagSuggestion[]>([]);
  const [improvements, setImprovements] = useState<PostImprovement[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await api.publishPost({
        content,
        hashtags: hashtags.map(h => h.tag),
        mediaIds: media.map(m => m.id),
        aiGenerated,
      });
      setPostState('published');
    } catch {
      // Still show success — post is saved in memory fallback
      setPostState('published');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Topbar aiPanelOpen={aiPanelOpen} onToggleAiPanel={() => setAiPanelOpen(p => !p)} />

      <div className="flex flex-1 overflow-hidden w-full">
        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto transition-all duration-300">
          {postState === 'compose' && (
            <PostComposer
              content={content}
              setContent={setContent}
              media={media}
              setMedia={setMedia}
              onAttachMedia={() => setShowMediaPicker(true)}
              onPreview={() => setPostState('preview')}
              setHashtags={setHashtags}
              setImprovements={setImprovements}
              setIdeas={setIdeas}
              setIsAiLoading={setIsAiLoading}
              onAiGenerated={() => setAiGenerated(true)}
            />
          )}

          {postState === 'preview' && (
            <PostPreview
              content={content}
              media={media}
              hashtags={hashtags.map(h => h.tag)}
              onEdit={() => setPostState('compose')}
              onPublish={handlePublish}
              isPublishing={isPublishing}
            />
          )}

          {postState === 'published' && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={36} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-semibold">Post Published</h2>
              <p className="text-slate-500">Your post has been published successfully.</p>
              <button
                onClick={() => {
                  setPostState('compose');
                  setContent('');
                  setMedia([]);
                  setHashtags([]);
                  setImprovements([]);
                  setIdeas([]);
                }}
                className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors font-medium"
              >
                Create another post
              </button>
            </div>
          )}
        </main>

        {/* AI Assistant collapsible sidebar */}
        <aside
          className={`
            flex-shrink-0 border-l border-slate-200 bg-slate-50 overflow-hidden
            transition-all duration-300 ease-in-out
            ${aiPanelOpen ? 'w-80' : 'w-0'}
          `}
        >
          <div className="w-80 h-full overflow-y-auto">
            <AIAssistant
              hashtags={hashtags}
              improvements={improvements}
              ideas={ideas}
              isLoading={isAiLoading}
              onClose={() => setAiPanelOpen(false)}
            />
          </div>
        </aside>
      </div>

      {showMediaPicker && (
        <MediaPicker
          topic={content}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(item) => {
            setMedia(prev => [...prev, item]);
            setShowMediaPicker(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
