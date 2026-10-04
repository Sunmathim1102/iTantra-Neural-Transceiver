import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { authApi } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await authApi.register(name, email, password);
      } else {
        res = await authApi.login(email, password);
      }
      localStorage.setItem('itantra_token', res.access_token);
      onSuccess(res.access_token, res.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPilotLogin = async () => {
    setEmail('pilot@itantra.ai');
    setPassword('UserPassword123!');
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login('pilot@itantra.ai', 'UserPassword123!');
      localStorage.setItem('itantra_token', res.access_token);
      onSuccess(res.access_token, res.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setEmail('admin@itantra.ai');
    setPassword('AdminPassword123!');
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login('admin@itantra.ai', 'AdminPassword123!');
      localStorage.setItem('itantra_token', res.access_token);
      onSuccess(res.access_token, res.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden glass-card">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">
              {isRegister ? 'Create Pilot Account' : 'iTantra Secure Login'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name / Call Sign</label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Officer Vikram Rao"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilot@itantra.ai"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>

          {/* Quick Demo Logins for Viva evaluation */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 text-center mb-2 font-medium">
              Viva & Evaluator Quick Logins:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickPilotLogin}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-cyan-300 text-center transition-colors"
              >
                Demo Pilot User
              </button>
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-rose-300 text-center transition-colors"
              >
                Demo Admin User
              </button>
            </div>
          </div>

          <div className="text-center pt-2 text-xs text-slate-400">
            {isRegister ? (
              <span>
                Already have credentials?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Need access?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Create Account
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
