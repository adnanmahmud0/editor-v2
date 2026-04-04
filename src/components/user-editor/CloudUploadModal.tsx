"use client";

import React, { useState } from "react";
import { 
  X, 
  Upload, 
  Cloud, 
  Download, 
  Smartphone, 
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";

interface CloudUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (dataUrl: string) => void;
}

export function CloudUploadModal({ isOpen, onClose, onUpload }: CloudUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'google' | 'dropbox' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file.");
      return;
    }
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (f) => {
      onUpload(f.target?.result as string);
      setLoading(false);
      onClose();
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlUpload = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error("The URL does not point to a valid image.");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
        setLoading(false);
        onClose();
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setError(err.message || "Failed to load image from URL. Ensure the URL is public and CORS-enabled.");
      setLoading(false);
    }
  };

  // Modern Cloud Pickers Boilerplate (Placeholders)
  const openGooglePicker = () => {
    alert("Google Drive Integration: Please configure your GOOGLE_CLIENT_ID in the environment to enable the picker.");
    // Documentation: Once the user provides a key, we integrate the Google Picker API script here.
  };

  const openDropboxPicker = () => {
    alert("Dropbox Integration: Please configure your DROPBOX_APP_KEY in the environment to enable the picker.");
    // Documentation: Once the user provides a key, we integrate the Dropbox Chooser script here.
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <div className="flex h-[450px]">
          {/* Sidebar */}
          <div className="w-1/3 bg-gray-50/50 border-r border-gray-100 flex flex-col p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Sources</h3>
            
            <button 
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${activeTab === 'upload' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
            >
              <Smartphone className="w-4 h-4" />
              Upload Local
            </button>

            <button 
              onClick={() => setActiveTab('google')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${activeTab === 'google' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.56-1.56 2.73-3.08 2.73-1.8 0-3.25-1.45-3.25-3.25s1.45-3.25 3.25-3.25c.81 0 1.53.29 2.1.78l2.03-2.03C18.66 5.89 16.74 5 14.58 5 10.39 5 7 8.39 7 12.58S10.39 20.16 14.58 20.16c4.07 0 6.64-2.86 6.64-6.64 0-.42-.04-.83-.11-1.24z"/><path fill="#34A853" d="M14.58 5c2.16 0 4.08.89 5.48 2.33l2.03-2.03C18.66 5.89 16.74 5 14.58 5z"/><path fill="#FBBC05" d="M7 12.58c0-1.12.24-2.18.67-3.13l-2.17-2.17C4.54 8.78 4 10.61 4 12.58s.54 3.8 1.5 5.3l2.17-2.17c-.43-.95-.67-2.01-.67-3.13z"/><path fill="#EA4335" d="M14.58 20.16c-2.31 0-4.34-1.01-5.71-2.61l-2.17 2.17C8.61 21.6 11.51 23 14.58 23c4.13 0 7.61-2.73 8.71-6.49l-2.32-.42c-.5 1.58-1.99 2.73-3.81 2.73z"/></svg>
              </div>
              Google Drive
            </button>

            <button 
              onClick={() => setActiveTab('dropbox')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${activeTab === 'dropbox' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#0061FF" d="M6 2l6 4-6 4L0 6l6-4zm12 0l6 4-6 4-6-4 6-4zM6 14l6 4-6 4-6-4 6-4zm12 0l6 4-6 4-6-4 6-4zM12 10.5l6 4-6 4-6-4 6-4z"/></svg>
              </div>
              Dropbox
            </button>

            <button 
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'url' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
            >
              <Cloud className="w-4 h-4" />
              Import URL
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 bg-white p-8 relative flex flex-col justify-center items-center">
            
            {activeTab === 'upload' && (
              <div className="w-full h-full flex flex-col justify-center items-center">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 ring-4 ring-blue-50/50 animate-pulse">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Upload from Device</h2>
                <p className="text-sm text-gray-400 text-center mb-8 max-w-[200px]">Drop your images here or click to browse</p>
                
                <label className="group relative cursor-pointer outline-none">
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  <div className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-95">
                    Browse Files
                  </div>
                </label>
              </div>
            )}

            {activeTab === 'google' && (
              <div className="w-full h-full flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-6">
                  <Download className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Google Drive</h2>
                <p className="text-sm text-gray-400 mb-8 max-w-[250px]">Choose photos from your Google account safely and securely.</p>
                
                <button 
                  onClick={openGooglePicker}
                  className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all active:scale-95"
                >
                  Connect Drive
                </button>
              </div>
            )}

            {activeTab === 'dropbox' && (
              <div className="w-full h-full flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                  <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#0061FF" d="M6 2l6 4-6 4L0 6l6-4zm12 0l6 4-6 4-6-4 6-4zM6 14l6 4-6 4-6-4 6-4zm12 0l6 4-6 4-6-4 6-4zM12 10.5l6 4-6 4-6-4 6-4z"/></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Dropbox</h2>
                <p className="text-sm text-gray-400 mb-8 max-w-[250px]">Access your Dropbox library to add your high-res photos.</p>
                
                <button 
                  onClick={openDropboxPicker}
                  className="px-8 py-3 bg-[#0061FF] text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-[#0052D9] transition-all active:scale-95"
                >
                  Open Dropbox
                </button>
              </div>
            )}

            {activeTab === 'url' && (
              <div className="w-full h-full flex flex-col justify-center items-center">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                  <Cloud className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Import from URL</h2>
                <p className="text-sm text-gray-400 text-center mb-8">Paste a direct image link below</p>
                
                <div className="w-full max-w-[300px] flex flex-col gap-3">
                  <input 
                    type="url" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                  />
                  <button 
                    onClick={handleUrlUpload}
                    disabled={!url || loading}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 hover:bg-blue-700 transition-all"
                  >
                    {loading ? "Importing..." : "Import Image"}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute bottom-4 left-8 right-8 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-r-3xl z-10 font-bold text-blue-600">
                Processing...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
