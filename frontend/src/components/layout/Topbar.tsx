import { Search, User, Sparkles, PanelRightOpen, PanelRightClose } from 'lucide-react';

interface TopbarProps {
  aiPanelOpen: boolean;
  onToggleAiPanel: () => void;
}

export default function Topbar({ aiPanelOpen, onToggleAiPanel }: TopbarProps) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0 w-full">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center mr-3">
          <span className="text-white font-bold text-sm select-none">T</span>
        </div>
        <span className="font-semibold text-lg tracking-wide text-slate-800">T-World</span>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-400 focus:bg-white transition-colors"
          />
        </div>

        {/* AI Panel toggle */}
        <button
          onClick={onToggleAiPanel}
          title={aiPanelOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
            aiPanelOpen
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles size={15} />
          <span className="hidden sm:inline">AI Assistant</span>
          {aiPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
        </button>

        <button className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors">
          <User size={16} />
        </button>
      </div>
    </header>
  );
}
