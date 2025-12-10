
import React from 'react';
import { Layers, PieChart, BarChart3, ShieldPlus, User, Wallet, Radio } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  userBalance: number;
  walletAddress?: string;
  isMarketOpen?: boolean;
  notificationCount?: number;
  onConnectWallet?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, userBalance, walletAddress = '0x...', isMarketOpen = true, notificationCount = 0, onConnectWallet }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <PieChart size={20} /> },
    { id: 'marketplace', label: 'Exchange', icon: <BarChart3 size={20} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Layers size={20} /> },
    { id: 'admin', label: 'Admin', icon: <ShieldPlus size={20} /> },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 cursor-pointer flex flex-col" onClick={() => setView('dashboard')}>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                X-O-DOS
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider">x-o-dos.com</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${currentView === item.id
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Market Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-950 px-3 py-1 rounded border border-slate-800">
              <div className={`h-2 w-2 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isMarketOpen ? 'NGX: LIVE' : 'NGX: CLOSED'}
              </span>
            </div>

            <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-xs text-slate-400">USDT Balance</span>
              <span className="text-sm font-bold text-emerald-400">${userBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {walletAddress && walletAddress !== '0x0000...0000' && walletAddress !== '0x...' ? (
              <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1.5 border border-slate-700">
                <Wallet size={14} className="text-emerald-400" />
                <span className="text-xs font-mono text-emerald-300">
                  {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                </span>
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-4 py-1.5 text-xs font-bold transition-colors"
              >
                <Wallet size={14} /> Connect Wallet
              </button>
            )}

            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 relative">
              <User size={18} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold border border-slate-900">
                  {notificationCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu (simplified for MVP) */}
      <div className="md:hidden flex justify-around py-2 border-t border-slate-800 bg-slate-900">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`p-2 rounded-md ${currentView === item.id ? 'text-emerald-400' : 'text-slate-400'}`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </nav>
  );
};
