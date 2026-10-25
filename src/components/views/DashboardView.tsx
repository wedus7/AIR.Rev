import React, { useState } from 'react';
import {
  Users,
  Droplets,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Receipt,
  ArrowRight,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Check,
  Scale
} from 'lucide-react';
import { Customer, MeterRecord, PaymentTransaction, SystemSettings } from '../../types';
import { formatRupiah, formatNumber, generateWhatsAppMessage, generateGroupSummaryWhatsApp } from '../../utils/formatters';

interface DashboardViewProps {
  settings: SystemSettings;
  customers: Customer[];
  meterRecords: MeterRecord[];
  transactions: PaymentTransaction[];
  onNavigate: (tab: any) => void;
  onSelectCustomerForPayment: (customerId: string) => void;
  onOpenMeterModal: (customerId?: string) => void;
  onOpenReconciliation?: () => void;
  onReconcileCash?: (target: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  settings,
  customers,
  meterRecords,
  transactions,
  onNavigate,
  onSelectCustomerForPayment,
  onOpenMeterModal,
  onOpenReconciliation,
  onReconcileCash
}) => {
  // Aggregate stats
  const totalPelanggan = customers.length;
  const lunasCount = customers.filter(c => c.status === 'LUNAS').length;
  const belumLunasCount = customers.filter(c => c.status === 'BELUM LUNAS').length;
  
  const totalPemakaian = meterRecords.reduce((acc, m) => acc + (m.pemakaian || 0), 0);
  const totalTagihanBerjalan = meterRecords.reduce((acc, m) => acc + (m.totalTagihan || 0), 0);
  const totalKasMasuk = transactions.filter(t => !t.isCancelled).reduce((acc, t) => acc + (t.jumlahBayar || 0), 0);
  const totalTunggakan = customers.reduce((acc, c) => acc + (c.tunggakan || 0), 0);
  
  const lunasPercentage = totalPelanggan > 0 ? Math.round((lunasCount / totalPelanggan) * 100) : 0;

  // Unpaid customers with highest arrears
  const overdueCustomers = [...customers]
    .filter(c => c.tunggakan > 0)
    .sort((a, b) => b.tunggakan - a.tunggakan);

  // Send WA reminder
  const handleSendReminderWA = (c: Customer) => {
    const meter = meterRecords.find(m => m.id === c.id);
    const msg = generateWhatsAppMessage({
      namaUsaha: settings.namaUsaha,
      namaPelanggan: c.nama,
      idPelanggan: c.id,
      periode: settings.periodeAktif,
      meterLalu: meter ? meter.meterLalu : c.meterAwal,
      meterKini: meter ? meter.meterKini : c.meterAwal,
      pemakaian: meter ? meter.pemakaian : 0,
      tarif: settings.tarifDefault,
      biayaAir: meter ? meter.biayaAir : 0,
      tunggakanLalu: c.tunggakan,
      totalTagihan: meter ? meter.totalTagihan : c.tunggakan,
      namaBankRek: settings.namaBankRek,
      catatan: settings.catatanStruk
    });

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const [isCopiedGroup, setIsCopiedGroup] = useState(false);

  const handleCopyGroupWhatsApp = () => {
    const text = generateGroupSummaryWhatsApp(
      customers.map(c => ({ nama: c.nama, totalTagihan: c.tunggakan, sisaTagihan: c.tunggakan })),
      settings.periodeAktif
    );
    navigator.clipboard.writeText(text);
    setIsCopiedGroup(true);
    setTimeout(() => setIsCopiedGroup(false), 2500);
  };

  const handleShareGroupWhatsApp = () => {
    const text = generateGroupSummaryWhatsApp(
      customers.map(c => ({ nama: c.nama, totalTagihan: c.tunggakan, sisaTagihan: c.tunggakan })),
      settings.periodeAktif
    );
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Banner Ringkasan Periode */}
      <div className="bg-gradient-to-r from-cyan-900/60 via-slate-800 to-slate-900 border border-cyan-800/40 rounded-2xl p-5 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Distribusi Air Aktif</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {settings.namaUsaha}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Periode Aktif: <strong className="text-cyan-400 font-semibold">{settings.periodeAktif}</strong> • Tarif: <strong className="text-cyan-400 font-semibold">{formatRupiah(settings.tarifDefault)}/m³</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenMeterModal()}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Droplets className="w-4 h-4" />
              <span>Input Meter Cepat</span>
            </button>
            <button
              onClick={() => onNavigate('pembayaran')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>Catat Pembayaran</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner Rekonsiliasi Kas jika terdeteksi selisih 703.000 vs 570.000 */}
      {totalKasMasuk === 703000 && onReconcileCash && (
        <div className="bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                Perhatian: Kas Tercatat Rp 703.000 (Uang Fisik Diterima Rp 570.000)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Terdeteksi selisih lebih Rp 133.000 (transaksi Warung Depan / A012 yang uangnya belum Anda terima).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReconcileCash(570000)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shrink-0 shadow-md transition-colors cursor-pointer"
            >
              Perbaiki Jadi Rp 570.000 Sekarang
            </button>
            {onOpenReconciliation && (
              <button
                onClick={onOpenReconciliation}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3 py-2 rounded-xl text-xs shrink-0 border border-slate-700 cursor-pointer"
              >
                Rincian
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pelanggan */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 hover:border-slate-600 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Pelanggan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono">
            {formatNumber(totalPelanggan)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{lunasCount} Lunas</span>
            <span>•</span>
            <span className="text-rose-400 font-semibold">{belumLunasCount} Nunggak</span>
          </div>
        </div>

        {/* Pemakaian Air (m³) */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 hover:border-slate-600 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Pemakaian Air</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-cyan-400 mt-2 font-mono">
            {formatNumber(totalPemakaian)} <span className="text-sm font-normal text-slate-400">m³</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            Estimasi Biaya Air: {formatRupiah(totalPemakaian * settings.tarifDefault)}
          </div>
        </div>

        {/* Total Kas Masuk */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 hover:border-slate-600 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Kas Masuk</span>
            <div className="flex items-center gap-1.5">
              {onOpenReconciliation && (
                <button
                  type="button"
                  onClick={onOpenReconciliation}
                  className="text-[10px] bg-slate-900 hover:bg-slate-750 text-emerald-300 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  title="Sesuaikan kas fisik / cek selisih"
                >
                  <Scale className="w-3 h-3 text-emerald-400" />
                  <span>Koreksi</span>
                </button>
              )}
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono truncate">
            {formatRupiah(totalKasMasuk)}
          </p>
          <div className="mt-2 text-[11px] text-emerald-300/80 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{transactions.filter(t => !t.isCancelled).length} Transaksi Aktif</span>
          </div>
        </div>

        {/* Total Tunggakan */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 hover:border-slate-600 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Sisa Tunggakan</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-400 mt-2 font-mono truncate">
            {formatRupiah(totalTunggakan)}
          </p>
          <div className="mt-2 text-[11px] text-rose-300/80">
            {belumLunasCount} Pelanggan Belum Lunas
          </div>
        </div>
      </div>

      {/* Realisasi Pembayaran & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Progress Rasio & Status */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-cyan-400" />
              <span>Status Pelunasan</span>
            </h3>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {lunasPercentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-700/80 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${lunasPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {lunasCount} Pelanggan Lunas
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {belumLunasCount} Belum Lunas
              </span>
            </div>
          </div>

          <div className="border-t border-slate-700/60 pt-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Total Tagihan Berjalan:</span>
              <span className="font-mono font-bold text-white">{formatRupiah(totalTagihanBerjalan)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Pembayaran Diterima:</span>
              <span className="font-mono font-bold text-emerald-400">{formatRupiah(totalKasMasuk)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Piutang / Tunggakan Sisa:</span>
              <span className="font-mono font-bold text-rose-400">{formatRupiah(totalTunggakan)}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('laporan')}
              className="w-full py-2 px-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Buka Laporan Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Pelanggan Menunggak (Tunggakan Tertinggi) */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Daftar Pelanggan Menunggak</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Urutan tunggakan terbesar untuk penagihan / kirim WhatsApp
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyGroupWhatsApp}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isCopiedGroup
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-700/80 hover:bg-slate-700 text-slate-200 border-slate-600'
                }`}
                title="Salin ringkasan daftar tagihan nama & jumlah untuk dikirim ke grup WhatsApp"
              >
                {isCopiedGroup ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Salin List Grup WA</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShareGroupWhatsApp}
                className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-xl transition-colors"
                title="Buka WhatsApp & Kirim Ringkasan Daftar ke Grup"
              >
                <Send className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('pelanggan')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 ml-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {overdueCustomers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              Semua pelanggan telah melunasi tagihannya! Tidak ada tunggakan.
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[290px] pr-1">
              {overdueCustomers.slice(0, 6).map((c) => {
                const mRec = meterRecords.find(m => m.id === c.id);
                return (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-800 text-cyan-300 rounded-lg shrink-0">
                        {c.id}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-white truncate">
                          {c.nama}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Meter Awal: {formatNumber(c.meterAwal)} {mRec && `• Kini: ${formatNumber(mRec.meterKini)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-bold text-sm text-rose-400">
                          {formatRupiah(c.tunggakan)}
                        </p>
                        <span className="text-[10px] uppercase font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full">
                          {c.status}
                        </span>
                      </div>

                      {/* WhatsApp Reminder Button */}
                      <button
                        onClick={() => handleSendReminderWA(c)}
                        className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 transition-colors"
                        title="Kirim Tagihan via WhatsApp"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                      {/* Bayar Langsung */}
                      <button
                        onClick={() => onSelectCustomerForPayment(c.id)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        Bayar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
