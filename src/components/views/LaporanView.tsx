import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  Copy,
  Check,
  Send
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, MeterRecord, PaymentTransaction, SystemSettings } from '../../types';
import { formatRupiah, formatNumber, generateGroupSummaryWhatsApp } from '../../utils/formatters';
import { exportLaporanToPDF } from '../../utils/pdfGenerator';
import { ReportPrintModal } from '../modals/ReportPrintModal';

interface LaporanViewProps {
  settings: SystemSettings;
  customers: Customer[];
  meterRecords: MeterRecord[];
  transactions: PaymentTransaction[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  settings,
  customers,
  meterRecords,
  transactions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LUNAS' | 'BELUM LUNAS'>('ALL');

  // Aggregates
  const totalPemakaian = meterRecords.reduce((acc, m) => acc + (m.pemakaian || 0), 0);
  const totalBiayaAir = meterRecords.reduce((acc, m) => acc + (m.biayaAir || 0), 0);
  const totalTunggakanLalu = meterRecords.reduce((acc, m) => acc + (m.tunggakanLalu || 0), 0);
  const totalTagihan = meterRecords.reduce((acc, m) => acc + (m.totalTagihan || 0), 0);
  const totalKasMasuk = transactions.filter(t => !t.isCancelled).reduce((acc, t) => acc + (t.jumlahBayar || 0), 0);
  const totalSisaPiutang = customers.reduce((acc, c) => acc + (c.tunggakan || 0), 0);

  // Filtered rows
  const filteredRecords = meterRecords.filter(m => {
    const matchesSearch =
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Export Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows: any[][] = [
      [`LAPORAN DISTRIBUSI AIR - ${settings.namaUsaha.toUpperCase()}`],
      [`Periode: ${settings.periodeAktif} | Tarif Default: ${settings.tarifDefault} / m³`],
      [],
      ['ID', 'Nama Pelanggan', 'Meter Lalu', 'Meter Kini', 'Pemakaian (m³)', 'Biaya Air', 'Tunggakan Lalu', 'Total Tagihan', 'Status']
    ];

    filteredRecords.forEach(m => {
      rows.push([
        m.id,
        m.nama,
        m.meterLalu,
        m.meterKini,
        m.pemakaian,
        m.biayaAir,
        m.tunggakanLalu,
        m.totalTagihan,
        m.status
      ]);
    });

    rows.push([]);
    rows.push(['TOTAL', '', '', '', totalPemakaian, totalBiayaAir, totalTunggakanLalu, totalTagihan, '']);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    XLSX.writeFile(wb, `Laporan_Air_${settings.periodeAktif.replace(/\\s+/g, '_')}.xlsx`);
  };

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleDownloadPDF = () => {
    exportLaporanToPDF(settings, customers, meterRecords, transactions);
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
      {/* Top Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>LAPORAN DISTRIBUSI AIR</span>
            </h2>
            <span className="text-xs bg-slate-700 text-slate-300 font-mono px-2 py-0.5 rounded-full">
              Sheet #5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Rekapitulasi tagihan, pemakaian air, dan kas masuk periode <strong>{settings.periodeAktif}</strong>.</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopyGroupWhatsApp}
            className={`text-white font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 border transition-all active:scale-95 ${
              isCopiedGroup
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-700 hover:bg-slate-650 border-slate-600 text-slate-200'
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
            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-xl transition-colors"
            title="Buka WhatsApp & Kirim Ringkasan Daftar ke Grup"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownloadPDF}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all active:scale-95 cursor-pointer"
            title="Download file PDF resmi landscape ke perangkat Anda"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Buka pratinjau dokumen A4 siap cetak & tanda tangan"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Preview A4</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Pemakaian</span>
          <span className="text-lg font-bold font-mono text-cyan-400 block mt-1">
            {formatNumber(totalPemakaian)} m³
          </span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Biaya Air Berjalan</span>
          <span className="text-lg font-bold font-mono text-white block mt-1">
            {formatRupiah(totalBiayaAir)}
          </span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tunggakan Lalu</span>
          <span className="text-lg font-bold font-mono text-amber-400 block mt-1">
            {formatRupiah(totalTunggakanLalu)}
          </span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Tagihan</span>
          <span className="text-lg font-bold font-mono text-cyan-300 block mt-1">
            {formatRupiah(totalTagihan)}
          </span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Kas Diterima</span>
          <span className="text-lg font-bold font-mono text-emerald-400 block mt-1">
            {formatRupiah(totalKasMasuk)}
          </span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sisa Piutang</span>
          <span className="text-lg font-bold font-mono text-rose-400 block mt-1">
            {formatRupiah(totalSisaPiutang)}
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ID atau Nama Pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              statusFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('LUNAS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              statusFilter === 'LUNAS' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
            }`}
          >
            Lunas
          </button>
          <button
            onClick={() => setStatusFilter('BELUM LUNAS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              statusFilter === 'BELUM LUNAS' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
            }`}
          >
            Belum Lunas
          </button>
        </div>
      </div>

      {/* Laporan Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900/90 font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">ID Pelanggan</th>
                <th className="py-3 px-3">Nama Pelanggan</th>
                <th className="py-3 px-2 text-right">Meter Lalu</th>
                <th className="py-3 px-2 text-right">Meter Kini</th>
                <th className="py-3 px-2 text-right">Pemakaian</th>
                <th className="py-3 px-3 text-right">Biaya Air</th>
                <th className="py-3 px-3 text-right">Tunggakan Lalu</th>
                <th className="py-3 px-3 text-right">Total Tagihan</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada data laporan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-cyan-300">{m.id}</td>
                    <td className="py-3 px-3 font-semibold text-white">{m.nama}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-400">{formatNumber(m.meterLalu)}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-300">{m.meterKini > 0 ? formatNumber(m.meterKini) : '-'}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-cyan-300">
                      {m.pemakaian > 0 ? `${formatNumber(m.pemakaian)} m³` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">{formatRupiah(m.biayaAir)}</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400">{formatRupiah(m.tunggakanLalu)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">{formatRupiah(m.totalTagihan)}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.status === 'LUNAS'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-900/90 font-bold border-t-2 border-slate-600 text-white">
              <tr>
                <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-slate-400">
                  Total Ringkasan:
                </td>
                <td className="py-3 px-2 text-right font-mono text-cyan-400">
                  {formatNumber(totalPemakaian)} m³
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatRupiah(totalBiayaAir)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-400">
                  {formatRupiah(totalTunggakanLalu)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-cyan-300 text-sm">
                  {formatRupiah(totalTagihan)}
                </td>
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Preview Cetak A4 / Download PDF */}
      {isPrintModalOpen && (
        <ReportPrintModal
          settings={settings}
          customers={customers}
          meterRecords={meterRecords}
          transactions={transactions}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
