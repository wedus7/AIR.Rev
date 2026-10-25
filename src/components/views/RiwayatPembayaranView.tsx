import React, { useState } from 'react';
import {
  History,
  Search,
  Printer,
  Send,
  Calendar,
  CreditCard,
  Info,
  Edit3,
  Ban,
  CheckCircle2,
  Clock,
  Filter,
  Scale
} from 'lucide-react';
import { MeterRecord, PaymentTransaction, SystemSettings } from '../../types';
import { formatRupiah, generateWhatsAppMessage } from '../../utils/formatters';
import { PaymentRevisionModal } from '../modals/PaymentRevisionModal';
import { RevisionLogModal } from '../modals/RevisionLogModal';

interface RiwayatPembayaranViewProps {
  transactions: PaymentTransaction[];
  meterRecords: MeterRecord[];
  settings: SystemSettings;
  onPrintReceipt: (transaction: PaymentTransaction) => void;
  onRevisePayment: (
    noTransaksi: string,
    newJumlahBayar: number,
    newMetode: string,
    newKasir: string,
    newKeterangan: string,
    reason: string
  ) => void;
  onCancelPayment: (noTransaksi: string, reason: string) => void;
  onOpenReconciliation?: () => void;
}

export const RiwayatPembayaranView: React.FC<RiwayatPembayaranViewProps> = ({
  transactions,
  meterRecords,
  settings,
  onPrintReceipt,
  onRevisePayment,
  onCancelPayment,
  onOpenReconciliation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [metodeFilter, setMetodeFilter] = useState<'ALL' | 'Tunai' | 'Transfer'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'DIREVISI' | 'DIBATALKAN'>('ALL');

  // Modal states
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Quick cancel prompt state
  const [cancelPromptTx, setCancelPromptTx] = useState<PaymentTransaction | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  const activeTransactions = transactions.filter(t => !t.isCancelled);
  const revisedTransactions = transactions.filter(t => t.isRevised);
  const cancelledTransactions = transactions.filter(t => t.isCancelled);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch =
      t.noTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.idPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMetode =
      metodeFilter === 'ALL' || t.metode === metodeFilter;

    let matchesStatus = true;
    if (statusFilter === 'AKTIF') matchesStatus = !t.isCancelled;
    if (statusFilter === 'DIREVISI') matchesStatus = t.isRevised === true;
    if (statusFilter === 'DIBATALKAN') matchesStatus = t.isCancelled === true;

    return matchesSearch && matchesMetode && matchesStatus;
  });

  // Calculate cash in from active transactions only
  const totalDiterima = filteredTransactions
    .filter(t => !t.isCancelled)
    .reduce((acc, t) => acc + (t.jumlahBayar || 0), 0);

  const handleOpenRevision = (t: PaymentTransaction) => {
    setSelectedTx(t);
    setIsRevisionModalOpen(true);
  };

  const handleOpenCancelPrompt = (t: PaymentTransaction) => {
    setCancelPromptTx(t);
    setCancelReasonInput('Salah input transaksi kasir');
  };

  const handleConfirmCancelPrompt = () => {
    if (!cancelPromptTx) return;
    onCancelPayment(cancelPromptTx.noTransaksi, cancelReasonInput || 'Dibatalkan kasir');
    setCancelPromptTx(null);
  };

  const handleSendWA = (t: PaymentTransaction) => {
    if (t.isCancelled) {
      alert('Transaksi ini telah dibatalkan.');
      return;
    }
    const msg = generateWhatsAppMessage({
      namaUsaha: settings.namaUsaha,
      namaPelanggan: t.namaPelanggan,
      idPelanggan: t.idPelanggan,
      periode: settings.periodeAktif,
      meterLalu: 0,
      meterKini: 0,
      pemakaian: 0,
      tarif: settings.tarifDefault,
      biayaAir: 0,
      tunggakanLalu: 0,
      totalTagihan: t.totalTagihan,
      jumlahBayar: t.jumlahBayar,
      sisaTunggakan: t.sisaTunggakan,
      noTransaksi: t.noTransaksi,
      namaBankRek: settings.namaBankRek,
      catatan: settings.catatanStruk
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              <span>RIWAYAT PEMBAYARAN</span>
            </h2>
            <span className="text-xs bg-slate-700 text-slate-300 font-mono px-2 py-0.5 rounded-full">
              Sheet #6
            </span>
            {revisedTransactions.length > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Edit3 className="w-3 h-3" />
                <span>{revisedTransactions.length} Direvisi</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Buku kas penerimaan & kwitansi kasir. Dilengkapi fitur revisi nominal & pembatalan transaksi salah input.</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenReconciliation && (
            <button
              onClick={onOpenReconciliation}
              className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Cek selisih kas fisik vs sistem"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Rekonsiliasi Kas</span>
            </button>
          )}

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Buku Log Revisi</span>
          </button>

          <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-700/70 text-right self-start sm:self-auto">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Kas Masuk Aktif</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {formatRupiah(totalDiterima)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No TRX, ID, atau Nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 outline-none"
          />
        </div>

        {/* Status & Method Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({transactions.length})
            </button>
            <button
              onClick={() => setStatusFilter('AKTIF')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'AKTIF' ? 'bg-emerald-600/30 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Aktif ({activeTransactions.length})
            </button>
            {revisedTransactions.length > 0 && (
              <button
                onClick={() => setStatusFilter('DIREVISI')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === 'DIREVISI' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Direvisi ({revisedTransactions.length})
              </button>
            )}
            {cancelledTransactions.length > 0 && (
              <button
                onClick={() => setStatusFilter('DIBATALKAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === 'DIBATALKAN' ? 'bg-rose-500/30 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dibatalkan ({cancelledTransactions.length})
              </button>
            )}
          </div>

          {/* Metode filter */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setMetodeFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                metodeFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              Semua Metode
            </button>
            <button
              onClick={() => setMetodeFilter('Tunai')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                metodeFilter === 'Tunai' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
            >
              Tunai
            </button>
            <button
              onClick={() => setMetodeFilter('Transfer')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                metodeFilter === 'Transfer' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'
              }`}
            >
              Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900/90 font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-3">No Transaksi</th>
                <th className="py-3.5 px-3">Tanggal & Waktu</th>
                <th className="py-3.5 px-3">ID Pelanggan</th>
                <th className="py-3.5 px-3">Nama Pelanggan</th>
                <th className="py-3.5 px-3 text-right">Jumlah Bayar</th>
                <th className="py-3.5 px-3 text-right">Sisa Tunggakan</th>
                <th className="py-3.5 px-3 text-center">Metode</th>
                <th className="py-3.5 px-3">Kasir / Status</th>
                <th className="py-3.5 px-3 text-center">Aksi / Revisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada riwayat pembayaran yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isCancelled = t.isCancelled === true;
                  const isRevised = t.isRevised === true;
                  return (
                    <tr
                      key={t.noTransaksi}
                      className={`hover:bg-slate-700/30 transition-colors ${
                        isCancelled ? 'bg-rose-950/20 opacity-70' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold">
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className={isCancelled ? 'text-slate-400 line-through' : 'text-slate-200'}>
                            {t.noTransaksi}
                          </span>
                          <div className="flex items-center gap-1">
                            {isRevised && (
                              <span
                                onClick={() => handleOpenRevision(t)}
                                className="cursor-pointer text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded hover:bg-amber-500/30 transition-colors inline-flex items-center gap-0.5"
                                title={`Direvisi ${t.revisionCount || 1}x: ${t.lastRevisionReason || ''}`}
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>Direvisi</span>
                              </span>
                            )}
                            {isCancelled && (
                              <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                                <Ban className="w-2.5 h-2.5" />
                                <span>Dibatalkan</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">
                        {t.tanggal}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                        {t.idPelanggan}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {t.namaPelanggan}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={isCancelled ? 'text-slate-500 line-through' : 'text-emerald-400'}>
                          {formatRupiah(t.jumlahBayar)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-400">
                        {formatRupiah(t.sisaTunggakan)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          {t.metode}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300 block">{t.kasir}</span>
                        {isCancelled && (
                          <span className="text-[10px] text-rose-400 block truncate max-w-[140px]" title={t.cancelReason}>
                            Alasan: {t.cancelReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Revisi button */}
                          {!isCancelled && (
                            <button
                              onClick={() => handleOpenRevision(t)}
                              className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
                              title="Revisi Nominal / Kasir / Keterangan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Cancel button */}
                          {!isCancelled && (
                            <button
                              onClick={() => handleOpenCancelPrompt(t)}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors"
                              title="Batalkan Transaksi (Void)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Print Receipt */}
                          <button
                            onClick={() => onPrintReceipt(t)}
                            disabled={isCancelled}
                            className="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Cetak Ulang Kwitansi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Send WhatsApp */}
                          <button
                            onClick={() => handleSendWA(t)}
                            disabled={isCancelled}
                            className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Kirim Bukti WA"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Cancel Prompt Modal */}
      {cancelPromptTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-rose-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Ban className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-base text-white">Batalkan Transaksi Pembayaran</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Anda akan membatalkan transaksi <strong className="text-white font-mono">{cancelPromptTx.noTransaksi}</strong> atas nama <strong className="text-white">{cancelPromptTx.namaPelanggan}</strong> sebesar <strong className="text-emerald-400 font-mono">{formatRupiah(cancelPromptTx.jumlahBayar)}</strong>.
              Tagihan pelanggan akan otomatis dikembalikan ke saldo semula.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alasan Pembatalan Transaksi *
              </label>
              <input
                type="text"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="Contoh: Salah input jumlah, salah pelanggan..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-400"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setCancelPromptTx(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelPrompt}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Ya, Batalkan Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Revisi Transaksi */}
      <PaymentRevisionModal
        isOpen={isRevisionModalOpen}
        onClose={() => {
          setIsRevisionModalOpen(false);
          setSelectedTx(null);
        }}
        transaction={selectedTx}
        settings={settings}
        onSaveRevision={onRevisePayment}
        onCancelTransaction={onCancelPayment}
      />

      {/* Modal Log Revisi */}
      <RevisionLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        meterRecords={meterRecords}
        transactions={transactions}
      />
    </div>
  );
};
