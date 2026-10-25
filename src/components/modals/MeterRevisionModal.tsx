import React, { useState, useRef } from 'react';
import {
  X,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Camera,
  History,
  Info,
  Save,
  ArrowRight,
  ShieldAlert,
  Edit3
} from 'lucide-react';
import { Customer, MeterRecord, SystemSettings } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';

interface MeterRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MeterRecord | null;
  customer?: Customer;
  settings: SystemSettings;
  onSaveRevision: (
    id: string,
    newMeterKini: number,
    newMeterLalu: number,
    reason: string,
    fotoMeter?: string,
    petugas?: string
  ) => void;
  onResetRecord: (id: string, reason: string) => void;
}

const COMMON_REASONS = [
  'Salah ketik angka meter',
  'Keliru membaca angka meter fisik',
  'Koreksi setelah pengecekan ulang',
  'Tertukar dengan meteran rumah lain',
  'Meteran diganti baru / rusak',
  'Koreksi mandiri kasir'
];

export const MeterRevisionModal: React.FC<MeterRevisionModalProps> = ({
  isOpen,
  onClose,
  record,
  customer,
  settings,
  onSaveRevision,
  onResetRecord
}) => {
  if (!isOpen || !record) return null;

  const [meterKini, setMeterKini] = useState<number>(record.meterKini);
  const [meterLalu, setMeterLalu] = useState<number>(record.meterLalu);
  const [isEditMeterLalu, setIsEditMeterLalu] = useState(false);
  const [fotoMeter, setFotoMeter] = useState<string | undefined>(record.fotoMeter);
  const [reason, setReason] = useState<string>('Salah ketik angka meter');
  const [customReason, setCustomReason] = useState<string>('');
  const [petugas, setPetugas] = useState<string>('Admin Air');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetReason, setResetReason] = useState('Salah input data pelanggan');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computations
  const oldPemakaian = record.pemakaian || 0;
  const newPemakaian = Math.max(0, meterKini - meterLalu);
  const diffPemakaian = newPemakaian - oldPemakaian;

  const oldBiayaAir = record.biayaAir || 0;
  const newBiayaAir = newPemakaian * settings.tarifDefault;

  const tunggakanLalu = record.tunggakanLalu || 0;
  const newTotalTagihan = newBiayaAir + tunggakanLalu;
  const terbayar = record.terbayar || 0;
  const newSisaTagihan = Math.max(0, newTotalTagihan - terbayar);
  const newStatus = newSisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS';

  // Warnings
  const isNegative = meterKini < meterLalu;
  const isSpike = newPemakaian > 40;

  const finalReason = reason === 'Lainnya' ? customReason.trim() || 'Koreksi data' : reason;

  // Photo handlers
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setFotoMeter(canvas.toDataURL('image/jpeg', 0.65));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNegative) {
      alert(`Angka Meter Kini (${meterKini}) tidak boleh lebih kecil dari Meter Lalu (${meterLalu})!`);
      return;
    }
    if (!finalReason) {
      alert('Harap pilih atau tuliskan alasan revisi.');
      return;
    }

    onSaveRevision(
      record.id,
      meterKini,
      meterLalu,
      finalReason,
      fotoMeter,
      petugas
    );
    onClose();
  };

  const handleConfirmReset = () => {
    onResetRecord(record.id, resetReason);
    setIsResetConfirmOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Revisi & Koreksi Catatan Meter</span>
                <span className="text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  {record.id}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pelanggan: <strong className="text-slate-200">{record.nama}</strong> • Periode: <strong className="text-cyan-400">{settings.periodeAktif}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Alert if previously revised */}
          {record.isRevised && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <History className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold block">Catatan ini pernah direvisi {record.revisionCount || 1}x sebelumnya</span>
                <span className="text-slate-300">
                  Terakhir: {record.lastRevisionReason || '-'} {record.lastRevisedAt ? `(${record.lastRevisedAt.split('T')[0]})` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Warning Safeguard for Spikes / Anomaly */}
          {isSpike && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="block font-bold">⚠️ Perhatian: Pemakaian Tinggi ({newPemakaian} m³)</strong>
                <span>
                  Pemakaian terhitung tinggi. Mohon teliti kembali apakah ada kelebihan angka 0 atau salah lihat angka meteran sebelum menyimpan.
                </span>
              </div>
            </div>
          )}

          {isNegative && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <strong className="block font-bold">❌ Error: Meter Kini Lebih Kecil Dari Meter Lalu!</strong>
                <span>
                  Meter kini ({meterKini}) tidak boleh kurang dari meter lalu ({meterLalu}). Jika meteran fisik baru diganti atau direset, sesuaikan meter lalu terlebih dahulu.
                </span>
              </div>
            </div>
          )}

          {/* Form Inputs: Angka Meter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-900/70 p-4 rounded-xl border border-slate-700/70">
            {/* Meter Lalu */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Meter Lalu (Awal)
                </label>
                <button
                  type="button"
                  onClick={() => setIsEditMeterLalu(!isEditMeterLalu)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                >
                  {isEditMeterLalu ? 'Batal Koreksi Lalu' : 'Koreksi Meter Lalu?'}
                </button>
              </div>

              {isEditMeterLalu ? (
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={meterLalu}
                  onChange={(e) => setMeterLalu(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border-2 border-cyan-500/50 rounded-xl px-3 py-2 text-base font-bold text-white font-mono text-right"
                  required
                />
              ) : (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="font-mono text-base font-bold text-slate-300">
                    {formatNumber(meterLalu)}
                  </span>
                  <span className="text-xs text-slate-500">m³ (Terkunci)</span>
                </div>
              )}
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isEditMeterLalu ? 'Mengubah meter lalu juga akan memperbarui data pelanggan.' : 'Diambil dari meter awal bulan lalu.'}
              </span>
            </div>

            {/* Meter Kini (Baru) */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Meter Kini Hasil Revisi *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={meterKini}
                onChange={(e) => setMeterKini(Number(e.target.value) || 0)}
                className={`w-full bg-slate-950 border-2 rounded-xl px-3 py-2 text-lg font-bold font-mono text-right outline-none transition-colors ${
                  isNegative
                    ? 'border-rose-500 text-rose-300'
                    : 'border-amber-500 focus:border-amber-400 text-white'
                }`}
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Sebelumnya tercatat: <strong className="text-slate-300 font-mono">{formatNumber(record.meterKini)} m³</strong>
              </span>
            </div>
          </div>

          {/* Live Comparison Box (Sebelum vs Sesudah) */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/80 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Perbandingan Dampak Tagihan
            </span>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-slate-400">Rincian</div>
              <div className="text-right text-slate-400">Tercatat Sebelumnya</div>
              <div className="text-right text-amber-300 font-bold">Setelah Revisi</div>

              {/* Pemakaian */}
              <div className="text-slate-300">Pemakaian:</div>
              <div className="text-right font-mono text-slate-300">
                {formatNumber(oldPemakaian)} m³
              </div>
              <div className="text-right font-mono font-bold text-amber-300">
                {formatNumber(newPemakaian)} m³
                {diffPemakaian !== 0 && (
                  <span className={`text-[10px] ml-1 ${diffPemakaian > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ({diffPemakaian > 0 ? `+${diffPemakaian}` : diffPemakaian} m³)
                  </span>
                )}
              </div>

              {/* Biaya Air */}
              <div className="text-slate-300">Biaya Air:</div>
              <div className="text-right font-mono text-slate-300">
                {formatRupiah(oldBiayaAir)}
              </div>
              <div className="text-right font-mono font-bold text-white">
                {formatRupiah(newBiayaAir)}
              </div>

              {/* Tunggakan Lalu */}
              <div className="text-slate-300">Tunggakan Lalu:</div>
              <div className="text-right font-mono text-rose-400">
                {formatRupiah(tunggakanLalu)}
              </div>
              <div className="text-right font-mono text-rose-400">
                {formatRupiah(tunggakanLalu)}
              </div>

              {/* Total Tagihan */}
              <div className="text-slate-100 font-bold border-t border-slate-700 pt-1.5">
                Total Tagihan:
              </div>
              <div className="text-right font-mono text-slate-300 border-t border-slate-700 pt-1.5">
                {formatRupiah(record.totalTagihan)}
              </div>
              <div className="text-right font-mono font-bold text-cyan-400 text-sm border-t border-slate-700 pt-1.5">
                {formatRupiah(newTotalTagihan)}
              </div>

              {/* Terbayar & Sisa Tagihan */}
              {terbayar > 0 && (
                <>
                  <div className="text-slate-300">Sudah Terbayar:</div>
                  <div className="text-right font-mono text-emerald-400">
                    {formatRupiah(terbayar)}
                  </div>
                  <div className="text-right font-mono text-emerald-400">
                    {formatRupiah(terbayar)}
                  </div>

                  <div className="text-slate-100 font-bold">Sisa Tagihan:</div>
                  <div className="text-right font-mono text-slate-300">
                    {formatRupiah(record.sisaTagihan)}
                  </div>
                  <div className="text-right font-mono font-bold text-rose-300">
                    {formatRupiah(newSisaTagihan)} ({newStatus})
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Foto Meteran */}
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Foto Bukti Fisik Meteran (Opsional)</span>
              </span>
              {fotoMeter && (
                <button
                  type="button"
                  onClick={() => setFotoMeter(undefined)}
                  className="text-[11px] text-rose-400 hover:text-rose-300"
                >
                  Hapus Foto
                </button>
              )}
            </div>

            {fotoMeter ? (
              <div className="flex items-center gap-3">
                <img
                  src={fotoMeter}
                  alt="Bukti Meter"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-600"
                />
                <div className="flex-1">
                  <span className="text-xs text-slate-300 block font-medium">Foto bukti terlampir</span>
                  <label
                    htmlFor="camera-revision"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer underline"
                  >
                    Ganti dengan foto baru
                  </label>
                </div>
              </div>
            ) : (
              <label
                htmlFor="camera-revision"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-dashed border-slate-600 hover:border-cyan-400 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Unggah Foto Bukti Baru</span>
              </label>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
              id="camera-revision"
            />
          </div>

          {/* Alasan Revisi */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Alasan Revisi / Koreksi *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors border ${
                    reason === r
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setReason('Lainnya')}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors border ${
                  reason === 'Lainnya'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Lainnya...
              </button>
            </div>

            {reason === 'Lainnya' && (
              <input
                type="text"
                placeholder="Tuliskan alasan koreksi..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                required
              />
            )}
          </div>

          {/* Petugas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Petugas / Surveyor yang Merevisi
              </label>
              <input
                type="text"
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                required
              />
            </div>

            {/* Riwayat Revisi Summary */}
            {record.revisionHistory && record.revisionHistory.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Riwayat Koreksi ({record.revisionHistory.length})</span>
                </label>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-700 max-h-20 overflow-y-auto text-[10px] space-y-1 text-slate-300 font-mono">
                  {record.revisionHistory.map((h, i) => (
                    <div key={h.id || i} className="border-b border-slate-800 pb-1 last:border-0 last:pb-0">
                      <span className="text-cyan-400">{h.timestamp.split(' ')[0]}</span>: {h.meterKiniSebelum} ➔ {h.meterKiniSesudah} m³ ({h.alasan})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirmation Box for Reset Record */}
          {isResetConfirmOpen ? (
            <div className="p-4 bg-rose-500/15 border-2 border-rose-500/50 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Konfirmasi Batalkan Catatan Meter</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Tindakan ini akan mengembalikan status pelanggan <strong className="text-white">{record.nama}</strong> menjadi <strong>"Belum Dicatat"</strong> dan mengosongkan angka meter kini.
                  </p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Alasan pembatalan catatan..."
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
              />

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Ya, Batalkan Catatan
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Batal Catat (Reset ke Belum Dicatat)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-750"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isNegative}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
