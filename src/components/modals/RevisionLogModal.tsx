import React, { useState } from 'react';
import {
  X,
  History,
  Gauge,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { MeterRecord, PaymentTransaction } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';

interface RevisionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  meterRecords: MeterRecord[];
  transactions: PaymentTransaction[];
}

export const RevisionLogModal: React.FC<RevisionLogModalProps> = ({
  isOpen,
  onClose,
  meterRecords,
  transactions
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'meter' | 'payment'>('meter');
  const [searchTerm, setSearchTerm] = useState('');

  // Collect all meter revisions
  const meterRevisions: Array<{
    id: string;
    customerName: string;
    logId: string;
    timestamp: string;
    meterKiniSebelum: number;
    meterKiniSesudah: number;
    meterLaluSebelum?: number;
    meterLaluSesudah?: number;
    pemakaianSebelum?: number;
    pemakaianSesudah?: number;
    alasan: string;
    petugas: string;
    tipe: string;
  }> = [];

  meterRecords.forEach(m => {
    if (m.revisionHistory && m.revisionHistory.length > 0) {
      m.revisionHistory.forEach(log => {
        meterRevisions.push({
          id: m.id,
          customerName: m.nama,
          logId: log.id,
          timestamp: log.timestamp,
          meterKiniSebelum: log.meterKiniSebelum,
          meterKiniSesudah: log.meterKiniSesudah,
          meterLaluSebelum: log.meterLaluSebelum,
          meterLaluSesudah: log.meterLaluSesudah,
          pemakaianSebelum: log.pemakaianSebelum,
          pemakaianSesudah: log.pemakaianSesudah,
          alasan: log.alasan,
          petugas: log.petugas,
          tipe: log.tipe
        });
      });
    } else if (m.isRevised) {
      // Fallback if legacy revised
      meterRevisions.push({
        id: m.id,
        customerName: m.nama,
        logId: `rev-${m.id}`,
        timestamp: m.lastRevisedAt || '-',
        meterKiniSebelum: m.meterLalu,
        meterKiniSesudah: m.meterKini,
        alasan: m.lastRevisionReason || 'Koreksi catatan',
        petugas: 'Admin',
        tipe: 'REVISI_ANGKA'
      });
    }
  });

  // Collect all payment revisions & cancellations
  const paymentRevisions: Array<{
    noTransaksi: string;
    idPelanggan: string;
    namaPelanggan: string;
    timestamp: string;
    jumlahSebelum: number;
    jumlahSesudah: number;
    alasan: string;
    petugas: string;
    status: string;
    isCancelled?: boolean;
  }> = [];

  transactions.forEach(t => {
    if (t.revisionHistory && t.revisionHistory.length > 0) {
      t.revisionHistory.forEach(log => {
        paymentRevisions.push({
          noTransaksi: t.noTransaksi,
          idPelanggan: t.idPelanggan,
          namaPelanggan: t.namaPelanggan,
          timestamp: log.timestamp,
          jumlahSebelum: log.jumlahBayarSebelum,
          jumlahSesudah: log.jumlahBayarSesudah,
          alasan: log.alasan,
          petugas: log.petugas,
          status: 'DIREVISI',
          isCancelled: t.isCancelled
        });
      });
    } else if (t.isRevised) {
      paymentRevisions.push({
        noTransaksi: t.noTransaksi,
        idPelanggan: t.idPelanggan,
        namaPelanggan: t.namaPelanggan,
        timestamp: t.lastRevisedAt || t.tanggal,
        jumlahSebelum: t.jumlahBayar,
        jumlahSesudah: t.jumlahBayar,
        alasan: t.lastRevisionReason || 'Revisi pembayaran',
        petugas: t.kasir,
        status: 'DIREVISI',
        isCancelled: t.isCancelled
      });
    } else if (t.isCancelled) {
      paymentRevisions.push({
        noTransaksi: t.noTransaksi,
        idPelanggan: t.idPelanggan,
        namaPelanggan: t.namaPelanggan,
        timestamp: t.cancelledAt || t.tanggal,
        jumlahSebelum: t.jumlahBayar,
        jumlahSesudah: 0,
        alasan: t.cancelReason || 'Dibatalkan',
        petugas: t.kasir,
        status: 'DIBATALKAN',
        isCancelled: true
      });
    }
  });

  const filteredMeterRevisions = meterRevisions
    .filter(r =>
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.alasan.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const filteredPaymentRevisions = paymentRevisions
    .filter(r =>
      r.noTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.alasan.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Buku Catatan Revisi & Koreksi Data</span>
              </h3>
              <p className="text-xs text-slate-400">
                Riwayat lengkap semua pengeditan dan perbaikan input untuk audit & keamanan data.
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

        {/* Tab & Search Bar */}
        <div className="p-4 bg-slate-850 border-b border-slate-700 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('meter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'meter'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Koreksi Meter ({meterRevisions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'payment'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Koreksi Bayar ({paymentRevisions.length})</span>
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, ID, alasan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Tab Content List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {activeTab === 'meter' ? (
            filteredMeterRevisions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada riwayat koreksi pencatatan meter.
              </div>
            ) : (
              filteredMeterRevisions.map((rev, idx) => (
                <div
                  key={rev.logId || idx}
                  className="p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs space-y-2 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                        {rev.id}
                      </span>
                      <strong className="text-white text-sm">{rev.customerName}</strong>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {rev.timestamp}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Koreksi Angka Meter Kini</span>
                      <div className="flex items-center gap-2 font-mono mt-0.5">
                        <span className="text-slate-400 line-through">
                          {formatNumber(rev.meterKiniSebelum)} m³
                        </span>
                        <span className="text-slate-500">➔</span>
                        <span className="text-amber-300 font-bold">
                          {formatNumber(rev.meterKiniSesudah)} m³
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Alasan Koreksi</span>
                      <span className="text-slate-200 font-medium">{rev.alasan}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span>Petugas: <strong className="text-slate-300">{rev.petugas || 'Admin Air'}</strong></span>
                    <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.2 rounded-full font-semibold">
                      {rev.tipe === 'BATAL_CATAT' ? 'Pembatalan Catat' : 'Revisi Angka'}
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            filteredPaymentRevisions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada riwayat koreksi transaksi pembayaran.
              </div>
            ) : (
              filteredPaymentRevisions.map((rev, idx) => (
                <div
                  key={rev.noTransaksi + idx}
                  className="p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs space-y-2 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        {rev.noTransaksi}
                      </span>
                      <strong className="text-white text-sm">{rev.namaPelanggan} ({rev.idPelanggan})</strong>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {rev.timestamp}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nominal Bayar</span>
                      <div className="flex items-center gap-2 font-mono mt-0.5">
                        <span className="text-slate-400 line-through">
                          {formatRupiah(rev.jumlahSebelum)}
                        </span>
                        <span className="text-slate-500">➔</span>
                        <span className={`font-bold ${rev.isCancelled ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {formatRupiah(rev.jumlahSesudah)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Alasan Koreksi / Pembatalan</span>
                      <span className="text-slate-200 font-medium">{rev.alasan}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span>Kasir/Petugas: <strong className="text-slate-300">{rev.petugas}</strong></span>
                    <span className={`px-2 py-0.2 rounded-full font-semibold ${
                      rev.isCancelled
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {rev.status}
                    </span>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-700/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
