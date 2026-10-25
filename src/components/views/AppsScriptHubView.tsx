import React, { useState, useMemo } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  BookOpen,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Customer, MeterRecord, PaymentTransaction, SystemSettings } from '../../types';
import {
  CODE_GS_CODE,
  API_GS_CODE,
  WEBAPP_HTML_CODE,
  generateSetupGsCode
} from '../../utils/appsScriptCode';
import { formatRupiah } from '../../utils/formatters';

interface AppsScriptHubViewProps {
  settings: SystemSettings;
  customers: Customer[];
  meterRecords: MeterRecord[];
  transactions: PaymentTransaction[];
  onDownloadTemplate: () => void;
}

export const AppsScriptHubView: React.FC<AppsScriptHubViewProps> = ({
  settings,
  customers,
  meterRecords,
  transactions,
  onDownloadTemplate
}) => {
  const [activeFile, setActiveFile] = useState<'setup' | 'code' | 'api' | 'html'>('setup');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Generate Setup.gs dengan 100% data pelanggan aktif Anda (tanpa data sampel standar)
  const setupCode = useMemo(() => {
    return generateSetupGsCode(settings, customers, meterRecords, transactions);
  }, [settings, customers, meterRecords, transactions]);

  // Total kas aktual saat ini
  const totalKasTerkini = useMemo(() => {
    return transactions
      .filter(t => !t.isCancelled)
      .reduce((sum, t) => sum + (t.jumlahBayar || 0), 0);
  }, [transactions]);

  const totalTunggakanTerkini = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.tunggakan || 0), 0);
  }, [customers]);

  const files = [
    {
      id: 'setup' as const,
      fileName: 'Setup.gs',
      desc: `Otomatis membuat ke-7 sheet dengan ${customers.length} data resmi pelanggan Kp. Maja, kas ${formatRupiah(totalKasTerkini)}, tarif Rp ${settings.tarifDefault.toLocaleString('id-ID')}, dan formula presisi.`,
      code: setupCode,
      tag: '100% DATA RESMI TERBARU'
    },
    {
      id: 'code' as const,
      fileName: 'Code.gs',
      desc: 'Backend logika: Menu kustom "💧 AIR System", Catat Meter, Revisi Meter, Pembayaran, Pembatalan Kas (Void), dan Tutup Periode.',
      code: CODE_GS_CODE,
      tag: 'MENU & LOGIKA GOOGLE SHEET'
    },
    {
      id: 'api' as const,
      fileName: 'Api.gs',
      desc: 'Endpoint Web App (doGet / doPost) untuk sinkronisasi langsung antara HP Android dan Spreadsheet Anda.',
      code: API_GS_CODE,
      tag: 'REST API & KONEKSI HP'
    },
    {
      id: 'html' as const,
      fileName: 'WebApp.html',
      desc: 'Antarmuka Web App mandiri siap deploy di script.google.com untuk HP Android petugas.',
      code: WEBAPP_HTML_CODE,
      tag: 'TAMPILAN WEB APP HP'
    }
  ];

  const currentFile = files.find(f => f.id === activeFile)!;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-800 to-cyan-950/60 border border-cyan-800/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Code2 className="w-3.5 h-3.5" />
            <span>Google Apps Script & Spreadsheet Center</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Kode Google Apps Script Resmi (Data Kp. Maja)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Semua data standar/sampel lama telah dihapus sepenuhnya. Skrip di bawah ini menggunakan <strong>100% data resmi Anda</strong> (18 Pelanggan Kp. Maja, kas aktual Rp 570.000, serta fitur revisi dan pembatalan kas tanpa keliru).
          </p>
        </div>

        {/* Status Snapshot Banner */}
        <div className="mt-4 pt-3 border-t border-cyan-800/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-cyan-900/40">
            <span className="text-slate-400 block text-[10px]">Data Pelanggan</span>
            <span className="font-bold text-white text-sm">{customers.length} Pelanggan</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-cyan-900/40">
            <span className="text-slate-400 block text-[10px]">Tarif Aktif</span>
            <span className="font-bold text-cyan-400 text-sm">{formatRupiah(settings.tarifDefault)}/m³</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-cyan-900/40">
            <span className="text-slate-400 block text-[10px]">Kas Diterima</span>
            <span className="font-bold text-emerald-400 text-sm">{formatRupiah(totalKasTerkini)}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-cyan-900/40">
            <span className="text-slate-400 block text-[10px]">Total Tunggakan</span>
            <span className="font-bold text-amber-400 text-sm">{formatRupiah(totalTunggakanTerkini)}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={onDownloadTemplate}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Unduh File Spreadsheet Template (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 4 Langkah Pemasangan Step-by-Step */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Panduan Langkah Demi Langkah (Step-by-Step Tanpa Keliru)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Langkah 1 */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </span>
            <p className="font-bold text-white text-sm">Buka Google Sheets</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Buka Google Sheets baru di browser (ketik <code>sheets.new</code>) di akun Google Anda.
            </p>
          </div>

          {/* Langkah 2 */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
              2
            </span>
            <p className="font-bold text-white text-sm">Buka Apps Script</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Di menu atas Google Sheets, klik menu <strong>Ekstensi</strong> &gt; <strong>Apps Script</strong>.
            </p>
          </div>

          {/* Langkah 3 */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
              3
            </span>
            <p className="font-bold text-white text-sm">Tempel Script</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Buat file <code>Setup.gs</code> dan <code>Code.gs</code> di Apps Script, lalu klik <strong>Salin Semua Kode</strong> di tab bawah.
            </p>
          </div>

          {/* Langkah 4 */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
              4
            </span>
            <p className="font-bold text-white text-sm">Jalankan Setup</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Pilih fungsi <code>setupSemuaSheet</code> lalu klik <strong>Jalankan</strong>. Seluruh 7 sheet dan 18 data pelanggan otomatis terbuat!
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Pilihan File Script */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => setActiveFile(file.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFile === file.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{file.fileName}</span>
            </button>
          ))}
        </div>

        {/* Code Viewer Container */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header File Info */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-cyan-400">
                  {currentFile.fileName}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {currentFile.tag}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentFile.desc}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDownloadFile(currentFile.fileName, currentFile.code)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                title="Unduh file script"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Unduh File</span>
              </button>
              
              <button
                onClick={() => handleCopy(currentFile.code, currentFile.id)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all active:scale-95"
              >
                {copiedKey === currentFile.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Semua Kode</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pre Code Box */}
          <div className="relative max-h-[520px] overflow-auto p-4 bg-slate-950 text-slate-300 font-mono text-xs leading-relaxed select-all">
            <pre>
              <code>{currentFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
