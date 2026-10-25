import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Bug, ListTodo, FolderGit2, PlayCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Bug as IBug, TestCase, TestSuite, TestRun } from '../../types';

interface SearchResults {
  bugs: IBug[];
  testCases: TestCase[];
  testSuites: TestSuite[];
  testRuns: TestRun[];
}

export const GlobalSearch: React.FC = () => {
  const { currentProject } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    bugs: [],
    testCases: [],
    testSuites: [],
    testRuns: [],
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ bugs: [], testCases: [], testSuites: [], testRuns: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchProjectEntities(query, currentProject?.id);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentProject?.id]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation: Escape closes, Enter opens top result
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      if (results.bugs.length > 0) {
        handleNavigate(`/bugs/${results.bugs[0].id}`);
      } else if (results.testCases.length > 0) {
        handleNavigate(`/test-execution/${results.testCases[0].id}`);
      } else if (results.testSuites.length > 0) {
        handleNavigate(`/test-suites`);
      } else if (results.testRuns.length > 0) {
        handleNavigate(`/test-runs`);
      }
    }
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark key={i} className="bg-primary-light text-primary font-bold px-0.5 rounded-xs">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const totalResults =
    results.bugs.length +
    results.testCases.length +
    results.testSuites.length +
    results.testRuns.length;

  return (
    <div className="relative w-64 md:w-80" ref={containerRef}>
      {/* Search Input Box with Centered Icon */}
      <div className="relative flex items-center">
        <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-muted">
          {isLoading ? (
            <Loader2 size={15} className="animate-spin text-primary" />
          ) : (
            <Search size={15} />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search bugs, cases, suites..."
          className="w-full text-xs bg-soft border border-border rounded-lg pl-9 pr-8 py-2 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults({ bugs: [], testCases: [], testSuites: [], testRuns: [] });
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 inset-y-0 flex items-center text-muted hover:text-navy-900 transition-colors"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto animate-in fade-in duration-100">
          {isLoading && totalResults === 0 && (
            <div className="p-4 text-center text-xs text-muted flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Searching in {currentProject?.name || 'active project'}...</span>
            </div>
          )}

          {!isLoading && totalResults === 0 && (
            <div className="p-6 text-center">
              <p className="text-xs font-medium text-navy-900">
                No matching records found in this project.
              </p>
              <p className="text-[11px] text-muted mt-1">
                Searching project "{currentProject?.name}". Try checking your spelling or switching projects.
              </p>
            </div>
          )}

          {totalResults > 0 && (
            <div className="py-2 divide-y divide-border text-xs">
              {/* Bugs Category */}
              {results.bugs.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Bug size={12} className="text-rose-500" />
                    <span>Bugs ({results.bugs.length})</span>
                  </div>
                  {results.bugs.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleNavigate(`/bugs/${b.id}`)}
                      className="w-full text-left px-3 py-2 hover:bg-soft flex items-start gap-2.5 transition-colors"
                    >
                      <span className="font-mono text-[11px] font-semibold text-primary shrink-0 mt-0.5">
                        {highlightMatch(b.bug_code, query)}
                      </span>
                      <div className="truncate flex-1">
                        <div className="font-medium text-navy-900 truncate">
                          {highlightMatch(b.title, query)}
                        </div>
                        <div className="text-[10px] text-muted flex items-center gap-2 mt-0.5">
                          <span>{b.category}</span>
                          <span>·</span>
                          <span className={b.severity === 'Critical' ? 'text-rose-600 font-semibold' : ''}>
                            {b.severity}
                          </span>
                          <span>·</span>
                          <span>{b.status}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Test Cases Category */}
              {results.testCases.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <ListTodo size={12} className="text-primary" />
                    <span>Test Cases ({results.testCases.length})</span>
                  </div>
                  {results.testCases.map((tc) => (
                    <button
                      key={tc.id}
                      onClick={() => handleNavigate(`/test-execution/${tc.id}`)}
                      className="w-full text-left px-3 py-2 hover:bg-soft flex items-start gap-2.5 transition-colors"
                    >
                      <span className="font-mono text-[11px] font-semibold text-secondary shrink-0 mt-0.5">
                        {highlightMatch(tc.id.toUpperCase(), query)}
                      </span>
                      <div className="truncate flex-1">
                        <div className="font-medium text-navy-900 truncate">
                          {highlightMatch(tc.title, query)}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">
                          Priority: {tc.priority} · Status: {tc.status}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Test Suites Category */}
              {results.testSuites.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <FolderGit2 size={12} className="text-amber-500" />
                    <span>Test Suites ({results.testSuites.length})</span>
                  </div>
                  {results.testSuites.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleNavigate('/test-suites')}
                      className="w-full text-left px-3 py-2 hover:bg-soft flex items-start gap-2.5 transition-colors"
                    >
                      <FolderGit2 size={14} className="text-secondary shrink-0 mt-0.5" />
                      <div className="truncate flex-1">
                        <div className="font-medium text-navy-900 truncate">
                          {highlightMatch(s.name, query)}
                        </div>
                        {s.description && (
                          <div className="text-[10px] text-muted truncate mt-0.5">
                            {s.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Test Runs Category */}
              {results.testRuns.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <PlayCircle size={12} className="text-emerald-500" />
                    <span>Test Runs ({results.testRuns.length})</span>
                  </div>
                  {results.testRuns.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleNavigate('/test-runs')}
                      className="w-full text-left px-3 py-2 hover:bg-soft flex items-start gap-2.5 transition-colors"
                    >
                      <PlayCircle size={14} className="text-secondary shrink-0 mt-0.5" />
                      <div className="truncate flex-1">
                        <div className="font-medium text-navy-900 truncate">
                          {highlightMatch(r.name, query)}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
