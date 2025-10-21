// src/components/DropZoneUpload.tsx
import React, { useState, DragEvent, ChangeEvent } from "react";
import { Upload, Trash2 } from "lucide-react";

export default function DropZoneUpload({
    onFileSelect,
    label = "Upload File",
}: {
    onFileSelect?: (file: File | null) => void;
    label?: string;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFile = (file: File) => {
        setFile(file);
        onFileSelect?.(file);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setFile(null);
        onFileSelect?.(null);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto bg-white rounded-2xl shadow-md p-4">
            {!file ? (
                <label
                    htmlFor="file-upload"
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition ${dragActive
                            ? "border-purple-500 bg-purple-50"
                            : "border-purple-300 hover:border-purple-400"
                        }`}
                >
                    <Upload className="w-10 h-10 text-purple-500 mb-2" />
                    <p className="text-purple-600 font-medium">{label}</p>
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileInput}
                    />
                </label>
            ) : (
                <div className="flex items-center justify-between w-full bg-purple-50 text-purple-700 px-3 py-2 rounded-xl">
                    <span className="truncate text-sm">{file.name}</span>
                    <button
                        type="button"
                        onClick={removeFile}
                        className="p-2 rounded-full bg-purple-500 hover:bg-purple-600 text-white transition"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
