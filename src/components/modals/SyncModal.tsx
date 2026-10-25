import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Database,
  Radio
} from 'lucide-react';
import { GoogleSyncConfig, Customer, MeterRecord, PaymentTransaction, SystemSettings } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { API_GS_CODE } from '../../utils/appsScriptCode';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: GoogleSyncConfig;
  onUpdateSyncConfig: (config: GoogleSyncConfig) => void;
  customers: Customer[];
  meterRecords: MeterRecord[];
  transactions: PaymentTransaction[];
  settings: SystemSettings;
  onApplySyncedData: (data: {
    customers: Customer[];
    meterRecords: MeterRecord[];
    transactions: PaymentTransaction[];
    settings?: SystemSettings;
  }) => void;
  onDownloadSheet: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onUpdateSyncConfig,
  customers,
  meterRecords,
  transactions,
  settings,
  onApplySyncedData,
  onDownloadSheet
}) => {
  if (!isOpen) return null;

  const [urlInput, setUrlInput] = useState(syncConfig.webAppUrl || '');
  const [activeMode, setActiveMode] = useState<'sync' | 'guide'>('sync');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error' | 'warning';
    title: string;
    message: string;
    details?: string;
  }>({
    type: 'idle',
    title: '',
    message: ''
  });
  const [copiedApiGs, setCopiedApiGs] = useState(false);

  const totalKas = transactions
    .filter(t => !t.isCancelled)
    .reduce((sum, t) => sum + (t.jumlahBayar || 0), 0);

  const handleCopyApiScript = () => {
    navigator.clipboard.writeText(API_GS_CODE);
    setCopiedApiGs(true);
    setTimeout(() => setCopiedApiGs(false), 2500);
  };

  const handleSaveUrl = () => {
    const trimmed = urlInput.trim();
    onUpdateSyncConfig({
      ...syncConfig,
      webAppUrl: trimmed,
      status: trimmed ? 'connected' : 'disconnected'
    });
    setSyncStatus({
      type: 'success',
      title: 'URL Berhasil Disimpan',
      message: 'URL Google Apps Script Web App telah disimpan ke pengaturan sistem.'
    });
  };

  // 1. Tarik Data dari Google Sheets (Pull / Fetch)
  const handlePullFromSheets = async () => {
    const targetUrl = urlInput.trim() || syncConfig.webAppUrl;
    if (!targetUrl) {
      setSyncStatus({
        type: 'warning',
        title: 'URL Belum Diisi',
        message: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu di bawah.'
      });
      return;
    }

    setIsLoading(true);
    setSyncStatus({
      type: 'idle',
      title: 'Menghubungi Google Sheets...',
      message: 'Sedang menarik data terbaru...'
    });

    try {
      const endpoint = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=getAllData&_t=${Date.now()}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error status: ${response.status} (${response.statusText})`);
      }

      const data = await response.json();

      if (data && data.status === 'success') {
        const pulledCustomers = data.customers || [];
        const pulledMeters = data.meterRecords || [];
        const pulledTransactions = data.transactions || [];
        const pulledSettings = data.settings;

        onApplySyncedData({
          customers: pulledCustomers.length > 0 ? pulledCustomers : customers,
          meterRecords: pulledMeters.length > 0 ? pulledMeters : meterRecords,
          transactions: pulledTransactions.length > 0 ? pulledTransactions : transactions,
          settings: pulledSettings
        });

        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        onUpdateSyncConfig({
          ...syncConfig,
          webAppUrl: targetUrl,
          lastSync: `${new Date().toLocaleDateString('id-ID')} ${timeStr}`,
          status: 'connected'
        });

        setSyncStatus({
          type: 'success',
          title: '✅ Tarik Data Berhasil!',
          message: `Berhasil menarik ${pulledCustomers.length} data pelanggan, ${pulledMeters.length} meter, dan ${pulledTransactions.length} transaksi dari Google Sheets Anda.`
        });
      } else {
        throw new Error(data.message || 'Respons tidak memuat data yang valid.');
      }
    } catch (err: any) {
      console.error('Gagal sinkronisasi tarik:', err);
      setSyncStatus({
        type: 'error',
        title: 'Gagal Menghubungkan Google Sheets',
        message: err.message || 'Terjadi kesalahan saat menghubungi URL Web App.',
        details: 'Pastikan file Api.gs sudah di-deploy dengan akses "Siapa saja (Anyone)" dan URL berakhiran /exec.'
      });
      onUpdateSyncConfig({
        ...syncConfig,
        status: 'error',
        errorMessage: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Kirim Data ke Google Sheets (Push / Upload)
  const handlePushToSheets = async () => {
    const targetUrl = urlInput.trim() || syncConfig.webAppUrl;
    if (!targetUrl) {
      setSyncStatus({
        type: 'warning',
        title: 'URL Belum Diisi',
        message: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu di bawah.'
      });
      return;
    }

    setIsLoading(true);
    setSyncStatus({
      type: 'idle',
      title: 'Mengirim Data...',
      message: 'Sedang mengunggah data aplikasi ke Google Spreadsheet...'
    });

    const payload = {
      action: 'syncAllData',
      customers: customers,
      meterRecords: meterRecords,
      transactions: transactions,
      settings: settings,
      timestamp: new Date().toISOString()
    };

    try {
      // Use text/plain to avoid preflight CORS restrictions in Google Apps Script
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      onUpdateSyncConfig({
        ...syncConfig,
        webAppUrl: targetUrl,
        lastSync: `${new Date().toLocaleDateString('id-ID')} ${timeStr}`,
        status: 'connected'
      });

      let resData = null;
      try {
        resData = await response.json();
      } catch (e) {
        // Some Apps Script redirects don't return JSON on POST, but were received
      }

      setSyncStatus({
        type: 'success',
        title: '✅ Kirim Data Berhasil!',
        message: resData?.message || `Seluruh data (${customers.length} pelanggan, ${transactions.length} transaksi) berhasil dikirimkan ke Google Spreadsheet Anda!`
      });
    } catch (err: any) {
      console.error('Gagal kirim data:', err);
      setSyncStatus({
        type: 'error',
        title: 'Gagal Mengirim Data ke Spreadsheet',
        message: err.message || 'Tidak dapat mengirim data ke Apps Script.',
        details: 'Jika menggunakan CORS dari browser, pastikan file Api.gs di spreadsheet memiliki handler doPost yang aktif.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-800/90 border-b border-slate-700/80 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-cyan-300' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Sinkronisasi Google Sheets</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  syncConfig.webAppUrl 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${syncConfig.webAppUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {syncConfig.webAppUrl ? 'Siap Sinkron' : 'Belum Terhubung'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hubungkan aplikasi ini dua arah dengan Google Spreadsheet Anda secara live
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveMode('sync')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeMode === 'sync'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Aksi Sinkronisasi Langsung</span>
          </button>
          <button
            onClick={() => setActiveMode('guide')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeMode === 'guide'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Panduan Pasang Api.gs (3 Menit)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {activeMode === 'sync' ? (
            <>
              {/* Status Alert Banner */}
              {syncStatus.type !== 'idle' && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  syncStatus.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : syncStatus.type === 'error'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {syncStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {syncStatus.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    {syncStatus.type === 'warning' && <HelpCircle className="w-4 h-4 text-amber-400" />}
                    <span>{syncStatus.title}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{syncStatus.message}</p>
                  {syncStatus.details && (
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/50 mt-1.5">
                      💡 {syncStatus.details}
                    </p>
                  )}
                </div>
              )}

              {/* URL Input Box */}
              <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Google Apps Script Web App URL (doGet/doPost)</span>
                  </label>
                  {syncConfig.lastSync && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Terakhir: {syncConfig.lastSync}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono"
                  />
                  <button
                    onClick={handleSaveUrl}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shrink-0"
                  >
                    Simpan
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Dapatkan URL ini dari menu <strong>Terapkan &gt; Penerapan Baru &gt; Aplikasi Web</strong> pada editor Apps Script di Google Sheets Anda.
                </p>
              </div>

              {/* Action Buttons: Pull & Push */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Tarik Data (Pull) */}
                <div className="bg-gradient-to-b from-cyan-950/40 to-slate-900 border border-cyan-800/40 hover:border-cyan-500/60 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
                      <ArrowDownToLine className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-cyan-200">Tarik dari Spreadsheet</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Mengambil data terbaru (pelanggan, angka meter, riwayat kasir) yang ada di spreadsheet ke dalam web app ini.
                    </p>
                  </div>
                  <button
                    onClick={handlePullFromSheets}
                    disabled={isLoading}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-900/40 transition-all active:scale-95"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>{isLoading ? 'Menghubungi...' : 'Tarik Data Sekarang'}</span>
                  </button>
                </div>

                {/* 2. Kirim Data (Push) */}
                <div className="bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-800/40 hover:border-emerald-500/60 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <ArrowUpFromLine className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-emerald-200">Kirim ke Spreadsheet</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Mengirimkan seluruh data aktif ({customers.length} pelanggan, {transactions.length} kas) dari web app ini ke Google Sheets Anda.
                    </p>
                  </div>
                  <button
                    onClick={handlePushToSheets}
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/40 transition-all active:scale-95"
                  >
                    <ArrowUpFromLine className="w-4 h-4" />
                    <span>{isLoading ? 'Mengirim...' : 'Kirim Data Sekarang'}</span>
                  </button>
                </div>
              </div>

              {/* Data Summary Card */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 font-medium">Data Terkini di Aplikasi:</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span><strong>{customers.length}</strong> Pelanggan</span>
                  <span>•</span>
                  <span><strong>{transactions.length}</strong> Transaksi Kas</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{formatRupiah(totalKas)}</span>
                </div>
              </div>

              {/* Alternatif Cepat: Unduh Template File Langsung */}
              <div className="pt-1 flex items-center justify-between border-t border-slate-800/80">
                <span className="text-xs text-slate-400">
                  Belum sempat deploy Web App? Anda bisa mengunduh file spreadsheet secara instan:
                </span>
                <button
                  onClick={onDownloadSheet}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 ml-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh .xlsx</span>
                </button>
              </div>
            </>
          ) : (
            /* Guide Tab */
            <div className="space-y-4 text-xs">
              <div className="bg-cyan-950/30 border border-cyan-800/50 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>3 Langkah Mudah Mengaktifkan Sinkronisasi Live</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Ikuti langkah berikut agar data aplikasi web di HP Android atau Laptop langsung terhubung ke Google Spreadsheet Anda:
                </p>
              </div>

              {/* Step 1 */}
              <div className="bg-slate-800/60 border border-slate-700/70 p-3.5 rounded-xl space-y-1.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[11px]">1</span>
                  <span>Buka Google Spreadsheet & Menu Apps Script</span>
                </div>
                <p className="text-slate-400 leading-relaxed pl-7">
                  Buka Google Spreadsheet baru (ketik: <code>sheets.new</code>) atau buka spreadsheet Anda, lalu klik menu <strong>Ekstensi</strong> &gt; <strong>Apps Script</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-800/60 border border-slate-700/70 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[11px]">2</span>
                    <span>Buat File `Api.gs` & Tempel Kode</span>
                  </div>
                  <button
                    onClick={handleCopyApiScript}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    {copiedApiGs ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedApiGs ? 'Tersalin!' : 'Salin Api.gs'}</span>
                  </button>
                </div>
                <p className="text-slate-400 leading-relaxed pl-7">
                  Buat file skrip baru dengan nama <code>Api.gs</code>, hapus isinya, dan tempel kode yang sudah disalin di atas.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-800/60 border border-slate-700/70 p-3.5 rounded-xl space-y-1.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[11px]">3</span>
                  <span>Terapkan Sebagai Aplikasi Web (Deploy)</span>
                </div>
                <div className="text-slate-400 leading-relaxed pl-7 space-y-1">
                  <div>1. Klik tombol biru <strong>Terapkan (Deploy)</strong> di pojok kanan atas &gt; <strong>Penerapan baru (New deployment)</strong>.</div>
                  <div>2. Klik ikon gerigi (Pilih jenis) &gt; pilih <strong>Aplikasi web (Web app)</strong>.</div>
                  <div>3. Jalankan sebagai: <strong>Saya (Me)</strong>.</div>
                  <div>4. Siapa yang memiliki akses: <strong>Siapa saja (Anyone)</strong>.</div>
                  <div>5. Klik <strong>Terapkan</strong>, berikan izin, lalu salin URL yang berakhiran <code>/exec</code> ke kolom di tab sebelumnya!</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-800/90 border-t border-slate-700/80 px-5 py-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
