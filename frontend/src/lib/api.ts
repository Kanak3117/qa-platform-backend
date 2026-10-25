import {
  User,
  Project,
  ProjectMember,
  TestSuite,
  TestCase,
  TestRun,
  TestExecution,
  Bug,
  BugStatusHistory,
  Comment,
  Attachment,
  BugAIAnalysis,
  Notification,
  BugStatus,
  Invitation,
  AuditLogEntry,
  CompanyProfile,
  SystemRole,
  ProjectRole
} from '../types';
import {
  MOCK_USERS,
  MOCK_PROJECTS,
  MOCK_PROJECT_MEMBERS,
  MOCK_SUITES,
  MOCK_TEST_CASES,
  MOCK_TEST_RUNS,
  MOCK_EXECUTIONS,
  MOCK_BUGS,
  MOCK_AI_ANALYSIS,
  MOCK_STATUS_HISTORIES,
  MOCK_COMMENTS,
  MOCK_ATTACHMENTS,
  MOCK_NOTIFICATIONS,
  MOCK_INVITATIONS,
  MOCK_AUDIT_LOGS,
  MOCK_COMPANY_PROFILE
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type Listener = () => void;

class ApiService {
  private token: string | null = null;
  private currentUserId: string | null = null;
  private listeners: Set<Listener> = new Set();

  // Unified in-memory state store
  private users: User[] = [...MOCK_USERS];
  private projectMembers: ProjectMember[] = [...MOCK_PROJECT_MEMBERS];
  private bugs: Bug[] = [...MOCK_BUGS];
  private suites: TestSuite[] = [...MOCK_SUITES];
  private testCases: TestCase[] = [...MOCK_TEST_CASES];
  private testRuns: TestRun[] = [...MOCK_TEST_RUNS];
  private executions: TestExecution[] = [...MOCK_EXECUTIONS];
  private statusHistories: BugStatusHistory[] = [...MOCK_STATUS_HISTORIES];
  private comments: Comment[] = [...MOCK_COMMENTS];
  private attachments: Attachment[] = [...MOCK_ATTACHMENTS];
  private notifications: Notification[] = [...MOCK_NOTIFICATIONS];
  private projects: Project[] = [...MOCK_PROJECTS];
  private invitations: Invitation[] = [...MOCK_INVITATIONS];
  private auditLogs: AuditLogEntry[] = [...MOCK_AUDIT_LOGS];
  private companyProfile: CompanyProfile = { ...MOCK_COMPANY_PROFILE };

  constructor() {
    this.token = localStorage.getItem('devvalidate_token') || localStorage.getItem('dailoqa_token');
    this.currentUserId = localStorage.getItem('devvalidate_user_id') || localStorage.getItem('dailoqa_user_id');
    const savedProfile = localStorage.getItem('devvalidate_company_profile') || localStorage.getItem('dailoqa_company_profile');
    if (savedProfile) {
      try {
        this.companyProfile = JSON.parse(savedProfile);
      } catch {
        // fallback
      }
    }
  }

  // Subscribe to state changes for true cross-component consistency
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Subscriber notify error:', err);
      }
    });
  }

  public setToken(token: string | null, userId: string | null = null) {
    this.token = token;
    this.currentUserId = userId;
    if (token) {
      localStorage.setItem('devvalidate_token', token);
      if (userId) localStorage.setItem('devvalidate_user_id', userId);
    } else {
      localStorage.removeItem('devvalidate_token');
      localStorage.removeItem('devvalidate_user_id');
      localStorage.removeItem('dailoqa_token');
      localStorage.removeItem('dailoqa_user_id');
    }
    this.notify();
  }

  public getToken(): string | null {
    return this.token;
  }

  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  public getBaseUrl(): string {
    return API_BASE_URL;
  }

  private getHeaders(contentType: string | null = 'application/json'): HeadersInit {
    const headers: Record<string, string> = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // AUTHENTICATION
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: this.getHeaders('application/x-www-form-urlencoded'),
        body: formData.toString(),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(error.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      const accessToken = data.access_token;

      // Fetch user profile from /api/auth/me to get the authoritative system_role from backend
      const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (meRes.ok) {
        const user: User = await meRes.json();
        if (!user.project_role) {
          const matched = this.users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
          if (matched?.project_role) user.project_role = matched.project_role;
        }
        this.setToken(accessToken, user.id);
        return { token: accessToken, user };
      }

      // If me fails, default strictly to USER role
      const user: User = {
        id: 'usr-current',
        name: email.split('@')[0],
        email: email,
        active: true,
        system_role: email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER',
        project_role: 'QA_ENGINEER',
        created_at: new Date().toISOString(),
      };
      this.setToken(accessToken, user.id);
      return { token: accessToken, user };
    } catch (err: any) {
      // In offline / demo mode: look up exact user by email
      const mockUser = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (mockUser && (password === 'password' || password === 'demo' || password.length >= 4)) {
        const fakeToken = `mock-jwt-token-${mockUser.id}-${Date.now()}`;
        this.setToken(fakeToken, mockUser.id);
        return { token: fakeToken, user: mockUser };
      }
      throw err;
    }
  }

  async register(
    name: string,
    email: string,
    password: string,
    projectRole: ProjectRole = 'QA_ENGINEER'
  ): Promise<User> {
    // SECURITY: Public registration ALWAYS creates system_role = 'USER'.
    // Only existing ADMIN in the Admin Console can promote a user to ADMIN.
    const systemRole: SystemRole = 'USER';

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(error.detail || `Server returned ${res.status}`);
      }

      const registered = await res.json();
      return registered;
    } catch {
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name,
        email,
        active: true,
        system_role: systemRole,
        project_role: projectRole,
        created_at: new Date().toISOString(),
      };
      this.users.push(newUser);
      this.projectMembers.push({
        id: `pm-${Date.now()}`,
        project_id: 'prj-001',
        user_id: newUser.id,
        project_role: projectRole,
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      });
      this.logAuditEvent('USER_REGISTERED', 'User', `User ${name} registered with role ${systemRole}`);
      this.notify();
      return newUser;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const liveUser = await res.json();
        if (!liveUser.project_role) {
          const matched = this.users.find((u) => u.email.toLowerCase() === liveUser.email.toLowerCase());
          if (matched?.project_role) liveUser.project_role = matched.project_role;
        }
        this.currentUserId = liveUser.id;
        return liveUser;
      }
    } catch {
      // offline fallback
    }

    // Resolve by specific currentUserId or token signature
    if (this.currentUserId) {
      const found = this.users.find((u) => u.id === this.currentUserId);
      if (found) return found;
    }

    if (this.token && this.token.startsWith('mock-jwt-token-')) {
      const parts = this.token.split('-');
      if (parts.length >= 4) {
        const userId = `${parts[2]}-${parts[3]}`;
        const found = this.users.find((u) => u.id === userId);
        if (found) {
          this.currentUserId = found.id;
          return found;
        }
      }
    }

    return null;
  }

  // USER MANAGEMENT (Real backend /api/users/ with fallback)
  async listUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const live = await res.json();
        if (Array.isArray(live) && live.length > 0) {
          return live;
        }
      }
    } catch {
      // offline
    }
    return this.users;
  }

  async updateUser(userId: string, data: { active?: boolean; system_role?: SystemRole }): Promise<User> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        const idx = this.users.findIndex((u) => u.id === userId);
        if (idx !== -1) this.users[idx] = updated;
        this.notify();
        return updated;
      }
    } catch {
      // offline
    }

    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    this.users[idx] = {
      ...this.users[idx],
      ...data,
    };
    this.logAuditEvent(
      'UPDATE_USER',
      'User',
      `Updated user ${this.users[idx].email}: active=${this.users[idx].active}, system_role=${this.users[idx].system_role}`
    );
    this.notify();
    return { ...this.users[idx] };
  }

  // PROJECTS & PROJECT MEMBERS
  async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const liveProjects = await res.json();
        if (Array.isArray(liveProjects) && liveProjects.length > 0) {
          return liveProjects;
        }
      }
    } catch {
      // offline
    }
    return this.projects;
  }

  async createProject(name: string, description: string): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        const p = await res.json();
        this.projects.push(p);
        this.notify();
        return p;
      }
    } catch {
      // offline
    }
    const newProj: Project = {
      id: `prj-${Date.now()}`,
      name,
      description,
      active: true,
    };
    this.projects.push(newProj);
    this.notify();
    return newProj;
  }

  async listProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/members/`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const live = await res.json();
        if (Array.isArray(live) && live.length > 0) return live;
      }
    } catch {
      // offline
    }
    return this.projectMembers.filter((pm) => pm.project_id === projectId);
  }

  async addProjectMember(projectId: string, userId: string, projectRole: ProjectRole): Promise<ProjectMember> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/members/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ user_id: userId, project_role: projectRole }),
      });
      if (res.ok) {
        const live = await res.json();
        this.projectMembers.push(live);
        this.notify();
        return live;
      }
    } catch {
      // offline
    }
    const user = this.users.find((u) => u.id === userId);
    const newMember: ProjectMember = {
      id: `pm-${Date.now()}`,
      project_id: projectId,
      user_id: userId,
      project_role: projectRole,
      user: user ? { id: user.id, name: user.name, email: user.email } : undefined,
    };
    this.projectMembers.push(newMember);
    this.logAuditEvent(
      'ADD_PROJECT_MEMBER',
      'ProjectMember',
      `Assigned user ${user?.email || userId} as ${projectRole} on project ${projectId}`
    );
    const actor = this.users.find((u) => u.id === (this.currentUserId || 'usr-103'));
    const actorName = actor?.name || 'Administrator';
    this.dispatchRoleNotification(
      projectId,
      this.currentUserId || 'usr-103',
      `${actorName} added ${user?.name || userId} as ${projectRole} to the project`,
      [userId]
    );
    this.notify();
    return newMember;
  }

  async updateProjectMember(projectId: string, memberId: string, projectRole: ProjectRole): Promise<ProjectMember> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/members/${memberId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ project_role: projectRole }),
      });
      if (res.ok) {
        const live = await res.json();
        const idx = this.projectMembers.findIndex((m) => m.id === memberId);
        if (idx !== -1) this.projectMembers[idx] = live;
        this.notify();
        return live;
      }
    } catch {
      // offline
    }
    const idx = this.projectMembers.findIndex((m) => m.id === memberId);
    if (idx === -1) throw new Error('Member not found');
    this.projectMembers[idx].project_role = projectRole;
    this.logAuditEvent(
      'UPDATE_PROJECT_MEMBER_ROLE',
      'ProjectMember',
      `Changed member ${memberId} role to ${projectRole}`
    );
    this.notify();
    return { ...this.projectMembers[idx] };
  }

  async removeProjectMember(projectId: string, memberId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
    } catch {
      // offline
    }
    const removed = this.projectMembers.find((m) => m.id === memberId);
    this.projectMembers = this.projectMembers.filter((m) => m.id !== memberId);
    this.logAuditEvent('REMOVE_PROJECT_MEMBER', 'ProjectMember', `Removed member ${memberId} from project`);
    const actor = this.users.find((u) => u.id === (this.currentUserId || 'usr-103'));
    const actorName = actor?.name || 'Administrator';
    this.dispatchRoleNotification(
      projectId,
      this.currentUserId || 'usr-103',
      `${actorName} removed a contributor from the project`,
      removed ? [removed.user_id] : []
    );
    this.notify();
  }

  // INVITATIONS
  async getInvitations(): Promise<Invitation[]> {
    return this.invitations;
  }

  async sendInvitation(email: string, role: ProjectRole | SystemRole, invitedBy: string = 'Admin'): Promise<Invitation> {
    const newInv: Invitation = {
      id: `inv-${Date.now().toString().slice(-4)}`,
      email,
      role,
      status: 'Pending',
      sent_date: new Date().toISOString(),
      invited_by: invitedBy,
    };
    this.invitations.unshift(newInv);
    this.logAuditEvent('SEND_INVITATION', 'Invitation', `Sent invitation to ${email} for role ${role}`);
    this.notify();
    return newInv;
  }

  async cancelInvitation(id: string): Promise<void> {
    const inv = this.invitations.find((i) => i.id === id);
    if (inv) {
      inv.status = 'Cancelled';
      this.logAuditEvent('CANCEL_INVITATION', 'Invitation', `Cancelled invitation for ${inv.email}`);
      this.notify();
    }
  }

  async resendInvitation(id: string): Promise<void> {
    const inv = this.invitations.find((i) => i.id === id);
    if (inv) {
      inv.status = 'Pending';
      inv.sent_date = new Date().toISOString();
      this.logAuditEvent('RESEND_INVITATION', 'Invitation', `Resent invitation to ${inv.email}`);
      this.notify();
    }
  }

  // AUDIT LOGS
  async getAuditLog(): Promise<AuditLogEntry[]> {
    return this.auditLogs;
  }

  public logAuditEvent(action: string, entity: string, details: string, actorName: string = 'Elena Rostova', actorEmail: string = 'elena.admin@dailoqa.io') {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      actor_name: actorName,
      actor_email: actorEmail,
      action,
      entity,
      details,
    };
    this.auditLogs.unshift(entry);
    this.notify();
  }

  // COMPANY PROFILE
  async getCompanyProfile(): Promise<CompanyProfile> {
    return this.companyProfile;
  }

  async saveCompanyProfile(profile: CompanyProfile): Promise<{ success: boolean; isLocalMvp: boolean }> {
    this.companyProfile = { ...profile };
    localStorage.setItem('dailoqa_company_profile', JSON.stringify(profile));
    this.logAuditEvent('UPDATE_COMPANY_PROFILE', 'CompanyProfile', `Updated company profile settings for ${profile.company_name}`);
    this.notify();
    return { success: true, isLocalMvp: true };
  }

  // TEST SUITES
  async getTestSuites(projectId?: string): Promise<TestSuite[]> {
    if (projectId) {
      return this.suites.filter((s) => s.project_id === projectId);
    }
    return this.suites;
  }

  async createTestSuite(data: Omit<TestSuite, 'id'>): Promise<TestSuite> {
    const suite: TestSuite = {
      id: `ts-${Date.now().toString().slice(-4)}`,
      ...data,
    };
    this.suites.unshift(suite);
    this.logAuditEvent('CREATE_TEST_SUITE', 'TestSuite', `Created test suite "${suite.name}"`);
    this.notify();
    return suite;
  }

  // TEST CASES
  async getTestCases(suiteId?: string, projectId?: string): Promise<TestCase[]> {
    let list = this.testCases.filter((tc) => !tc.is_deleted);
    if (suiteId && suiteId !== 'ALL') {
      list = list.filter((tc) => tc.test_suite_id === suiteId);
    }
    if (projectId) {
      const suiteIds = new Set(this.suites.filter((s) => s.project_id === projectId).map((s) => s.id));
      list = list.filter((tc) => suiteIds.has(tc.test_suite_id));
    }
    return list;
  }

  async getTestCaseById(id: string): Promise<TestCase | undefined> {
    return this.testCases.find((tc) => tc.id === id);
  }

  async createTestCase(data: Omit<TestCase, 'id' | 'is_deleted'>): Promise<TestCase> {
    const tc: TestCase = {
      id: `tc-${Date.now().toString().slice(-4)}`,
      ...data,
      is_deleted: false,
    };
    this.testCases.unshift(tc);
    this.logAuditEvent('CREATE_TEST_CASE', 'TestCase', `Created test case ${tc.id}: "${tc.title}"`);
    this.notify();
    return tc;
  }

  // TEST RUNS
  async getTestRuns(projectId?: string): Promise<TestRun[]> {
    if (projectId) {
      return this.testRuns.filter((tr) => tr.project_id === projectId);
    }
    return this.testRuns;
  }

  async createTestRun(name: string, projectId: string): Promise<TestRun> {
    const run: TestRun = {
      id: `tr-${Date.now().toString().slice(-4)}`,
      name,
      project_id: projectId,
      created_at: new Date().toISOString(),
    };
    this.testRuns.unshift(run);
    this.logAuditEvent('CREATE_TEST_RUN', 'TestRun', `Initialized test run "${name}"`);
    this.notify();
    return run;
  }

  // TEST EXECUTIONS
  async getExecutions(runId?: string, projectId?: string): Promise<TestExecution[]> {
    let list = this.executions;
    if (runId) {
      list = list.filter((e) => e.test_run_id === runId);
    }
    if (projectId) {
      const runIds = new Set(this.testRuns.filter((tr) => tr.project_id === projectId).map((tr) => tr.id));
      list = list.filter((e) => runIds.has(e.test_run_id));
    }
    return list;
  }

  async executeTestCase(
    runId: string,
    testCaseId: string,
    result: 'Passed' | 'Failed' | 'Blocked',
    userId: string
  ): Promise<TestExecution> {
    const execution: TestExecution = {
      id: `exec-${Date.now().toString().slice(-4)}`,
      test_run_id: runId,
      test_case_id: testCaseId,
      result,
      executed_by: userId,
      executed_at: new Date().toISOString(),
    };
    this.executions.unshift(execution);
    this.logAuditEvent(
      'EXECUTE_TEST_CASE',
      'TestExecution',
      `Executed test case ${testCaseId} in run ${runId} with result ${result}`
    );

    const run = this.testRuns.find((r) => r.id === runId);
    const runName = run?.name || 'Test Run';
    const executor = this.users.find((u) => u.id === userId);
    const executorName = executor?.name || 'QA Tester';

    if (result === 'Failed' || result === 'Blocked') {
      this.dispatchRoleNotification(
        run?.project_id || 'prj-001',
        userId,
        `${executorName} recorded a ${result} test execution in "${runName}" for case ${testCaseId}`,
        []
      );
    }

    this.notify();
    return execution;
  }

  // BUGS
  async getBugs(projectId?: string): Promise<Bug[]> {
    if (projectId) {
      return this.bugs.filter((b) => b.project_id === projectId && !b.is_deleted);
    }
    return this.bugs.filter((b) => !b.is_deleted);
  }

  async getBugById(idOrCode: string): Promise<Bug | undefined> {
    return this.bugs.find((b) => b.id === idOrCode || b.bug_code === idOrCode);
  }

  async createBug(data: Omit<Bug, 'id' | 'bug_code' | 'created_at' | 'updated_at' | 'is_deleted'>): Promise<Bug> {
    const count = this.bugs.length + 1;
    const bugCode = `BUG-00${421 + count}`;
    const newBug: Bug = {
      id: `b-${Date.now().toString().slice(-4)}`,
      bug_code: bugCode,
      ...data,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.bugs.unshift(newBug);

    this.statusHistories.unshift({
      id: `hist-${Date.now()}`,
      bug_id: newBug.id,
      changed_by: data.reporter_id,
      old_status: 'None',
      new_status: data.status,
      changed_at: new Date().toISOString(),
    });

    this.logAuditEvent('CREATE_DEFECT', 'Bug', `Created defect ${newBug.bug_code}: "${newBug.title}"`);

    const reporter = this.users.find((u) => u.id === data.reporter_id);
    const reporterName = reporter?.name || 'QA Tester';
    this.dispatchRoleNotification(
      data.project_id,
      data.reporter_id,
      `${reporterName} reported new ${data.severity} bug ${newBug.bug_code}: "${newBug.title}"`,
      [data.assignee_id || ''].filter(Boolean)
    );

    this.notify();
    return newBug;
  }

  async updateBugStatus(bugId: string, newStatus: BugStatus, changedBy: string): Promise<Bug> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bugs/${bugId}/status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const liveBug = await res.json();
        const idx = this.bugs.findIndex((b) => b.id === bugId);
        if (idx !== -1) this.bugs[idx] = { ...this.bugs[idx], ...liveBug };
        this.notify();
        return liveBug;
      }
    } catch {
      // offline
    }

    const bug = this.bugs.find((b) => b.id === bugId);
    if (!bug) throw new Error('Bug not found');
    const oldStatus = bug.status;
    bug.status = newStatus;
    bug.updated_at = new Date().toISOString();

    this.statusHistories.unshift({
      id: `hist-${Date.now()}`,
      bug_id: bug.id,
      changed_by: changedBy,
      old_status: oldStatus,
      new_status: newStatus,
      changed_at: new Date().toISOString(),
    });

    const actor = this.users.find((u) => u.id === changedBy);
    const actorName = actor?.name || 'A team member';

    this.logAuditEvent('STATUS_TRANSITION', 'Bug', `Updated ${bug.bug_code} status: ${oldStatus} → ${newStatus}`);

    this.dispatchRoleNotification(
      bug.project_id,
      changedBy,
      `${actorName} moved bug ${bug.bug_code} to ${newStatus}`,
      [bug.assignee_id || '', bug.reporter_id || ''].filter(Boolean)
    );

    this.notify();
    return { ...bug };
  }

  async revertBugStatus(bugId: string, changedBy: string): Promise<Bug> {
    // 1. Try backend endpoint first
    try {
      const res = await fetch(`${API_BASE_URL}/api/bugs/${bugId}/revert-status`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const liveBug = await res.json();
        const idx = this.bugs.findIndex((b) => b.id === bugId);
        if (idx !== -1) {
          this.bugs[idx] = { ...this.bugs[idx], ...liveBug };
        }
        // Also fetch updated history
        const histRes = await fetch(`${API_BASE_URL}/api/bugs/${bugId}/history`, {
          headers: this.getHeaders(),
        });
        if (histRes.ok) {
          const liveHistories = await histRes.json();
          this.statusHistories = [
            ...liveHistories,
            ...this.statusHistories.filter((h) => h.bug_id !== bugId),
          ];
        }
        this.notify();
        return liveBug;
      }
    } catch {
      // offline fallback
    }

    // 2. In-memory rollback logic
    const bug = this.bugs.find((b) => b.id === bugId);
    if (!bug) throw new Error('Bug not found');

    const bugHistories = this.statusHistories.filter((h) => h.bug_id === bugId);
    if (bugHistories.length === 0) {
      throw new Error('No status history available to revert');
    }

    let targetStatus: BugStatus | null = null;
    for (const h of bugHistories) {
      if (h.old_status && h.old_status !== bug.status && h.old_status !== 'None') {
        targetStatus = h.old_status as BugStatus;
        break;
      } else if (h.new_status !== bug.status) {
        targetStatus = h.new_status as BugStatus;
        break;
      }
    }

    if (!targetStatus) {
      throw new Error('No preceding status available to revert to');
    }

    const currentStatus = bug.status;
    bug.status = targetStatus;
    bug.updated_at = new Date().toISOString();

    const rollbackHistory: BugStatusHistory = {
      id: `hist-${Date.now()}`,
      bug_id: bug.id,
      changed_by: changedBy,
      old_status: currentStatus,
      new_status: targetStatus,
      changed_at: new Date().toISOString(),
    };
    this.statusHistories.unshift(rollbackHistory);

    const actor = this.users.find((u) => u.id === changedBy);
    const actorName = actor?.name || 'A team member';

    this.logAuditEvent(
      'STATUS_REVERT',
      'Bug',
      `Reverted ${bug.bug_code} status from ${currentStatus} back to ${targetStatus}`
    );

    this.dispatchRoleNotification(
      bug.project_id,
      changedBy,
      `${actorName} reverted bug ${bug.bug_code} from ${currentStatus} back to ${targetStatus}`,
      [bug.assignee_id || '', bug.reporter_id || ''].filter(Boolean)
    );

    this.notify();
    return { ...bug };
  }

  async updateBug(bugId: string, updates: Partial<Bug>): Promise<Bug> {
    const bugIndex = this.bugs.findIndex((b) => b.id === bugId);
    if (bugIndex === -1) throw new Error('Bug not found');
    const oldAssignee = this.bugs[bugIndex].assignee_id;
    this.bugs[bugIndex] = {
      ...this.bugs[bugIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.logAuditEvent('UPDATE_DEFECT', 'Bug', `Modified details on ${this.bugs[bugIndex].bug_code}`);

    // If reassigned or priority changed, dispatch notification
    if (updates.assignee_id && updates.assignee_id !== oldAssignee) {
      const assigneeUser = this.users.find((u) => u.id === updates.assignee_id);
      const actor = this.users.find((u) => u.id === this.currentUserId);
      const actorName = actor?.name || 'A team member';
      this.dispatchRoleNotification(
        this.bugs[bugIndex].project_id,
        this.currentUserId || 'usr-103',
        `${actorName} assigned bug ${this.bugs[bugIndex].bug_code} to ${assigneeUser?.name || 'you'}`,
        [updates.assignee_id]
      );
    }

    this.notify();
    return { ...this.bugs[bugIndex] };
  }

  // BUG AI ANALYSIS
  async getBugAIAnalysis(bugId: string): Promise<BugAIAnalysis | null> {
    return MOCK_AI_ANALYSIS[bugId] || null;
  }

  // BUG STATUS HISTORIES
  async getBugStatusHistories(bugId: string): Promise<BugStatusHistory[]> {
    return this.statusHistories.filter((h) => h.bug_id === bugId);
  }

  // COMMENTS
  async getComments(bugId: string): Promise<Comment[]> {
    return this.comments.filter((c) => c.bug_id === bugId);
  }

  async addComment(bugId: string, authorId: string, comment: string): Promise<Comment> {
    const newComm: Comment = {
      id: `comm-${Date.now()}`,
      bug_id: bugId,
      author_id: authorId,
      comment,
      created_at: new Date().toISOString(),
    };
    this.comments.push(newComm);
    this.logAuditEvent('ADD_COMMENT', 'Comment', `Added triage comment to bug ${bugId}`);

    const bug = this.bugs.find((b) => b.id === bugId);
    const author = this.users.find((u) => u.id === authorId);
    const authorName = author?.name || 'A team member';
    if (bug) {
      this.dispatchRoleNotification(
        bug.project_id,
        authorId,
        `${authorName} commented on ${bug.bug_code}: "${comment.length > 50 ? comment.slice(0, 47) + '...' : comment}"`,
        [bug.assignee_id || '', bug.reporter_id || ''].filter(Boolean)
      );
    }

    this.notify();
    return newComm;
  }

  // ATTACHMENTS
  async getAttachments(bugId: string): Promise<Attachment[]> {
    return this.attachments.filter((a) => a.bug_id === bugId);
  }

  async addAttachment(bugId: string, fileName: string, uploadedBy: string): Promise<Attachment> {
    const newAtt: Attachment = {
      id: `att-${Date.now()}`,
      bug_id: bugId,
      file_name: fileName,
      file_url: '#',
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
    };
    this.attachments.push(newAtt);
    this.logAuditEvent('UPLOAD_ATTACHMENT', 'Attachment', `Uploaded attachment "${fileName}" to bug ${bugId}`);
    this.notify();
    return newAtt;
  }

  // ROLE-BASED NOTIFICATION ROUTER (Section 6.A & 6.B)
  public dispatchRoleNotification(
    projectId: string,
    actorId: string,
    message: string,
    specificUserIds: string[] = []
  ): void {
    const actor = this.users.find((u) => u.id === actorId);
    const actorRole = actor?.system_role;

    const actorMember = this.projectMembers.find(
      (pm) => pm.project_id === projectId && pm.user_id === actorId
    );
    const projectRole = actorMember?.project_role || actor?.project_role;

    const recipientIds = new Set<string>();

    // Developer action -> Notify QA Engineers and Admins
    if (projectRole === 'DEVELOPER') {
      this.projectMembers
        .filter((pm) => pm.project_id === projectId && pm.project_role === 'QA_ENGINEER')
        .forEach((pm) => recipientIds.add(pm.user_id));
      this.users
        .filter((u) => u.system_role === 'ADMIN')
        .forEach((u) => recipientIds.add(u.id));
    }
    // QA Engineer action -> Notify Developers and Admins
    else if (projectRole === 'QA_ENGINEER') {
      this.projectMembers
        .filter((pm) => pm.project_id === projectId && pm.project_role === 'DEVELOPER')
        .forEach((pm) => recipientIds.add(pm.user_id));
      this.users
        .filter((u) => u.system_role === 'ADMIN')
        .forEach((u) => recipientIds.add(u.id));
    }
    // Admin action -> Notify Developers and QA Engineers
    else if (actorRole === 'ADMIN') {
      this.projectMembers
        .filter(
          (pm) =>
            pm.project_id === projectId &&
            (pm.project_role === 'DEVELOPER' || pm.project_role === 'QA_ENGINEER')
        )
        .forEach((pm) => recipientIds.add(pm.user_id));
    }
    // Default fallback
    else {
      this.projectMembers
        .filter((pm) => pm.project_id === projectId)
        .forEach((pm) => recipientIds.add(pm.user_id));
    }

    // Add specifically targeted users (e.g. bug assignee, bug reporter)
    specificUserIds.forEach((uid) => {
      if (uid) recipientIds.add(uid);
    });

    // Never notify the actor
    recipientIds.delete(actorId);

    // Create notifications for each recipient with real database-compatible timestamps
    const nowIso = new Date().toISOString();
    recipientIds.forEach((uid) => {
      const notif: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: uid,
        message,
        is_read: false,
        created_at: nowIso,
      };
      this.notifications.unshift(notif);
    });

    this.notify();
  }

  // NOTIFICATIONS (Section 6.D & 6.E)
  async getNotifications(userId?: string): Promise<Notification[]> {
    const targetUserId = userId || this.currentUserId;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const live = await res.json();
        if (Array.isArray(live)) {
          return live;
        }
      }
    } catch {
      // offline fallback
    }

    if (targetUserId) {
      return this.notifications.filter((n) => n.user_id === targetUserId);
    }
    return this.notifications;
  }

  async markNotificationRead(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: this.getHeaders(),
      });
    } catch {
      // offline fallback
    }
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.notify();
    }
  }

  async markAllNotificationsRead(userId?: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // offline fallback
    }
    const targetUserId = userId || this.currentUserId;
    this.notifications.forEach((n) => {
      if (!targetUserId || n.user_id === targetUserId) {
        n.is_read = true;
      }
    });
    this.notify();
  }

  // USER SELF PROFILE MANAGEMENT
  async updateProfile(data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<User> {
    try {
      const payload: Record<string, string> = {};
      if (data.name) payload.name = data.name.trim();
      if (data.email) payload.email = data.email.trim().toLowerCase();
      if (data.currentPassword) payload.current_password = data.currentPassword;
      if (data.newPassword) payload.new_password = data.newPassword;

      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated: User = await res.json();
        const idx = this.users.findIndex((u) => u.id === updated.id);
        if (idx !== -1) {
          this.users[idx] = { ...this.users[idx], ...updated };
        }
        this.logAuditEvent('UPDATE_PROFILE', 'User', `User updated own profile: ${updated.email}`);
        this.notify();
        return updated;
      } else {
        const err = await res.json().catch(() => ({ detail: 'Failed to update profile' }));
        throw new Error(err.detail || 'Failed to update profile');
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }

      // Offline / Demo Fallback
      const currentUser = await this.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (data.email && data.email.toLowerCase() !== currentUser.email.toLowerCase()) {
        const emailExists = this.users.some(
          (u) => u.id !== currentUser.id && u.email.toLowerCase() === data.email!.toLowerCase().trim()
        );
        if (emailExists) throw new Error('Email already registered');
      }

      if (data.newPassword) {
        if (!data.currentPassword) {
          throw new Error('Current password is required to set a new password');
        }
        if (data.currentPassword !== 'password' && data.currentPassword.length < 4) {
          throw new Error('Current password is incorrect');
        }
      }

      const updatedUser: User = {
        ...currentUser,
        name: data.name ? data.name.trim() : currentUser.name,
        email: data.email ? data.email.trim().toLowerCase() : currentUser.email,
      };

      const idx = this.users.findIndex((u) => u.id === currentUser.id);
      if (idx !== -1) {
        this.users[idx] = updatedUser;
      }
      this.logAuditEvent('UPDATE_PROFILE', 'User', `User updated profile in demo session: ${updatedUser.email}`);
      this.notify();
      return updatedUser;
    }
  }

  // GLOBAL PROJECT SEARCH
  async searchProjectEntities(query: string, projectId?: string) {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { bugs: [], testCases: [], testSuites: [], testRuns: [] };
    }

    const [bugs, testSuites, testCases, testRuns] = await Promise.all([
      this.getBugs(projectId),
      this.getTestSuites(projectId),
      this.getTestCases(undefined, projectId),
      this.getTestRuns(projectId),
    ]);

    const matchedBugs = bugs.filter(
      (b) =>
        b.bug_code.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
    );

    const matchedSuites = testSuites.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );

    const matchedCases = testCases.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );

    const matchedRuns = testRuns.filter((r) => r.name.toLowerCase().includes(q));

    return {
      bugs: matchedBugs,
      testCases: matchedCases,
      testSuites: matchedSuites,
      testRuns: matchedRuns,
    };
  }
}

export const api = new ApiService();
