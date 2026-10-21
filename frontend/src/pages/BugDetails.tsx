import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Paperclip,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Upload,
  User as UserIcon,
  Calendar,
  Layers,
  Check
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Bug,
  BugAIAnalysis,
  BugStatusHistory,
  Comment,
  Attachment,
  TestCase,
  BugStatus
} from '../types';
import { MOCK_USERS } from '../lib/mockData';

export const BugDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bug, setBug] = useState<Bug | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<BugAIAnalysis | null>(null);
  const [histories, setHistories] = useState<BugStatusHistory[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [relatedTestCase, setRelatedTestCase] = useState<TestCase | null>(null);

  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadBugData(id);
    const unsub = api.subscribe(() => {
      loadBugData(id);
    });
    return () => unsub();
  }, [id]);

  const loadBugData = async (bugId: string) => {
    const fetchedBug = await api.getBugById(bugId);
    if (!fetchedBug) {
      navigate('/bugs');
      return;
    }
    setBug(fetchedBug);

    const [ai, hists, comms, atts] = await Promise.all([
      api.getBugAIAnalysis(fetchedBug.id),
      api.getBugStatusHistories(fetchedBug.id),
      api.getComments(fetchedBug.id),
      api.getAttachments(fetchedBug.id),
    ]);

    setAiAnalysis(ai);
    setHistories(hists);
    setComments(comms);
    setAttachments(atts);

    if (fetchedBug.test_case_id) {
      const tc = await api.getTestCaseById(fetchedBug.test_case_id);
      if (tc) setRelatedTestCase(tc);
    }
  };

  const handleStatusChange = async (nextStatus: BugStatus) => {
    if (!bug) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateBugStatus(bug.id, nextStatus, user?.id || 'usr-101');
      setBug(updated);
      const hists = await api.getBugStatusHistories(bug.id);
      setHistories(hists);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bug || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const comm = await api.addComment(bug.id, user?.id || 'usr-101', newComment);
      setComments((prev) => [...prev, comm]);
      setNewComment('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!bug) return;
    const fakeFileName = `evidence_log_${Date.now().toString().slice(-4)}.log`;
    const att = await api.addAttachment(bug.id, fakeFileName, user?.id || 'usr-101');
    setAttachments((prev) => [...prev, att]);
  };

  const handleApplyAI = async () => {
    if (!bug || !aiAnalysis) return;
    const updated = await api.updateBug(bug.id, {
      title: aiAnalysis.suggested_title,
      category: aiAnalysis.suggested_category,
      severity: aiAnalysis.suggested_severity,
      priority: aiAnalysis.suggested_priority,
    });
    setBug(updated);
    setAiApplied(true);
    setTimeout(() => setAiApplied(false), 3000);
  };

  const getUserName = (userId?: string | null) => {
    if (!userId) return 'Unassigned';
    return MOCK_USERS.find((u) => u.id === userId)?.name || 'QA Engineer';
  };

  if (!bug) {
    return (
      <div className="py-12 text-center text-secondary">
        Loading bug details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back and Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/bugs')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-navy-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Bugs
        </button>

        {/* Status Lifecycle Action Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary mr-1">Status:</span>
          <StatusBadge status={bug.status} size="md" />

          {bug.status === 'Open' && (
            <Button
              size="sm"
              variant="outline"
              isLoading={isUpdatingStatus}
              onClick={() => handleStatusChange('In Progress')}
            >
              Start Progress →
            </Button>
          )}

          {bug.status === 'In Progress' && (
            <Button
              size="sm"
              isLoading={isUpdatingStatus}
              onClick={() => handleStatusChange('Fixed')}
            >
              <CheckCircle2 size={14} /> Mark as Fixed
            </Button>
          )}

          {bug.status === 'Fixed' && (
            <Button
              size="sm"
              variant="outline"
              isLoading={isUpdatingStatus}
              onClick={() => handleStatusChange('Retest')}
            >
              Send to Retest →
            </Button>
          )}

          {bug.status === 'Retest' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:bg-red-50 border-red-200"
                isLoading={isUpdatingStatus}
                onClick={() => handleStatusChange('Reopened')}
              >
                Reopen Defect
              </Button>
              <Button
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={() => handleStatusChange('Closed')}
              >
                <CheckCircle2 size={14} /> Verify & Close
              </Button>
            </>
          )}

          {bug.status === 'Closed' && (
            <Button
              size="sm"
              variant="outline"
              isLoading={isUpdatingStatus}
              onClick={() => handleStatusChange('Reopened')}
            >
              Reopen Bug
            </Button>
          )}

          {bug.status === 'Reopened' && (
            <Button
              size="sm"
              isLoading={isUpdatingStatus}
              onClick={() => handleStatusChange('In Progress')}
            >
              Move to In Progress
            </Button>
          )}
        </div>
      </div>

      {/* Main Bug Header Card */}
      <div className="bg-surface rounded-card border border-border p-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 mb-2">
          <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-md">
            {bug.bug_code}
          </span>
          <SeverityBadge severity={bug.severity} size="sm" />
          <span className="text-xs font-semibold text-navy-800 bg-gray-100 px-2 py-0.5 rounded">
            {bug.priority}
          </span>
          <span className="text-xs text-secondary bg-soft border border-border px-2 py-0.5 rounded">
            {bug.category}
          </span>
        </div>

        <h1 className="text-xl font-bold text-navy-900 mt-2 leading-snug">
          {bug.title}
        </h1>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-border text-xs">
          <div>
            <span className="text-muted block text-[11px] mb-0.5">Assignee</span>
            <div className="flex items-center gap-1.5 font-medium text-navy-900">
              <UserIcon size={14} className="text-secondary" />
              {getUserName(bug.assignee_id)}
            </div>
          </div>
          <div>
            <span className="text-muted block text-[11px] mb-0.5">Reporter</span>
            <div className="flex items-center gap-1.5 font-medium text-navy-900">
              <UserIcon size={14} className="text-secondary" />
              {getUserName(bug.reporter_id)}
            </div>
          </div>
          <div>
            <span className="text-muted block text-[11px] mb-0.5">Due Date</span>
            <div className="flex items-center gap-1.5 font-medium text-navy-900">
              <Calendar size={14} className="text-secondary" />
              {bug.due_date || 'No due date'}
            </div>
          </div>
          <div>
            <span className="text-muted block text-[11px] mb-0.5">Related Test Case</span>
            <div className="flex items-center gap-1.5 font-medium text-navy-900 truncate">
              <Layers size={14} className="text-secondary shrink-0" />
              {relatedTestCase ? (
                <button
                  onClick={() => navigate(`/test-execution/${relatedTestCase.id}`)}
                  className="text-primary hover:underline truncate"
                >
                  {relatedTestCase.id}
                </button>
              ) : (
                'None'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Description, AI Analysis, Discussion */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Description */}
          <div className="bg-surface rounded-card border border-border p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-navy-900 pb-3 border-b border-border">
              Defect Description & Steps
            </h3>
            <div className="mt-3 text-xs text-navy-900 leading-relaxed whitespace-pre-wrap">
              {bug.description || 'No detailed description provided.'}
            </div>

            {relatedTestCase && (
              <div className="mt-4 p-3 rounded-lg bg-soft border border-border text-xs">
                <span className="font-semibold text-navy-900 block mb-1">
                  Expected Result from Test Case ({relatedTestCase.id}):
                </span>
                <p className="text-secondary">{relatedTestCase.expected_result}</p>
              </div>
            )}
          </div>

          {/* Section 2: AI Bug Intelligence */}
          {aiAnalysis && (
            <div className="bg-surface rounded-card border border-primary/30 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary-light text-primary">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-navy-900">AI Bug Intelligence</h3>
                    <p className="text-[11px] text-secondary">
                      Automated classification & duplicate detection
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleApplyAI}
                  disabled={aiApplied}
                  className="text-xs"
                >
                  {aiApplied ? (
                    <>
                      <Check size={14} className="text-emerald-600" /> Suggestions Applied
                    </>
                  ) : (
                    'Apply Suggestions'
                  )}
                </Button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-primary-light/30 border border-primary/20">
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mb-1">
                    AI Suggested Refinement
                  </span>
                  <div className="font-medium text-navy-900">{aiAnalysis.suggested_title}</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-soft border border-border">
                    <span className="text-[11px] text-muted block">Suggested Category</span>
                    <span className="font-semibold text-navy-900">{aiAnalysis.suggested_category}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-soft border border-border">
                    <span className="text-[11px] text-muted block">Suggested Severity</span>
                    <span className="font-semibold text-red-600">{aiAnalysis.suggested_severity}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-soft border border-border">
                    <span className="text-[11px] text-muted block">Suggested Priority</span>
                    <span className="font-semibold text-navy-900">{aiAnalysis.suggested_priority}</span>
                  </div>
                </div>

                {aiAnalysis.duplicate_bug_ids.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200">
                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-1">
                      <AlertCircle size={14} /> Potential Duplicate Match
                    </div>
                    <div className="text-secondary text-[11px]">
                      {aiAnalysis.duplicate_bug_ids.join(', ')} shares semantic failure patterns with this report.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Comments & Activity */}
          <div className="bg-surface rounded-card border border-border p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-secondary" />
                <h3 className="text-sm font-semibold text-navy-900">Comments & Discussion</h3>
              </div>
              <span className="text-xs text-muted">{comments.length} comments</span>
            </div>

            {/* Existing Comments */}
            <div className="space-y-4 mt-4">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-xs text-secondary">
                  No comments yet. Start the triage conversation below.
                </div>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="p-3.5 rounded-lg bg-soft border border-border text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-navy-900">{getUserName(comm.author_id)}</span>
                      <span className="text-[11px] text-muted">
                        {new Date(comm.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-navy-900 leading-relaxed">{comm.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input Form */}
            <form onSubmit={handleAddComment} className="mt-4 pt-4 border-t border-border">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment or QA triage update..."
                className="w-full text-xs p-3 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary mb-2"
              />
              <div className="flex justify-end">
                <Button size="sm" type="submit" isLoading={isSubmittingComment} disabled={!newComment.trim()}>
                  <Send size={14} /> Post Comment
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 col): Attachments & Status History Timeline */}
        <div className="space-y-6">
          {/* Attachments / Evidence */}
          <div className="bg-surface rounded-card border border-border p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Paperclip size={16} className="text-secondary" />
                <h3 className="text-sm font-semibold text-navy-900">Attachments & Logs</h3>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddAttachment} className="text-xs py-1 px-2">
                <Upload size={12} /> Add File
              </Button>
            </div>

            <div className="space-y-2 mt-4 text-xs">
              {attachments.length === 0 ? (
                <div className="text-center py-4 text-xs text-secondary">No attachments attached.</div>
              ) : (
                attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-soft border border-border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip size={14} className="text-secondary shrink-0" />
                      <span className="font-medium text-navy-900 truncate">{att.file_name}</span>
                    </div>
                    <span className="text-[10px] text-muted whitespace-nowrap">
                      {new Date(att.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status Timeline / History */}
          <div className="bg-surface rounded-card border border-border p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Clock size={16} className="text-secondary" />
              <h3 className="text-sm font-semibold text-navy-900">Status History Timeline</h3>
            </div>

            <div className="relative mt-4 pl-4 border-l-2 border-gray-200 space-y-4 text-xs">
              {histories.map((hist) => (
                <div key={hist.id} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white ring-1 ring-primary"></div>
                  <div className="font-medium text-navy-900">
                    <span className="text-secondary">{hist.old_status}</span>
                    <span className="mx-1 text-muted">→</span>
                    <span className="font-bold text-primary">{hist.new_status}</span>
                  </div>
                  <div className="text-[11px] text-secondary mt-0.5">
                    by {getUserName(hist.changed_by)}
                  </div>
                  <div className="text-[10px] text-muted">
                    {new Date(hist.changed_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
