import React, { useState } from 'react';
import {
  X,
  CreditCard,
  AlertTriangle,
  History,
  Save,
  Ban,
  RotateCcw,
  CheckCircle2,
  Receipt,
  User
} from 'lucide-react';
import { PaymentTransaction, SystemSettings } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';

interface PaymentRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
  settings: SystemSettings;
  onSaveRevision: (
    noTransaksi: string,
    newJumlahBayar: number,
    newMetode: string,
    newKasir: string,
    newKeterangan: string,
    reason: string
  ) => void;
  onCancelTransaction: (noTransaksi: string, reason: string) => void;
}

const COMMON_PAYMENT_REASONS = [
  'Salah ketik nominal bayar',
  'Salah pilih metode (Tunai/Transfer)',
  'Koreksi uang kembalian',
  'Input dobel / ganda',
  'Permintaan koreksi pelanggan',
  'Koreksi kasir'
];

export const PaymentRevisionModal: React.FC<PaymentRevisionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  settings,
  onSaveRevision,
  onCancelTransaction
}) => {
  if (!isOpen || !transaction) return null;

  const [jumlahBayar, setJumlahBayar] = useState<number>(transaction.jumlahBayar);
  const [metode, setMetode] = useState<string>(transaction.metode);
  const [kasir, setKasir] = useState<string>(transaction.kasir);
  const [keterangan, setKeterangan] = useState<string>(transaction.keterangan);
  const [reason, setReason] = useState<string>('Salah ketik nominal bayar');
  const [customReason, setCustomReason] = useState<string>('');
  
  // Cancel / Void state
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Input ganda / salah input pelanggan');

  const oldBayar = transaction.jumlahBayar;
  const numBayar = Number(jumlahBayar) || 0;
  const selisih = numBayar - oldBayar;

  // New remaining balance for this transaction's context
  const newSisaTunggakan = Math.max(0, transaction.totalTagihan - numBayar);
  const newStatus = newSisaTunggakan <= 0 ? 'LUNAS' : 'CICILAN';

  const finalReason = reason === 'Lainnya' ? customReason.trim() || 'Koreksi pembayaran' : reason;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (numBayar <= 0) {
      alert('Jumlah bayar tidak boleh 0 atau minus! Jika ingin membatalkan transaksi, gunakan tombol Batalkan Transaksi di bawah.');
      return;
    }
    if (!finalReason) {
      alert('Harap pilih atau isi alasan revisi.');
      return;
    }

    onSaveRevision(
      transaction.noTransaksi,
      numBayar,
      metode,
      kasir,
      keterangan,
      finalReason
    );
    onClose();
  };

  const handleConfirmCancel = () => {
    onCancelTransaction(transaction.noTransaksi, cancelReason);
    setIsCancelConfirmOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Revisi Catatan Pembayaran</span>
                <span className="text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                  {transaction.noTransaksi}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pelanggan: <strong className="text-slate-200">{transaction.namaPelanggan} ({transaction.idPelanggan})</strong>
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
          {transaction.isCancelled && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <Ban className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Transaksi ini sudah berstatus <strong>DIBATALKAN</strong> ({transaction.cancelReason || 'Tidak ada keterangan'})</span>
            </div>
          )}

          {transaction.isRevised && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <History className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold block">Transaksi ini pernah direvisi {transaction.revisionCount || 1}x sebelumnya</span>
                <span className="text-slate-300">
                  Alasan: {transaction.lastRevisionReason || '-'}
                </span>
              </div>
            </div>
          )}

          {/* Form Input: Nominal Bayar */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-200">
                Jumlah Bayar Hasil Koreksi *
              </label>
              <span className="text-[11px] text-slate-400">
                Tercatat sebelumnya: <strong className="text-slate-200 font-mono">{formatRupiah(oldBayar)}</strong>
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                Rp
              </span>
              <input
                type="number"
                min="1"
                step="500"
                value={jumlahBayar}
                onChange={(e) => setJumlahBayar(Number(e.target.value))}
                className="w-full bg-slate-950 border-2 border-cyan-500/50 focus:border-cyan-400 rounded-xl pl-12 pr-4 py-2.5 text-xl font-mono font-bold text-white text-right outline-none"
                required
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setJumlahBayar(transaction.totalTagihan)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 rounded-lg border border-slate-700 font-medium"
              >
                Uang Pas ({formatRupiah(transaction.totalTagihan)})
              </button>
              {[20000, 50000, 100000, 200000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setJumlahBayar(amt)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 font-mono"
                >
                  {formatNumber(amt / 1000)}k
                </button>
              ))}
            </div>
          </div>

          {/* Impact preview */}
          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-700/80 text-xs space-y-2">
            <span className="font-bold text-slate-300 block mb-1">
              Dampak Penyesuaian Saldo Kas & Tagihan:
            </span>
            <div className="flex justify-between items-center text-slate-300">
              <span>Total Tagihan Awal Transaksi:</span>
              <span className="font-mono text-white font-bold">{formatRupiah(transaction.totalTagihan)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Selisih Pembayaran (Efek Kas):</span>
              <span className={`font-mono font-bold ${selisih > 0 ? 'text-emerald-400' : selisih < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {selisih > 0 ? `+${formatRupiah(selisih)}` : formatRupiah(selisih)}
              </span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between items-center font-semibold">
              <span className="text-slate-200">Sisa Tunggakan Transaksi:</span>
              <span className="font-mono text-cyan-300">
                {formatRupiah(newSisaTunggakan)} ({newStatus})
              </span>
            </div>
          </div>

          {/* Metode & Kasir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
              >
                <option value="Tunai">Tunai</option>
                <option value="Transfer">Transfer Bank / QRIS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Petugas / Kasir
              </label>
              <input
                type="text"
                value={kasir}
                onChange={(e) => setKasir(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                required
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Keterangan Pembayaran
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
            />
          </div>

          {/* Alasan Revisi */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Alasan Koreksi Transaksi *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PAYMENT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors border ${
                    reason === r
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
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
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Lainnya...
              </button>
            </div>

            {reason === 'Lainnya' && (
              <input
                type="text"
                placeholder="Tulis alasan revisi pembayaran..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                required
              />
            )}
          </div>

          {/* Confirmation Box for Cancelling / Voiding Payment */}
          {isCancelConfirmOpen ? (
            <div className="p-4 bg-rose-500/15 border-2 border-rose-500/50 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Konfirmasi Batalkan Transaksi Ini (Void)</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Uang masuk sebesar <strong className="text-emerald-400">{formatRupiah(transaction.jumlahBayar)}</strong> akan dibatalkan, dan tagihan pelanggan <strong className="text-white">{transaction.namaPelanggan}</strong> akan dikembalikan utuh ke status belum bayar.
                  </p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Alasan pembatalan transaksi (wajib)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                required
              />

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Ya, Batalkan Transaksi</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(true)}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Batalkan Transaksi (Void)</span>
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
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Revisi Pembayaran</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
