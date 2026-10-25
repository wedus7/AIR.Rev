import React from 'react';
import { X, Printer, Send, Check } from 'lucide-react';
import { PaymentTransaction, SystemSettings } from '../../types';
import { formatRupiah, generateWhatsAppMessage } from '../../utils/formatters';

interface ReceiptModalProps {
  transaction: PaymentTransaction;
  settings: SystemSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleSendWA = () => {
    const msg = generateWhatsAppMessage({
      namaUsaha: settings.namaUsaha,
      namaPelanggan: transaction.namaPelanggan,
      idPelanggan: transaction.idPelanggan,
      periode: settings.periodeAktif,
      meterLalu: 0,
      meterKini: 0,
      pemakaian: 0,
      tarif: settings.tarifDefault,
      biayaAir: 0,
      tunggakanLalu: 0,
      totalTagihan: transaction.totalTagihan,
      jumlahBayar: transaction.jumlahBayar,
      sisaTunggakan: transaction.sisaTunggakan,
      noTransaksi: transaction.noTransaksi,
      namaBankRek: settings.namaBankRek,
      catatan: settings.catatanStruk
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 no-print"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-bold text-base text-white mb-3 no-print">
          Kwitansi Pembayaran Air
        </h3>

        {/* Printable Struk Body */}
        <div
          id="printable-receipt"
          className="bg-white text-slate-900 p-5 rounded-xl font-mono text-xs space-y-3 shadow-md"
        >
          {/* Header Struk */}
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <h2 className="font-extrabold text-sm tracking-wide text-slate-900">
              {settings.namaUsaha.toUpperCase()}
            </h2>
            <p className="text-[10px] text-slate-600">{settings.alamatUsaha}</p>
            <p className="text-[10px] text-slate-600">Kontak: {settings.kontakHp}</p>
          </div>

          {/* Meta Info */}
          <div className="space-y-1 text-[11px]">
            {transaction.isRevised && (
              <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 p-1 rounded text-center mb-1">
                KWITANSI HASIL REVISI / KOREKSI
              </div>
            )}
            {transaction.isCancelled && (
              <div className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 p-1 rounded text-center mb-1">
                TRANSAKSI TELAH DIBATALKAN (VOID)
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">No. Bukti:</span>
              <span className="font-bold">{transaction.noTransaksi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <span>{transaction.tanggal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ID Pelanggan:</span>
              <span className="font-bold">{transaction.idPelanggan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nama:</span>
              <span className="font-bold">{transaction.namaPelanggan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Periode:</span>
              <span>{settings.periodeAktif}</span>
            </div>
          </div>

          {/* Rincian Finansial */}
          <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Tagihan:</span>
              <span className="font-bold">{formatRupiah(transaction.totalTagihan)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Jumlah Diterima ({transaction.metode}):</span>
              <span>{formatRupiah(transaction.jumlahBayar)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Sisa Tunggakan:</span>
              <span className="font-bold">{formatRupiah(transaction.sisaTunggakan)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Status:</span>
              <span className="font-bold uppercase tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                {transaction.statusPembayaran}
              </span>
            </div>
          </div>

          {/* Footer Struk */}
          <div className="text-center text-[10px] text-slate-500 pt-1 space-y-1">
            <p>{settings.catatanStruk}</p>
            <p>Kasir: {transaction.kasir}</p>
            <p className="font-bold text-[9px] text-slate-400">--- SIMPAN STRUK INI ---</p>
          </div>
        </div>

        {/* Buttons (Hidden during printing) */}
        <div className="grid grid-cols-2 gap-2 mt-4 no-print">
          <button
            onClick={handlePrint}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak (Print)</span>
          </button>

          <button
            onClick={handleSendWA}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Kirim WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
