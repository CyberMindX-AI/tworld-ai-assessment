import { LayoutDashboard, PenSquare, FolderOpen, FileText, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <nav className="w-60 bg-white flex flex-col p-4 flex-shrink-0 border-r border-slate-200 hidden md:flex">
      <div className="space-y-1 flex-1 mt-2">
        <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <NavItem icon={<PenSquare size={20} />} label="Create Post" active />
        <NavItem icon={<FolderOpen size={20} />} label="Files & Docs" />
        <NavItem icon={<FileText size={20} />} label="Posts" />
      </div>

      <div className="space-y-1 pt-4 border-t border-slate-200 mt-auto">
        <NavItem icon={<Settings size={20} />} label="Settings" />
      </div>
    </nav>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors ${active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
