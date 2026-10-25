import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bug, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('sarah.qa@dailoqa.io');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);
      // Route role-appropriately
      if (loggedInUser.system_role === 'ADMIN') {
        navigate('/admin/members');
      } else if (loggedInUser.project_role === 'DEVELOPER') {
        navigate('/developer-workspace');
      } else {
        navigate('/workspace');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand header */}
        <div className="flex justify-center">
          <Link to="/" className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md hover:bg-primary-hover transition-colors">
            <Bug size={26} />
          </Link>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-navy-900">
          Sign in to DevValidate
        </h2>
        <p className="mt-1 text-center text-xs text-secondary">
          AI-Powered Software Quality & Defect Intelligence
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-sm rounded-card border border-border sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-soft focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface text-navy-900"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-navy-900">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:text-primary-hover font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-soft focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface text-navy-900"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In <ArrowRight size={16} />
            </Button>
          </form>

          {/* Quick Demo Logins with clear role descriptions */}
          <div className="mt-6 pt-5 border-t border-border">
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-2">
              Quick demo accounts:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('sarah.qa@dailoqa.io')}
                className="p-1.5 rounded border border-border bg-soft hover:bg-border/60 text-[11px] font-medium text-navy-900 truncate"
                title="QA Tester (Standard USER role - no admin access)"
              >
                QA Tester
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('alex.dev@dailoqa.io')}
                className="p-1.5 rounded border border-border bg-soft hover:bg-border/60 text-[11px] font-medium text-navy-900 truncate"
                title="Developer (Standard USER role - no admin access)"
              >
                Developer
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('elena.admin@dailoqa.io')}
                className="p-1.5 rounded border badge-retest text-[11px] font-semibold truncate hover:opacity-90"
                title="Admin (System Administrator role - full admin access)"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-secondary">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-primary-hover font-semibold">
              Sign up / Choose Role
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck size={14} />
          <span>Connected to FastAPI / PostgreSQL Auth Engine</span>
        </div>
      </div>
    </div>
  );
};
