import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Database,
  Download,
  Upload,
  RotateCcw,
  Globe,
  Info,
  ExternalLink,
  GitBranch,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { SystemSettings, GoogleSyncConfig, Customer, MeterRecord, PaymentTransaction } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface SettingViewProps {
  settings: SystemSettings;
  customers?: Customer[];
  meterRecords?: MeterRecord[];
  transactions?: PaymentTransaction[];
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onExportJson: () => void;
  onImportJson: (jsonString: string) => void;
  onResetDefault: () => void;
  syncConfig: GoogleSyncConfig;
  onUpdateSyncConfig: (config: GoogleSyncConfig) => void;
  onTestSync: () => void;
}

export const SettingView: React.FC<SettingViewProps> = ({
  settings,
  customers = [],
  meterRecords = [],
  transactions = [],
  onUpdateSettings,
  onExportJson,
  onImportJson,
  onResetDefault,
  syncConfig,
  onUpdateSyncConfig,
  onTestSync
}) => {
  const [formSettings, setFormSettings] = useState<SystemSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [webAppUrlInput, setWebAppUrlInput] = useState(syncConfig.webAppUrl || '');
  const [copiedGit, setCopiedGit] = useState(false);
  const [copiedDataForAi, setCopiedDataForAi] = useState(false);

  const gitSnippet = `git init\ngit add .\ngit commit -m "feat: inisialisasi distribusi air kp maja dengan 18 pelanggan resmi"\ngit branch -M main\ngit remote add origin https://github.com/USERNAME/REPO_NAME.git\ngit push -u origin main`;

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(gitSnippet);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2500);
  };

  const handleCopyDataForAi = () => {
    const payload = {
      settings,
      customers,
      meterRecords,
      transactions,
      exportedAt: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedDataForAi(true);
    setTimeout(() => setCopiedDataForAi(false), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...formSettings,
      tarifDefault: Number(formSettings.tarifDefault) || 19000
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveSync = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSyncConfig({
      ...syncConfig,
      webAppUrl: webAppUrlInput.trim()
    });
    alert('URL Web App Google Apps Script berhasil disimpan!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onImportJson(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span>SETTING SISTEM</span>
            </h2>
            <span className="text-xs bg-slate-700 text-slate-300 font-mono px-2 py-0.5 rounded-full">
              Sheet #7
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Pengaturan Tarif Default (B1), Nama Usaha (B2), dan parameter operasional distribusi air.</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom 1: Pengaturan Utama Google Sheets SETTING!A1:B7 */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <span>Konfigurasi Nilai Sheet SETTING</span>
            </h3>
            <span className="text-xs text-cyan-400 font-mono">SETTING!A1:B7</span>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Pengaturan berhasil diperbarui dan disimpan!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Tarif Air Default */}
            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-white">
                  Tarif Air (Rp / m³) *
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">Cell B1</span>
              </div>
              <input
                type="number"
                min="0"
                step="500"
                value={formSettings.tarifDefault}
                onChange={(e) => setFormSettings({ ...formSettings, tarifDefault: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-lg font-bold text-cyan-300 font-mono outline-none"
                required
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                💡 <em>Jika sewaktu-waktu ada penyesuaian atau kenaikan tarif, cukup ubah nominal di sini lalu klik "Simpan Pengaturan". Seluruh tagihan pemakaian air periode berjalan akan otomatis disesuaikan seketika.</em>
              </p>
            </div>

            {/* A2 & B2: Nama Usaha */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  A2: Nama Usaha - Cell B2 *
                </label>
                <span className="text-[10px] text-slate-400">SETTING!B2</span>
              </div>
              <input
                type="text"
                value={formSettings.namaUsaha}
                onChange={(e) => setFormSettings({ ...formSettings, namaUsaha: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
                required
              />
            </div>

            {/* Periode Aktif */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                A3: Periode Aktif - Cell B3
              </label>
              <input
                type="text"
                value={formSettings.periodeAktif}
                onChange={(e) => setFormSettings({ ...formSettings, periodeAktif: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            {/* Alamat Usaha */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                A4: Alamat Usaha - Cell B4
              </label>
              <input
                type="text"
                value={formSettings.alamatUsaha}
                onChange={(e) => setFormSettings({ ...formSettings, alamatUsaha: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            {/* Kontak No WA */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                A5: Kontak / No WhatsApp Admin - Cell B5
              </label>
              <input
                type="text"
                value={formSettings.kontakHp}
                onChange={(e) => setFormSettings({ ...formSettings, kontakHp: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none font-mono"
              />
            </div>

            {/* Catatan Struk */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                A6: Catatan Pada Kwitansi / Struk - Cell B6
              </label>
              <textarea
                rows={2}
                value={formSettings.catatanStruk}
                onChange={(e) => setFormSettings({ ...formSettings, catatanStruk: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none resize-none"
              />
            </div>

            {/* Rekening Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                A7: Info Rekening Bank / Pembayaran - Cell B7
              </label>
              <input
                type="text"
                value={formSettings.namaBankRek}
                onChange={(e) => setFormSettings({ ...formSettings, namaBankRek: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-cyan-600/30 transition-all active:scale-95 text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Setting</span>
            </button>
          </form>
        </div>

        {/* Kolom 2: Sinkronisasi Google Apps Script & Cadangan Data */}
        <div className="space-y-6">
          {/* Card Sinkronisasi Google Apps Script Web App URL */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Koneksi Google Apps Script Web App</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jika Anda telah men-deploy file <code>Api.gs</code> sebagai Aplikasi Web di Google Apps Script, masukkan URL-nya di sini untuk sinkronisasi dua arah langsung ke spreadsheet Anda.
            </p>

            <form onSubmit={handleSaveSync} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google Apps Script Web App URL (doGet/doPost)
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={webAppUrlInput}
                  onChange={(e) => setWebAppUrlInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Simpan URL
                </button>
                <button
                  type="button"
                  onClick={onTestSync}
                  className="bg-slate-700/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Buka Panel Sinkronisasi Live</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card Backup & Restore JSON */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Cadangan & Pemulihan Data (Backup)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Simpan seluruh data sistem (Pelanggan, Meter, Transaksi, dan Setting) dalam format file JSON agar aman jika berganti browser/perangkat.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onExportJson}
                className="bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-600"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export JSON</span>
              </button>

              <label className="bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-600 cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Tombol Salin Data Aktif untuk AI */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyDataForAi}
                className="w-full bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 hover:border-cyan-500 rounded-xl py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {copiedDataForAi ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Data Aktif Berhasil Disalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Salin Data Aktif untuk Chat AI (Bikin Bawaan Kode)</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Tekan tombol ini lalu tempel (paste) di chat AI jika Anda ingin data yang baru saja Anda input dijadikan data bawaan permanen di file script.
              </p>
            </div>

            <div className="border-t border-slate-700/60 pt-4">
              <button
                onClick={() => {
                  if (window.confirm('Yakin ingin mereset seluruh data kembali ke data resmi 18 Pelanggan Kp. Maja (Kas Rp 570.000)?')) {
                    onResetDefault();
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Data Resmi Kp. Maja</span>
              </button>
            </div>
          </div>

          {/* Card Panduan Remix & Ekspor GitHub */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span>Status Remix & Ekspor GitHub</span>
              </h3>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Data Terkunci 100%
              </span>
            </div>

            {/* Box Penjelasan Remix vs Memori Browser */}
            <div className="bg-amber-950/30 border border-amber-600/40 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Kenapa Saat di-Remix Masih Pakai Data Lama?</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tombol <strong>Remix</strong> menyalin file kode sumber (script), sedangkan data yang Anda ketik/input di halaman tersimpan di penyimpanan lokal browser (<strong>localStorage</strong>). Karena hasil Remix berada di link URL baru, browser memulai penyimpanan dari nol dan memanggil data awal script.
              </p>
              <div className="text-[11px] text-cyan-300 pt-1 font-semibold space-y-1">
                <div>👉 <strong>Solusi Cepat:</strong> Klik <em>Export JSON</em> di sini, lalu di aplikasi hasil Remix klik <em>Import JSON</em>.</div>
                <div>👉 <strong>Solusi Permanen:</strong> Klik <em>Salin Data Aktif untuk Chat AI</em> di atas, lalu tempel di chat agar kami tanam ke file script bawaan.</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Seluruh konstanta awal kode aplikasi telah dikunci ke data asli: <strong>18 Pelanggan Kp. Maja</strong>, tarif <strong>Rp 19.000/m³</strong>, dan kas riil <strong>Rp 570.000</strong>.
            </p>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <p>
                  <strong>Untuk Remix di AI Studio:</strong> Klik tombol <strong>Remix</strong> di pojok kanan atas AI Studio. Salinan baru akan langsung otomatis memuat data asli Kp. Maja tanpa khawatir data kosong atau kembali ke dummy.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <p>
                  <strong>Untuk Ekspor ke GitHub:</strong> Gunakan menu <strong>Export / Push to GitHub</strong> pada antarmuka AI Studio, atau gunakan terminal dengan instruksi git di bawah ini.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Perintah Terminal Git:</span>
                <button
                  type="button"
                  onClick={handleCopyGitCommands}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {copiedGit ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Perintah</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {gitSnippet}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
