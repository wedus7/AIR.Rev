import React from 'react';
import {
  LayoutDashboard,
  Users,
  Gauge,
  CreditCard,
  FileText,
  History,
  Settings,
  Code2
} from 'lucide-react';

export type TabKey =
  | 'dashboard'
  | 'pelanggan'
  | 'input_meter'
  | 'pembayaran'
  | 'laporan'
  | 'riwayat'
  | 'setting'
  | 'apps_script';

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  unpaidCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  unpaidCount
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabKey,
      label: 'Dashboard',
      icon: LayoutDashboard,
      sheetName: 'DASHBOARD'
    },
    {
      id: 'pelanggan' as TabKey,
      label: 'Pelanggan',
      icon: Users,
      sheetName: 'DATA PELANGGAN',
      badge: unpaidCount > 0 ? `${unpaidCount} Nunggak` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    {
      id: 'input_meter' as TabKey,
      label: 'Input Meter',
      icon: Gauge,
      sheetName: 'INPUT METER'
    },
    {
      id: 'pembayaran' as TabKey,
      label: 'Pembayaran',
      icon: CreditCard,
      sheetName: 'PEMBAYARAN'
    },
    {
      id: 'laporan' as TabKey,
      label: 'Laporan',
      icon: FileText,
      sheetName: 'LAPORAN'
    },
    {
      id: 'riwayat' as TabKey,
      label: 'Riwayat Transaksi',
      icon: History,
      sheetName: 'RIWAYAT PEMBAYARAN'
    },
    {
      id: 'setting' as TabKey,
      label: 'Setting',
      icon: Settings,
      sheetName: 'SETTING'
    },
    {
      id: 'apps_script' as TabKey,
      label: 'Apps Script & Sheet',
      icon: Code2,
      sheetName: 'SCRIPT & SETUP'
    }
  ];

  return (
    <>
      {/* Desktop / Tablet Nav Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-[69px] z-30 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full border ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Fixed Nav Bar for Android & Mobile Web */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {tabs.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative ${
                isActive ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1"></span>
              )}
            </button>
          );
        })}

        {/* More button dropdown or shortcut to Apps Script / Setting */}
        <button
          onClick={() => onSelectTab('apps_script')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            activeTab === 'apps_script' || activeTab === 'riwayat' || activeTab === 'setting'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400'
          }`}
        >
          <Code2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Script</span>
        </button>
      </div>
    </>
  );
};
