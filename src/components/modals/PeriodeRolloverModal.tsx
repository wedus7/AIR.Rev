import React, { useState } from 'react';
import { RefreshCw, X, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Customer, MeterRecord, SystemSettings } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';

interface PeriodeRolloverModalProps {
  settings: SystemSettings;
  customers: Customer[];
  meterRecords: MeterRecord[];
  onConfirmRollover: (newPeriodName: string) => void;
  onClose: () => void;
}

export const PeriodeRolloverModal: React.FC<PeriodeRolloverModalProps> = ({
  settings,
  customers,
  meterRecords,
  onConfirmRollover,
  onClose
}) => {
  // Suggest next month name
  const currentPeriod = settings.periodeAktif;
  const [newPeriod, setNewPeriod] = useState(() => {
    const parts = currentPeriod.split(' ');
    if (parts.length === 2) {
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const mIdx = monthNames.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
      if (mIdx !== -1) {
        const nextIdx = (mIdx + 1) % 12;
        const nextYear = nextIdx === 0 ? parseInt(parts[1], 10) + 1 : parts[1];
        return `${monthNames[nextIdx]} ${nextYear}`;
      }
    }
    return 'Bulan Baru';
  });

  const [confirmedCheck, setConfirmedCheck] = useState(false);

  // Compute preview metrics
  const totalTunggakanBaru = meterRecords.reduce((acc, m) => {
    // If not paid, remaining unpaid bill becomes new arrears
    return acc + (m.totalTagihan - m.terbayar);
  }, 0);

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriod.trim()) return;
    onConfirmRollover(newPeriod.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Tutup Periode & Ganti Bulan
            </h3>
            <p className="text-xs text-slate-400">
              Prosedur pergantian buku bulanan distribusi air
            </p>
          </div>
        </div>

        {/* Warning Alert Box */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-2 mb-4">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Pemberitahuan Otomatisasi Sistem:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li>
              <strong>Meter Kini</strong> setiap pelanggan akan dipindahkan otomatis menjadi <strong>Meter Awal</strong> di sheet <code>DATA PELANGGAN</code>.
            </li>
            <li>
              Sisa tagihan yang belum terbayar akan diakumulasikan menjadi <strong>Tunggakan</strong> baru.
            </li>
            <li>
              Sheet <code>INPUT METER</code> akan direset bersih untuk pencatatan meteran bulan baru.
            </li>
            <li>
              Catatan di <code>RIWAYAT PEMBAYARAN</code> tetap tersimpan sebagai arsip pembukuan kas.
            </li>
          </ul>
        </div>

        <form onSubmit={handleExecute} className="space-y-4">
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Periode Saat Ini:</span>
              <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">
                {currentPeriod}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cyan-300 mb-1">
                Nama Periode Baru (SETTING!B3) *
              </label>
              <input
                type="text"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
                placeholder="Contoh: November 2026"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white font-medium outline-none"
                required
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={confirmedCheck}
              onChange={(e) => setConfirmedCheck(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <span>
              Saya telah memeriksa laporan bulan ini dan menyetujui rollover meter serta akumulasi tunggakan ke periode baru.
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!confirmedCheck}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold shadow-md shadow-amber-600/30 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Eksekusi Tutup Periode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
