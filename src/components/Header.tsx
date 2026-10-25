import React from 'react';
import { Droplet, FileSpreadsheet, Code2, RefreshCw, BookOpen } from 'lucide-react';
import { SystemSettings } from '../types';
import { formatRupiah } from '../utils/formatters';

interface HeaderProps {
  settings: SystemSettings;
  onDownloadSheet: () => void;
  onOpenAppsScriptHub: () => void;
  onOpenRollover: () => void;
  onOpenGuide?: () => void;
  onOpenSyncModal?: () => void;
  isSyncConfigured?: boolean;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onDownloadSheet,
  onOpenAppsScriptHub,
  onOpenRollover,
  onOpenGuide,
  onOpenSyncModal,
  isSyncConfigured,
  isSyncing
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
            <Droplet className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl text-white tracking-tight flex items-center gap-1.5">
                AIR <span className="text-cyan-400 font-semibold">Management System</span>
              </h1>
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Google Sheets + GAS
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>{settings.namaUsaha}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-300 font-medium">Periode: {settings.periodeAktif}</span>
            </p>
          </div>
        </div>

        {/* Info Badges & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Tarif Badge - Clean & Elegant */}
          <div
            className="bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-inner"
            title="Tarif air aktif saat ini"
          >
            <span className="text-[11px] text-slate-400 font-medium">Tarif :</span>
            <span className="font-mono font-bold text-cyan-300 text-sm">
              {formatRupiah(settings.tarifDefault)}
              <span className="text-xs text-slate-400 font-normal"> / m³</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Panduan Penggunaan Button */}
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className="bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors active:scale-95"
                title="Buku Panduan Penggunaan & Revisi"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Panduan</span>
              </button>
            )}

            {/* Tutup Periode Bulanan Button */}
            <button
              onClick={onOpenRollover}
              className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors active:scale-95"
              title="Pergantian Periode Bulanan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ganti Bulan</span>
            </button>

            {/* Tombol Sinkronisasi Google Sheets Live */}
            {onOpenSyncModal && (
              <button
                onClick={onOpenSyncModal}
                className="bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors active:scale-95 relative"
                title="Sinkronisasi Live Google Sheets (Tarik / Kirim Data)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Sinkronisasi</span>
                {isSyncConfigured && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="URL Web App Terhubung" />
                )}
              </button>
            )}

            {/* Template Sheet .xlsx Download */}
            <button
              onClick={onDownloadSheet}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors active:scale-95"
              title="Unduh Template Google Sheets (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Template</span>
              <span>Sheet</span>
            </button>

            {/* Apps Script Codes Hub */}
            <button
              onClick={onOpenAppsScriptHub}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 active:scale-95"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Kode Apps Script</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
