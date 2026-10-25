import React, { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Project } from '../../types';

interface ProjectDropdownProps {
  className?: string;
  variant?: 'sidebar' | 'topbar';
}

export const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
  className = '',
  variant = 'sidebar',
}) => {
  const { currentProject, projects, setCurrentProject } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Sync highlighted index when opened
  useEffect(() => {
    if (isOpen && currentProject) {
      const idx = projects.findIndex((p) => p.id === currentProject.id);
      if (idx !== -1) setHighlightedIndex(idx);
    }
  }, [isOpen, currentProject, projects]);

  const handleSelect = (project: Project) => {
    setCurrentProject(project);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % projects.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + projects.length) % projects.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (projects[highlightedIndex]) {
        handleSelect(projects[highlightedIndex]);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Active Project"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 border border-border rounded-lg text-xs font-medium cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${
          variant === 'sidebar'
            ? 'px-2.5 py-2 bg-soft hover:bg-gray-100 dark:hover:bg-[#273449] text-navy-900'
            : 'px-2.5 py-1.5 bg-surface hover:bg-soft dark:hover:bg-[#273449] text-navy-900'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Layers size={13} className="text-secondary shrink-0" />
          <span className="truncate">{currentProject?.name || 'Select Project'}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-secondary shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Options */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 right-0 mt-1.5 bg-surface dark:bg-[#1F2937] border border-border dark:border-[#374151] rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100 max-h-60 overflow-y-auto"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted border-b border-border/60">
            Switch Project
          </div>
          {projects.map((p, idx) => {
            const isSelected = p.id === currentProject?.id;
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={p.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(p)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors text-left ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20 dark:text-indigo-400'
                    : isHighlighted
                    ? 'bg-gray-100 dark:bg-[#273449] text-navy-900 dark:text-[#F9FAFB]'
                    : 'text-navy-900 dark:text-[#F9FAFB] hover:bg-gray-100 dark:hover:bg-[#273449]'
                }`}
              >
                <div className="truncate">
                  <div className="truncate">{p.name}</div>
                  {p.description && (
                    <div className="text-[10px] text-muted truncate mt-0.5 font-normal">
                      {p.description}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <Check size={14} className="text-primary dark:text-indigo-400 shrink-0 font-bold" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
