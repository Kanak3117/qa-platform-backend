// Canonical Database & Frontend Models

export type SystemRole = 'ADMIN' | 'USER';
export type ProjectRole = 'QA_ENGINEER' | 'DEVELOPER' | 'STAKEHOLDER';

export interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
  system_role: SystemRole;
  project_role?: ProjectRole;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface MemberUser {
  id: string;
  name: string;
  email: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  project_role: ProjectRole;
  user?: MemberUser;
}

export interface TestSuite {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
}

export interface TestCase {
  id: string;
  test_suite_id: string;
  title: string;
  description: string;
  steps: string;
  expected_result: string;
  priority: string;
  status: string;
  is_deleted: boolean;
}

export interface TestRun {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export type ExecutionResult = 'Passed' | 'Failed' | 'Blocked';

export interface TestExecution {
  id: string;
  test_run_id: string;
  test_case_id: string;
  result: ExecutionResult;
  executed_by: string;
  executed_at: string;
}

export type BugSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export type BugStatus = 'Open' | 'In Progress' | 'Fixed' | 'Retest' | 'Closed' | 'Reopened';

export interface Bug {
  id: string;
  bug_code: string;
  title: string;
  description: string;
  category: string;
  severity: BugSeverity;
  priority: string;
  project_id: string;
  test_case_id: string | null;
  test_execution_id: string | null;
  assignee_id: string | null;
  reporter_id: string;
  due_date: string | null;
  status: BugStatus;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BugStatusHistory {
  id: string;
  bug_id: string;
  changed_by: string;
  old_status: string;
  new_status: string;
  changed_at: string;
}

export interface Comment {
  id: string;
  bug_id: string;
  author_id: string;
  comment: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  bug_id: string;
  file_name: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

export interface BugAIAnalysis {
  id: string;
  bug_id: string;
  suggested_category: string;
  suggested_severity: BugSeverity;
  suggested_priority: string;
  suggested_title: string;
  duplicate_bug_ids: string[];
}

export interface BugAnalysisSuggestion {
  suggested_title: string;
  category: string;
  severity: BugSeverity;
  priority: string;
  rationale: string;
  duplicates: Array<{
    bug_id: string;
    title: string;
    similarity: number;
  }>;
  duplicate_method: 'tfidf_cosine';
  requires_qa_review: true;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: ProjectRole | SystemRole;
  status: 'Pending' | 'Accepted' | 'Expired' | 'Cancelled';
  sent_date: string;
  invited_by: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_email: string;
  action: string;
  entity: string;
  details: string;
}

export interface CompanyProfile {
  company_name: string;
  workspace_url: string;
  website: string;
  industry: string;
  team_size: string;
  sso_enforced: boolean;
  two_factor_required: boolean;
  session_timeout_minutes: number;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
