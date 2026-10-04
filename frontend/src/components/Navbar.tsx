import React from 'react';
import { Radio, Wifi, Volume2, Shield, User as UserIcon, Sparkles, Activity } from 'lucide-react';
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
  onToggleDemoMode
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
          <div className="h-full w-full bg-slate-900 rounded-[10px] flex items-center justify-center">
            <Radio className="h-5 w-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              iTantra
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              v1.0 ML Transceiver
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            Indian Multilingual Neural Transceiver Radio Access
          </p>
        </div>
      </div>

      {/* Center status badges */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-400 font-mono">RF Carrier:</span>
          <span className="font-semibold text-cyan-300">2.40 GHz</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <Wifi className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-slate-400 font-mono">Channel:</span>
          <span className="font-semibold text-indigo-300">AWGN / BPSK</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Toggle */}
        <button
          onClick={onToggleDemoMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isDemoMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle Pre-recorded Indian Dialect Presets for Viva/Testing"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isDemoMode ? 'DEMO MODE ACTIVE' : 'Demo Mode'}</span>
        </button>

        {/* User Account / Auth */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200">
              <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-[10px]">
                {user.name.charAt(0)}
              </div>
              <span className="font-medium max-w-[120px] truncate">{user.name}</span>
              {user.role === 'ADMIN' && (
                <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-bold">
                  ADMIN
                </span>
              )}
            </div>
            <button
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </header>
  );
};
