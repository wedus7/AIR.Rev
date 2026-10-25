import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Customer, MeterRecord, PaymentTransaction, SystemSettings } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { exportLaporanToPDF } from '../../utils/pdfGenerator';

interface ReportPrintModalProps {
  settings: SystemSettings;
  customers: Customer[];
  meterRecords: MeterRecord[];
  transactions: PaymentTransaction[];
  onClose: () => void;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  settings,
  customers,
  meterRecords,
  transactions,
  onClose
}) => {
  const totalPemakaian = meterRecords.reduce((acc, m) => acc + (m.pemakaian || 0), 0);
  const totalBiayaAir = meterRecords.reduce((acc, m) => acc + (m.biayaAir || 0), 0);
  const totalTunggakanLalu = meterRecords.reduce((acc, m) => acc + (m.tunggakanLalu || 0), 0);
  const totalTagihan = meterRecords.reduce((acc, m) => acc + (m.totalTagihan || 0), 0);
  const totalKasMasuk = transactions.reduce((acc, t) => acc + (t.jumlahBayar || 0), 0);
  const totalSisaPiutang = customers.reduce((acc, c) => acc + (c.tunggakan || 0), 0);

  const handleDownloadPDF = () => {
    exportLaporanToPDF(settings, customers, meterRecords, transactions);
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header Action Bar */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Preview Cetak Laporan (A4)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Periode: <strong className="text-cyan-400">{settings.periodeAktif}</strong> • {customers.length} Pelanggan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File PDF (.pdf)</span>
            </button>

            <button
              onClick={handleBrowserPrint}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dialog</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Paper */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950 flex justify-center">
          <div className="bg-white text-slate-900 w-full max-w-4xl p-6 sm:p-8 rounded-xl shadow-2xl text-[11px] print:p-0 print:shadow-none print:w-full">
            {/* Kop Surat Laporan */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-black tracking-wide text-slate-950 uppercase">
                    {settings.namaUsaha}
                  </h1>
                  <p className="text-[11px] text-slate-600">
                    {settings.alamatUsaha} • Kontak/WA: {settings.kontakHp}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 uppercase">
                    Rekapitulasi Bulanan
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Periode: <strong className="text-slate-900">{settings.periodeAktif}</strong>
                  </p>
                </div>
              </div>
              <h2 className="text-sm font-bold text-center mt-3 text-cyan-800 tracking-wide uppercase">
                Laporan Tagihan & Pemakaian Air Warga
              </h2>
            </div>

            {/* Ringkasan Finansial Singkat */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[10px]">
              <div>
                <span className="text-slate-500 block">Tarif Air</span>
                <span className="font-bold font-mono text-slate-900">{formatRupiah(settings.tarifDefault)} / m³</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Pemakaian</span>
                <span className="font-bold font-mono text-slate-900">{formatNumber(totalPemakaian)} m³</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Tagihan Berjalan</span>
                <span className="font-bold font-mono text-slate-900">{formatRupiah(totalTagihan)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kas Masuk / Diterima</span>
                <span className="font-bold font-mono text-emerald-700">{formatRupiah(totalKasMasuk)}</span>
              </div>
            </div>

            {/* Tabel Data Rekapitulasi */}
            <div className="overflow-x-auto border border-slate-300 rounded-lg mb-6">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead className="bg-slate-800 text-white font-bold">
                  <tr>
                    <th className="py-2 px-1.5 text-center border-r border-slate-700 w-8">No</th>
                    <th className="py-2 px-2 border-r border-slate-700 w-14">ID</th>
                    <th className="py-2 px-3 border-r border-slate-700">Nama Pelanggan</th>
                    <th className="py-2 px-2 text-right border-r border-slate-700">M. Lalu</th>
                    <th className="py-2 px-2 text-right border-r border-slate-700">M. Kini</th>
                    <th className="py-2 px-2 text-right border-r border-slate-700">Pakai (m³)</th>
                    <th className="py-2 px-2 text-right border-r border-slate-700">Biaya Air</th>
                    <th className="py-2 px-2 text-right border-r border-slate-700">Tunggakan Lalu</th>
                    <th className="py-2 px-2 text-right border-r border-slate-700">Total Tagihan</th>
                    <th className="py-2 px-2 text-right border-r border-slate-700">Sisa Piutang</th>
                    <th className="py-2 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {meterRecords.map((m, idx) => {
                    const cust = customers.find(c => c.id === m.id);
                    const sisa = cust ? cust.tunggakan : (m.sisaTagihan || m.totalTagihan);
                    const isLunas = sisa <= 0;

                    return (
                      <tr key={m.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : ''}>
                        <td className="py-1.5 px-1.5 text-center border-r border-slate-200 text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 font-mono font-bold text-slate-800">
                          {m.id}
                        </td>
                        <td className="py-1.5 px-3 border-r border-slate-200 font-semibold text-slate-900">
                          {m.nama}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-200 font-mono text-slate-600">
                          {formatNumber(m.meterLalu)}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-200 font-mono text-slate-900 font-semibold">
                          {m.isRecorded || m.meterKini > 0 ? formatNumber(m.meterKini) : '-'}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-200 font-mono text-cyan-900 font-bold">
                          {(m.isRecorded || m.meterKini > 0) && m.pemakaian > 0 ? `${formatNumber(m.pemakaian)} m³` : '0 m³'}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-200 font-mono text-slate-800">
                          {formatRupiah(m.biayaAir)}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-200 font-mono text-rose-700">
                          {formatRupiah(m.tunggakanLalu)}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-200 font-mono font-bold text-slate-900">
                          {formatRupiah(m.totalTagihan)}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-200 font-mono font-bold text-rose-800">
                          {formatRupiah(sisa)}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-[9px]">
                          {isLunas ? (
                            <span className="text-emerald-700">LUNAS</span>
                          ) : (
                            <span className="text-rose-700">BELUM</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-center border-r border-slate-300">
                      TOTAL KESELURUHAN
                    </td>
                    <td className="border-r border-slate-300" />
                    <td className="border-r border-slate-300" />
                    <td className="py-2 px-2 text-right border-r border-slate-300 font-mono text-cyan-900">
                      {formatNumber(totalPemakaian)} m³
                    </td>
                    <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">
                      {formatRupiah(totalBiayaAir)}
                    </td>
                    <td className="py-2 px-2 text-right border-r border-slate-300 font-mono text-rose-700">
                      {formatRupiah(totalTunggakanLalu)}
                    </td>
                    <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">
                      {formatRupiah(totalTagihan)}
                    </td>
                    <td className="py-2 px-2 text-right border-r border-slate-300 font-mono text-rose-700">
                      {formatRupiah(totalSisaPiutang)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
