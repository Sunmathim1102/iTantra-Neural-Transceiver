import React from 'react';
import { Radio, Wifi, User as UserIcon, Sparkles } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  isDemoMode,
  onToggleDemoMode,
}) => {
  return (
    <header className="h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
          <Radio className="h-5 w-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              iTantra
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Neural Transceiver
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden md:block">
            Indian Multilingual Speech Intelligence & Neural Transceiver Access
          </p>
        </div>
      </div>

      {/* Center status badges */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-slate-400 font-mono">RF Carrier:</span>
          <span className="font-semibold font-mono text-slate-900">2.40 GHz</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
          <Wifi className="h-3.5 w-3.5 text-indigo-600" />
          <span className="text-slate-400 font-mono">Channel:</span>
          <span className="font-semibold text-slate-900">AWGN / BPSK</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDemoMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            isDemoMode
              ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Toggle Pre-recorded Indian Dialect Presets for Viva/Testing"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>{isDemoMode ? 'DEMO MODE ACTIVE' : 'Demo Presets'}</span>
        </button>

        {/* User Account / Auth */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
              <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                {user.name.charAt(0)}
              </div>
              <span className="font-medium max-w-[120px] truncate">{user.name}</span>
              {user.role === 'ADMIN' && (
                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold">
                  ADMIN
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all"
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </header>
  );
};
