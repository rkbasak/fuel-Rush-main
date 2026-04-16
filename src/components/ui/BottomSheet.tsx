'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
}

export function BottomSheet({ isOpen, onClose, title, children, snapPoints = [50, 90] }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentYRef.current = e.touches[0].clientY - startYRef.current;
    if (currentYRef.current > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${currentYRef.current}px)`;
      sheetRef.current.style.opacity = `${1 - currentYRef.current / 300}`;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentYRef.current > 100) {
      onClose();
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
      sheetRef.current.style.opacity = '';
    }
    currentYRef.current = 0;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`
          fixed bottom-0 left-0 right-0 z-50 
          bg-surface-elevated rounded-t-2xl 
          shadow-lg
          transition-transform duration-300 ease-out
          ${isDragging ? '' : 'animate-slide-up'}
        `}
        style={{ maxHeight: `${snapPoints[1]}vh` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
            <h2 className="text-lg font-display font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: `calc(${snapPoints[1]}vh - 80px)` }}>
          {children}
        </div>
      </div>
    </>
  );
}
