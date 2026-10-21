import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export const Forbidden403: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-4 shadow-xs">
        <ShieldAlert size={32} />
      </div>

      <span className="text-xs font-bold text-rose-600 uppercase tracking-widest bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 mb-2">
        Error 403 — Unauthorized
      </span>

      <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-1">
        Administrator Privileges Required
      </h1>

      <p className="text-xs text-secondary max-w-md mt-2 leading-relaxed">
        You are authenticated as <strong className="text-navy-900">{user?.name}</strong> ({user?.email}) with system role <code className="bg-gray-100 text-navy-800 px-1 py-0.5 rounded font-mono font-semibold">{user?.system_role || 'USER'}</code>. The Admin Console is restricted strictly to accounts with the <strong className="text-navy-900">ADMIN</strong> role.
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/workspace')}
        >
          <ArrowLeft size={16} /> Return to QA Workspace
        </Button>
        <Button
          size="md"
          onClick={() => navigate('/login')}
        >
          <LogIn size={16} /> Log In with Admin Account
        </Button>
      </div>
    </div>
  );
};
