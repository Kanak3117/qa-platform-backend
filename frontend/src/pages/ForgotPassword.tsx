import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Button } from '../components/common/Button';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md hover:bg-primary-hover transition-colors">
            <Bug size={26} />
          </Link>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-navy-900">
          Reset your password
        </h2>
        <p className="mt-1 text-center text-xs text-secondary">
          Enter your registered email and we'll send recovery instructions.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-sm rounded-card border border-border sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-semibold text-navy-900">Recovery Link Sent</h3>
              <p className="text-xs text-secondary">
                We've sent a password reset link to <strong className="text-navy-900">{email}</strong>. Please check your inbox.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="w-full">
                    <ArrowLeft size={14} /> Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-border rounded-lg bg-soft focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface text-navy-900"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Send Password Reset Instructions
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs text-secondary hover:text-navy-900 font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
