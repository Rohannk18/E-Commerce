import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, CreditCard, Sparkles, Check, Copy, ArrowRight } from 'lucide-react';

export const DemoHelperBar: React.FC = () => {
  const { user, role, demoLogin, logout, isAuthenticated } = useAuth();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-xs border-b border-indigo-900/50 py-1.5 px-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Quick Switchers */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="flex items-center gap-1 font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Demo Fast-Login:
          </span>

          <button
            onClick={() => demoLogin('CUSTOMER')}
            className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
              role === 'CUSTOMER'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <UserCheck className="w-3 h-3 text-indigo-300" />
            Demo Customer
          </button>

          <button
            onClick={() => demoLogin('ADMIN')}
            className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
              role === 'ADMIN'
                ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-purple-300" />
            Demo Admin
          </button>

          {role === 'ADMIN' && (
            <Link
              to="/admin/orders"
              className="px-2.5 py-1 rounded-md bg-purple-500 hover:bg-purple-400 text-white font-bold transition flex items-center gap-1 shadow-sm"
            >
              <span>View Customer Orders</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}

          {isAuthenticated && (
            <button
              onClick={() => logout()}
              className="text-slate-400 hover:text-red-300 transition underline underline-offset-2 ml-1 text-[11px]"
            >
              Sign out
            </button>
          )}
        </div>

        {/* Right: Active Role & Test Card helper */}
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <CreditCard className="w-3 h-3 text-emerald-400" />
            <span>Test Card:</span>
            <button
              onClick={() => copyToClipboard('4242424242424242', 'card')}
              className="bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded font-mono text-[11px] text-emerald-300 flex items-center gap-1 border border-emerald-500/30"
              title="Click to copy test card number"
            >
              {copiedText === 'card' ? (
                <>
                  <Check className="w-2.5 h-2.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  4242...4242 <Copy className="w-2.5 h-2.5 text-slate-400" />
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Current Role:</span>
            {user ? (
              <span
                className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider ${
                  role === 'ADMIN'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {role} ({user.name.split(' ')[0]})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-slate-400 bg-slate-800 text-[10px]">
                Guest
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
