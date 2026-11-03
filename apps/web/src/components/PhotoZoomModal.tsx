'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
  Camera,
  Maximize2,
} from 'lucide-react';

export interface PhotoZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
  title?: string;
  subtitle?: string;
}

export function PhotoZoomModal({
  isOpen,
  onClose,
  imageUrl,
  altText = 'Evidence Photo',
  title = 'Incident Evidence Photo',
  subtitle,
}: PhotoZoomModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [hasError, setHasError] = useState<boolean>(false);

  // Reset state whenever modal is opened with a new image
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setHasError(false);
    }
  }, [isOpen, imageUrl]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const handleToggleZoom = useCallback(() => {
    setZoom((prev) => (prev === 1 ? 2 : 1));
  }, []);

  // Keyboard controls: Escape to close, +/- to zoom, 0/r to reset
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleResetZoom]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900/90 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {title}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  RA 10173 Sanitized
                </span>
              </div>
              {subtitle && (
                <p className="text-xs text-slate-400 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 p-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                title="Zoom Out (-)"
                aria-label="Zoom Out"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span
                className="px-2 text-xs font-mono font-bold text-slate-200 select-none min-w-[3.5rem] text-center"
                title="Current Zoom Level"
              >
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                title="Zoom In (+)"
                aria-label="Zoom In"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom (100%)"
                  aria-label="Reset Zoom"
                  className="p-1.5 ml-1 border-l border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close photo viewer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Stage Viewport */}
        <div className="relative flex-1 min-h-[300px] max-h-[72vh] overflow-auto flex items-center justify-center bg-slate-950 p-4 select-none">
          {hasError ? (
            <div className="text-center p-8 text-slate-400 space-y-2">
              <Camera className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">Unable to load evidence photo</p>
              <p className="text-xs text-slate-500">The file might still be processing or unavailable.</p>
            </div>
          ) : (
            <div
              className="relative flex items-center justify-center transition-all duration-200"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={altText}
                crossOrigin="use-credentials"
                onError={() => setHasError(true)}
                onClick={handleToggleZoom}
                className={`max-h-[62vh] max-w-full w-auto object-contain rounded-xl shadow-2xl transition-all duration-150 ${
                  zoom === 1 ? 'cursor-zoom-in' : 'cursor-zoom-out'
                }`}
                title={zoom === 1 ? 'Click photo to zoom in 2x' : 'Click photo to zoom out'}
              />
            </div>
          )}
        </div>

        {/* Modal Footer / Helpful Instructions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Click photo or use <span className="font-mono text-slate-300 font-bold">+</span> / <span className="font-mono text-slate-300 font-bold">-</span> controls to zoom. Scroll to inspect details.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
export default PhotoZoomModal;
