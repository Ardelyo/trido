import React, { useRef } from 'react';
import { useStore } from '../store';
import { Paperclip } from 'lucide-react';

interface FileUploadButtonProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  disabled?: boolean;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({ 
  className, 
  icon = <Paperclip size={18} />, 
  title = "Unggah file / gambar",
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       alert('Saat ini hanya mendukung file gambar (JPEG, PNG, WebP) untuk diproses visual.');
       return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      useStore.getState().setLastUploadedImage(base64);
      useStore.getState().addMessage({ role: 'user', text: `[Gambar dilempirkan: ${file.name}]` });
    };
    reader.readAsDataURL(file);
    
    // reset input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <button 
        type="button" 
        onClick={() => fileInputRef.current?.click()} 
        disabled={disabled}
        className={`${className || "text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-xl hover:bg-blue-50"} ${disabled ? 'opacity-40 pointer-events-none' : ''}`} 
        title={title}
      >
        {icon}
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
    </>
  );
};
