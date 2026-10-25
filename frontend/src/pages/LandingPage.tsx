import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bug,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  Code2,
  FlaskConical,
  ShieldAlert,
  PlayCircle,
  BarChart3,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleOpenWorkspace = () => {
    if (user?.system_role === 'ADMIN') {
      navigate('/admin/members');
    } else if (user?.project_role === 'DEVELOPER') {
      navigate('/developer-workspace');
    } else {
      navigate('/workspace');
    }
  };

  return (
    <div className="min-h-screen bg-background text-navy-900 flex flex-col font-sans selection:bg-primary-light selection:text-primary">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-primary-hover transition-colors">
                <Bug size={18} />
              </div>
              <span className="font-bold text-navy-900 text-lg tracking-tight">DevValidate</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-secondary">
              <a href="#features" className="hover:text-navy-900 transition-colors">Features</a>
              <a href="#workflow" className="hover:text-navy-900 transition-colors">QA Workflow</a>
              <a href="#roles" className="hover:text-navy-900 transition-colors">Role Workspaces</a>
              <a href="#ai" className="hover:text-navy-900 transition-colors">AI Intelligence</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Public Landing Page Theme Toggle */}
            <div
              className="flex items-center gap-1.5 py-1 px-1.5 rounded-full bg-soft border border-border"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div
                role="switch"
                aria-checked={theme === 'dark'}
                aria-label="Toggle dark mode"
                tabIndex={0}
                onClick={toggleTheme}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleTheme();
                  }
                }}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                  theme === 'dark' ? 'bg-[#4F46E5]' : 'bg-[#D1D5DB]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center transform transition-transform duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {theme === 'dark' ? (
                    <Moon size={11} className="text-indigo-600" />
                  ) : (
                    <Sun size={11} className="text-amber-500" />
                  )}
                </div>
              </div>
            </div>

            {isAuthenticated ? (
              <Button onClick={handleOpenWorkspace} size="sm">
                Open Workspace <ArrowRight size={14} />
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">
                    Get Started <ArrowRight size={14} />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 max-w-7xl mx-auto w-full text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold mb-6 border border-primary/20">
            <Sparkles size={14} />
            <span>AI-POWERED SOFTWARE QUALITY PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy-900 leading-[1.12]">
            Ship better software with smarter QA.
          </h1>

          <p className="mt-5 text-sm sm:text-base text-secondary leading-relaxed max-w-2xl mx-auto">
            DevValidate delivers centralized test management, test case organization, fast test execution, defect lifecycle management, AI-assisted bug intelligence, project quality analytics, and role-based workspaces.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <Button size="lg" onClick={handleOpenWorkspace} className="w-full sm:w-auto">
                Open Your QA Workspace <ArrowRight size={16} />
              </Button>
            ) : (
              <>
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-primary text-white hover:bg-primary-hover shadow-md">
                    Get Started Free <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold">
                    Sign In to Workspace
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero Visual Mockup Preview */}
        <div className="mt-14 max-w-5xl mx-auto rounded-2xl p-2 bg-gradient-to-b from-border/70 to-border/30 border border-border shadow-xl">
          <div className="rounded-xl bg-surface border border-border overflow-hidden text-left p-6 sm:p-8 space-y-6">
            {/* Top Workspace Header Preview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
              <div>
                <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded border border-primary/20">
                  DEVVALIDATE WORKSPACE
                </span>
                <h3 className="text-lg font-bold text-navy-900 mt-1">Checkout and Payment Score</h3>
                <p className="text-xs text-secondary">Test execution and defect intelligence at a glance.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-md border font-semibold flex items-center gap-1.5 badge-passed">
                  <CheckCircle2 size={13} /> Regression Sprint 24 — Active
                </span>
              </div>
            </div>

            {/* Metrics Row Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-soft p-3 rounded-xl border border-border">
                <span className="text-[11px] font-semibold text-secondary uppercase">Open Bugs</span>
                <div className="text-2xl font-bold text-navy-900 mt-1">4</div>
                <span className="text-[10px] text-rose-600 font-medium">Requires triage</span>
              </div>
              <div className="bg-soft p-3 rounded-xl border border-border">
                <span className="text-[11px] font-semibold text-secondary uppercase">In Progress</span>
                <div className="text-2xl font-bold text-navy-900 mt-1">2</div>
                <span className="text-[10px] text-amber-600 font-medium">Engineering fixing</span>
              </div>
              <div className="bg-soft p-3 rounded-xl border border-border">
                <span className="text-[11px] font-semibold text-secondary uppercase">Retest</span>
                <div className="text-2xl font-bold text-navy-900 mt-1">1</div>
                <span className="text-[10px] text-purple-600 font-medium">Ready for QA</span>
              </div>
              <div className="bg-soft p-3 rounded-xl border border-border">
                <span className="text-[11px] font-semibold text-secondary uppercase">Closed</span>
                <div className="text-2xl font-bold text-navy-900 mt-1">10</div>
                <span className="text-[10px] text-emerald-600 font-medium">Verified fixed</span>
              </div>
            </div>

            {/* AI Recommendation Preview Highlight */}
            <div className="p-4 rounded-xl bg-soft border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary text-white shrink-0 mt-0.5">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">BUG-00421</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border badge-ai-preview">
                      AI Preview — Demo Data
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-navy-900 mt-0.5">
                    Payment gateway timeout during multi-currency settlement
                  </h4>
                  <p className="text-[11px] text-secondary">
                    Illustrative suggestion: Critical severity · P1 Priority · Duplicate match BUG-00398 (82%)
                  </p>
                </div>
              </div>
              <Link to="/login">
                <Button size="sm" variant="outline" className="text-xs shrink-0">
                  Try Interactive Demo →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-surface border-y border-border px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Core Capabilities</h2>
            <h3 className="text-3xl font-extrabold text-navy-900 mt-2">
              Everything your team needs for flawless releases
            </h3>
            <p className="text-xs text-secondary mt-2">
              Built specifically to eliminate friction between QA engineers and developers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-card border border-border bg-soft/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
                <Layers size={20} />
              </div>
              <h4 className="text-sm font-bold text-navy-900 mb-1">Test Case Management</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Author and organize modular test cases with structured reproduction steps, expected outputs, and priority weighting.
              </p>
            </div>

            <div className="p-6 rounded-card border border-border bg-soft/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl badge-passed flex items-center justify-center mb-4">
                <PlayCircle size={20} />
              </div>
              <h4 className="text-sm font-bold text-navy-900 mb-1">Live Test Execution</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Run test cycles and record Passed, Failed, or Blocked results in real time with immediate defect logging on failure.
              </p>
            </div>

            <div className="p-6 rounded-card border border-border bg-soft/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl badge-failed flex items-center justify-center mb-4">
                <Bug size={20} />
              </div>
              <h4 className="text-sm font-bold text-navy-900 mb-1">Defect Lifecycle Tracking</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Structured status transitions: Open → In Progress → Fixed → Retest → Closed, plus Reopen with full audit history.
              </p>
            </div>

            <div className="p-6 rounded-card border border-border bg-soft/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl badge-retest flex items-center justify-center mb-4">
                <Sparkles size={20} />
              </div>
              <h4 className="text-sm font-bold text-navy-900 mb-1">AI Bug Intelligence</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Automated category suggestion, severity scoring, priority ranking, and duplicate failure detection across the codebase.
              </p>
            </div>

            <div className="p-6 rounded-card border border-border bg-soft/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900 flex items-center justify-center mb-4">
                <BarChart3 size={20} />
              </div>
              <h4 className="text-sm font-bold text-navy-900 mb-1">Quality Analytics & Reports</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Audit pass rates, defect density by severity, resolution velocity, and exportable release readiness reports.
              </p>
            </div>

            <div className="p-6 rounded-card border border-border bg-soft/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl badge-ai-preview flex items-center justify-center mb-4">
                <ShieldAlert size={20} />
              </div>
              <h4 className="text-sm font-bold text-navy-900 mb-1">Enterprise RBAC Admin</h4>
              <p className="text-xs text-secondary leading-relaxed">
                FastAPI-enforced system role permissions, project seat assignments, invitations, and chronological audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Seamless End-to-End Flow</h2>
          <h3 className="text-3xl font-extrabold text-navy-900 mt-2">
            From test case to verified code closure
          </h3>
          <p className="text-xs text-secondary mt-2">
            No gaps, no lost triage notes, and no dead buttons.
          </p>
        </div>

        {/* Visual Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          <div className="p-3 rounded-xl bg-surface border border-border shadow-xs flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs mb-2">1</span>
            <span className="font-bold text-navy-900">Test Case</span>
            <span className="text-[10px] text-secondary mt-0.5">Author steps</span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-border shadow-xs flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs mb-2">2</span>
            <span className="font-bold text-navy-900">Execution</span>
            <span className="text-[10px] text-secondary mt-0.5">Run test cycle</span>
          </div>

          <div className="p-3 rounded-xl badge-failed border shadow-xs flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs mb-2">3</span>
            <span className="font-bold">Failed Result</span>
            <span className="text-[10px] opacity-80 mt-0.5">Trigger bug</span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-border shadow-xs flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs mb-2">4</span>
            <span className="font-bold text-navy-900">Defect Logged</span>
            <span className="text-[10px] text-secondary mt-0.5">Preserve context</span>
          </div>

          <div className="p-3 rounded-xl badge-ai-preview border shadow-xs flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs mb-2">5</span>
            <span className="font-bold">AI Preview</span>
            <span className="text-[10px] opacity-80 mt-0.5">Auto-triage</span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-border shadow-xs flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs mb-2">6</span>
            <span className="font-bold text-navy-900">Code Fix</span>
            <span className="text-[10px] text-secondary mt-0.5">Developer PR</span>
          </div>

          <div className="p-3 rounded-xl badge-retest border shadow-xs flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs mb-2">7</span>
            <span className="font-bold">Retest</span>
            <span className="text-[10px] opacity-80 mt-0.5">QA verification</span>
          </div>

          <div className="p-3 rounded-xl badge-passed border shadow-xs flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs mb-2">8</span>
            <span className="font-bold">Closure</span>
            <span className="text-[10px] opacity-80 mt-0.5">Verified fix</span>
          </div>
        </div>
      </section>

      {/* Role Workspaces Section */}
      <section id="roles" className="py-20 bg-surface border-y border-border px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Tailored Views</h2>
            <h3 className="text-3xl font-extrabold text-navy-900 mt-2">
              Role-focused workspaces for every contributor
            </h3>
            <p className="text-xs text-secondary mt-2">
              Designed around how quality and development engineers actually get work done.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-card border border-border bg-soft/40">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical size={20} className="text-emerald-600" />
                <h4 className="text-sm font-bold text-navy-900">QA Tester Workspace</h4>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-4">
                Tailored for manual and regression testing. Track suite execution progress, launch test runs, and verify resolved bugs in the dedicated retest queue.
              </p>
              <ul className="text-xs space-y-1.5 text-navy-900 font-medium">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Suite authoring & test steps</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Live test runs with Passed/Failed/Blocked</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Defect verification sign-off</li>
              </ul>
            </div>

            <div className="p-6 rounded-card border border-border bg-soft/40">
              <div className="flex items-center gap-2 mb-3">
                <Code2 size={20} className="text-blue-600" />
                <h4 className="text-sm font-bold text-navy-900">Developer Workspace</h4>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-4">
                Engineered for defect remediation. Focus on bugs assigned to you, inspect reproduction steps and stack traces, and mark bugs as Fixed with 1 click.
              </p>
              <ul className="text-xs space-y-1.5 text-navy-900 font-medium">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-blue-600" /> Assigned defect worklist</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-blue-600" /> Technical context & attachment logs</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-blue-600" /> Direct "Mark Fixed" handoff to QA</li>
              </ul>
            </div>

            <div className="p-6 rounded-card border border-border bg-soft/40">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={20} className="text-purple-600" />
                <h4 className="text-sm font-bold text-navy-900">Admin Console</h4>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-4">
                Full governance over organization seats, system roles, project authorizations, enterprise security policies, and chronological audit trails.
              </p>
              <ul className="text-xs space-y-1.5 text-navy-900 font-medium">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-purple-600" /> User seat management & promotion</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-purple-600" /> Project role assignments</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-purple-600" /> Full organizational audit log</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI Intelligence Section */}
      <section id="ai" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-br from-soft via-primary-light/10 to-soft rounded-2xl border border-primary/20 p-8 sm:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold mb-4">
              <Sparkles size={14} /> AI Bug Intelligence
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Triage defects faster with actionable AI recommendations
            </h3>

            <p className="mt-3 text-xs sm:text-sm text-secondary leading-relaxed">
              DevValidate's defect intelligence engine analyzes failure descriptions, steps, and stack traces to automate the tedious parts of bug triage:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-xs">
              <div className="p-4 rounded-xl bg-surface border border-border">
                <span className="font-bold text-navy-900 block mb-1">Category & Subsystem Suggestion</span>
                <p className="text-secondary">Classifies failure domains (e.g. Payment/Checkout, Auth, Database) automatically.</p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border">
                <span className="font-bold text-navy-900 block mb-1">Severity & Priority Scoring</span>
                <p className="text-secondary">Evaluates user impact to recommend Critical vs High severity and P1 vs P2 priority.</p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border">
                <span className="font-bold text-navy-900 block mb-1">Actionable Title Refinement</span>
                <p className="text-secondary">Transforms vague bug descriptions into clear, concise reproduction summaries.</p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border">
                <span className="font-bold text-navy-900 block mb-1">Semantic Duplicate Detection</span>
                <p className="text-secondary">Calculates similarity scores (e.g. BUG-00398 · 82%) to prevent duplicate bug churn.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary shrink-0" />
              <span>AI outputs are recommendations and always remain fully editable and approved by the QA engineer.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action Section with Adaptive Theme Contrast */}
      <section className="py-20 bg-surface border-t border-border px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-900">
            Start your QA workflow with DevValidate today.
          </h2>
          <p className="text-xs sm:text-sm text-secondary max-w-lg mx-auto leading-relaxed">
            Experience modern test execution, role-specific workspaces, and AI-assisted defect triage in a single unified platform.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-semibold shadow-md">
                Get Started Free <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto font-semibold shadow-xs"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-10 px-6 text-xs text-secondary">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center font-bold text-xs">
              <Bug size={14} />
            </div>
            <span className="font-bold text-navy-900">DevValidate</span>
            <span className="text-muted">· Software Quality Management</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-navy-900 transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-navy-900 transition-colors">Sign Up</Link>
            <a href="#features" className="hover:text-navy-900 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-navy-900 transition-colors">Workflow</a>
          </div>

          <div className="text-muted">
            © 2026 DevValidate. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
