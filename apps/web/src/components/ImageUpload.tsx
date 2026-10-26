'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { uploadEvidencePhoto, resolveImageUrl } from '@/lib/api-client';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Evidence Photo',
  helperText = 'JPEG, PNG, or WebP up to 5MB. EXIF GPS telemetry is stripped automatically per RA 10173.',
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setError(null);

    // Validate MIME
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadEvidencePhoto(file);
      onChange(result.file_url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload photo';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
          <ShieldCheck className="h-3 w-3" />
          RA 10173 Sanitized
        </span>
      </div>

      {value ? (
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-2.5 transition-all">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-slate-300 bg-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(value)}
                alt="Uploaded evidence preview"
                className="h-full w-full object-cover"
                crossOrigin="use-credentials"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Photo Uploaded & Sanitized</span>
              </div>
              <p className="truncate text-xs text-slate-500">{value}</p>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="mt-1 text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
              >
                Remove or replace photo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-slate-300 bg-slate-50/60 hover:bg-slate-100/60'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
            disabled={disabled || uploading}
          />

          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Camera className="h-5 w-5 text-emerald-600" />
            <Upload className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-medium">
              {uploading ? 'Sanitizing & Uploading...' : 'Click or drop photo here'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500">{helperText}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 rounded-md bg-red-50 p-2 text-xs font-medium text-red-700">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
