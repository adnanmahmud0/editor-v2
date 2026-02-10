import { useState } from "react";
import { useEditor, ImageElement } from "./EditorContext";
import { Upload } from "lucide-react";

interface ImageUploadModalProps {
  onClose: () => void;
}

export function ImageUploadModal({ onClose }: ImageUploadModalProps) {
  const { addElement } = useEditor();
  const [imageUrl, setImageUrl] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImageUrl(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = () => {
    if (imageUrl) {
      const newElement: ImageElement = {
        id: Date.now().toString(),
        type: "image",
        src: imageUrl,
        x: 100,
        y: 100,
        width: 300,
        height: 300,
        rotation: 0,
      };
      addElement(newElement);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl mb-4">Add Image</h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="w-12 h-12 text-gray-400" />
            <span className="text-gray-600">Click to upload image</span>
          </label>
        </div>

        {imageUrl && (
          <div className="mb-4">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-48 object-contain"
            />
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-cyan-500 text-cyan-500 rounded hover:bg-cyan-50"
          >
            CANCEL
          </button>
          <button
            onClick={handleAddImage}
            disabled={!imageUrl}
            className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ADD
          </button>
        </div>
      </div>
    </div>
  );
}
