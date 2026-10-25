import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bug, ArrowRight, FlaskConical, Code2, AlertCircle, Info } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { ProjectRole } from '../types';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('QA_ENGINEER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(name, email, password, selectedRole);
      // Route role-appropriately
      if (selectedRole === 'DEVELOPER') {
        navigate('/developer-workspace');
      } else {
        navigate('/workspace');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md hover:bg-primary-hover transition-colors">
            <Bug size={26} />
          </Link>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-navy-900">
          Create your DevValidate account
        </h2>
        <p className="mt-1 text-center text-xs text-secondary">
          Select your engineering role to tailor your workspace experience
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-surface py-8 px-6 shadow-sm rounded-card border border-border sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Cards (Only valid engineering project roles, NO self-elevated Admin) */}
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-2">
                Select Your Project Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('QA_ENGINEER')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col items-start transition-all ${
                    selectedRole === 'QA_ENGINEER'
                      ? 'border-primary bg-primary-light/50 ring-1 ring-primary'
                      : 'border-border bg-soft hover:bg-border/60'
                  }`}
                >
                  <FlaskConical
                    size={20}
                    className={selectedRole === 'QA_ENGINEER' ? 'text-primary' : 'text-secondary'}
                  />
                  <span className="text-xs font-bold text-navy-900 mt-2 block">QA Tester</span>
                  <span className="text-[11px] text-secondary leading-tight mt-0.5">
                    Test suites, test runs, and defect triage verification
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('DEVELOPER')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col items-start transition-all ${
                    selectedRole === 'DEVELOPER'
                      ? 'border-primary bg-primary-light/50 ring-1 ring-primary'
                      : 'border-border bg-soft hover:bg-border/60'
                  }`}
                >
                  <Code2
                    size={20}
                    className={selectedRole === 'DEVELOPER' ? 'text-primary' : 'text-secondary'}
                  />
                  <span className="text-xs font-bold text-navy-900 mt-2 block">Developer</span>
                  <span className="text-[11px] text-secondary leading-tight mt-0.5">
                    Defect remediation, technical investigation & code fixes
                  </span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-soft rounded-lg border border-border/80 text-[11px] text-secondary flex items-start gap-2">
              <Info size={14} className="text-primary mt-0.5 shrink-0" />
              <span>
                New registrations are provisioned with standard user permissions. System administrator privileges must be granted by an existing workspace admin in the Admin Console.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Sarah Connor"
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-soft focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface text-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="sarah@dailoqa.io"
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-soft focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface text-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 6 characters"
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-soft focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface text-navy-900"
              />
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full mt-3"
              isLoading={isLoading}
            >
              Complete Registration <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-hover font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
