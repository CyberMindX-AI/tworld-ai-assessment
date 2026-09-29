import { useState, useEffect, useRef } from 'react';
import { X, Search, FileText, Image as ImageIcon, Video, UploadCloud, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import type { MediaFile } from '../../services/api';

interface MediaPickerProps {
  topic: string;
  onClose: () => void;
  onSelect: (item: MediaFile) => void;
}

export default function MediaPicker({ topic, onClose, onSelect }: MediaPickerProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [recommended, setRecommended] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [filesRes, recRes] = await Promise.allSettled([
          api.getFiles({ status: 'approved' }),
          api.recommendMedia(topic)
        ]);

        if (filesRes.status === 'fulfilled') {
          setFiles(filesRes.value);
        }
        if (recRes.status === 'fulfilled') {
          setRecommended(recRes.value);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [topic]);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      await api.uploadFile(file);
      const filesRes = await api.getFiles({ status: 'approved' });
      setFiles(filesRes);
    } catch (err) {
      alert('Upload failed or backend unavailable.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Attach Media</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-md transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-8">
          
          {/* Upload Area */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-lg text-slate-800 mb-4">Upload files</h3>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <UploadCloud size={40} className="text-slate-400 mb-4" />
              <p className="text-slate-700 font-medium text-lg mb-2">Drag & drop files here</p>
              <p className="text-slate-500 text-sm mb-6">or</p>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-md shadow-sm hover:border-indigo-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </button>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <p className="text-slate-400 text-xs mt-4">Images, videos and documents</p>
            </div>
          </div>

          {/* Existing Files */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-lg text-slate-800 mb-4">Files & Docs</h3>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
              <div className="flex bg-slate-100 p-1 rounded-md">
                <button className="px-4 py-1.5 bg-white shadow-sm text-sm font-medium rounded text-slate-800">All</button>
                <button className="px-4 py-1.5 text-sm font-medium rounded text-slate-600 hover:bg-slate-200 transition-colors">Images</button>
                <button className="px-4 py-1.5 text-sm font-medium rounded text-slate-600 hover:bg-slate-200 transition-colors">Videos</button>
                <button className="px-4 py-1.5 text-sm font-medium rounded text-slate-600 hover:bg-slate-200 transition-colors">Documents</button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* AI Recommended */}
                {recommended.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <h4 className="font-medium text-slate-700">Recommended for this Post</h4>
                    </div>
                    <div className="border border-indigo-100 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-indigo-50 border-b border-indigo-100">
                            <th className="p-3 text-xs font-semibold text-indigo-800 uppercase">File</th>
                            <th className="p-3 text-xs font-semibold text-indigo-800 uppercase">Type</th>
                            <th className="p-3 text-xs font-semibold text-indigo-800 uppercase">Relevance</th>
                            <th className="p-3 text-xs font-semibold text-indigo-800 uppercase text-right">Select</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50">
                          {recommended.map((file) => (
                            <FileTableRow key={`rec-${file.id}`} file={file} onSelect={() => onSelect(file)} isRecommended />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* All Files */}
                <div>
                  {files.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                      <p className="text-slate-500 font-medium">No approved files yet</p>
                      <p className="text-slate-400 text-sm mt-1">Upload a file or add an approved asset to Files & Docs.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse bg-white">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase">File</th>
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase text-right">Select</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {files.map((file) => (
                            <FileTableRow key={`all-${file.id}`} file={file} onSelect={() => onSelect(file)} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function FileTableRow({ file, onSelect, isRecommended }: { file: MediaFile, onSelect: () => void, isRecommended?: boolean }) {
  const getIcon = () => {
    if (file.type.toLowerCase().includes('image')) return <ImageIcon size={18} className="text-blue-500" />;
    if (file.type.toLowerCase().includes('video')) return <Video size={18} className="text-purple-500" />;
    return <FileText size={18} className="text-orange-500" />;
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="p-3 flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
          {getIcon()}
        </div>
        <span className="font-medium text-slate-700 text-sm">{file.filename}</span>
      </td>
      <td className="p-3">
        <span className="text-slate-500 text-xs font-medium uppercase">{file.type}</span>
      </td>
      <td className="p-3 text-sm text-slate-600">
        {isRecommended ? (
          <span className="text-indigo-600">{file.relevanceExplanation || 'Relevant'}</span>
        ) : (
          <span className="flex items-center text-emerald-600 font-medium">
            <CheckCircle2 size={14} className="mr-1.5" /> Approved
          </span>
        )}
      </td>
      <td className="p-3 text-right">
        <button 
          onClick={onSelect}
          className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-700 text-slate-700 text-xs font-medium rounded shadow-sm transition-colors"
        >
          Select
        </button>
      </td>
    </tr>
  );
}
