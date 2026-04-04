import React, { useState } from 'react';

const FileUpload = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    handleFiles(e.target.files);
  };

  const handleFiles = async (files) => {
    if (files.length === 0) return;

    setUploading(true);

    // For now, we'll create a local file URL (in production, upload to Cloudinary)
    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: e.target.result // Local URL for demo
      };

      onFileUpload(fileData);
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
        isDragging
          ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
          : 'border-gray-300 bg-gradient-to-b from-gray-50 to-white hover:border-blue-400 hover:shadow-md'
      }`}
    >
      <input
        type="file"
        id="file-upload"
        multiple
        onChange={handleFileInput}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
      />

      <label htmlFor="file-upload" className="cursor-pointer block">
        <div className="space-y-3">
          <div className={`text-4xl transition-transform duration-300 ${isDragging ? 'scale-125' : 'scale-100'}`}>
            📁
          </div>
          <p className="text-gray-800 font-semibold text-base">
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">⏳</span> Uploading...
              </span>
            ) : isDragging ? (
              'Drop files here to upload'
            ) : (
              'Drag and drop your files here'
            )}
          </p>
          <p className="text-gray-500 text-sm">or click to select files</p>
          <div className="flex justify-center gap-2 flex-wrap pt-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">📷 Images</span>
            <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">📄 PDF</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">📝 Docs</span>
          </div>
        </div>
      </label>
    </div>
  );
};

export default FileUpload;
