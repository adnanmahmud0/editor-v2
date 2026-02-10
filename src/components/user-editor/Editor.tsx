import { useState } from "react";
import { useEditor } from "./EditorContext";
import { PageThumbnails } from "./PageThumbnails";
import { Canvas } from "./Canvas";
import { Toolbar } from "./Toolbar";
import { TextEditModal } from "./TextEditModal";
import { ImageUploadModal } from "./ImageUploadModal";

export function Editor() {
  const { currentPageIndex, pages } = useEditor();
  const [showTextModal, setShowTextModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button className="px-8 py-3 border-2 border-cyan-500 text-cyan-500 rounded bg-white hover:bg-cyan-50 transition-colors">
          BACK
        </button>

        <div className="flex gap-4">
          <button className="px-8 py-3 border-2 border-cyan-500 text-cyan-500 rounded bg-white hover:bg-cyan-50 transition-colors">
            SAVE
          </button>
          <button className="px-8 py-3 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors">
            NEXT PAGE
          </button>
        </div>
      </div>

      {/* Page Thumbnails */}
      <PageThumbnails />

      {/* Main Editor Area */}
      <div className="flex gap-4 mt-8">
        <div className="flex-1">
          <Canvas />
        </div>

        <Toolbar
          onAddText={() => setShowTextModal(true)}
          onAddImage={() => setShowImageModal(true)}
        />
      </div>

      {/* Modals */}
      {showTextModal && (
        <TextEditModal onClose={() => setShowTextModal(false)} />
      )}
      {showImageModal && (
        <ImageUploadModal onClose={() => setShowImageModal(false)} />
      )}
    </div>
  );
}
