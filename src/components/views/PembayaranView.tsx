import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Printer,
  Send,
  AlertCircle,
  Receipt,
  User,
  ArrowRight,
  Info
} from 'lucide-react';
import { Customer, MeterRecord, PaymentTransaction, SystemSettings } from '../../types';
import { formatRupiah, formatNumber, generateWhatsAppMessage } from '../../utils/formatters';

interface PembayaranViewProps {
  customers: Customer[];
  meterRecords: MeterRecord[];
  settings: SystemSettings;
  onProcessPayment: (transaction: PaymentTransaction) => void;
  selectedCustomerId?: string;
  onPrintReceipt: (transaction: PaymentTransaction) => void;
}

export const PembayaranView: React.FC<PembayaranViewProps> = ({
  customers,
  meterRecords,
  settings,
  onProcessPayment,
  selectedCustomerId: initialId,
  onPrintReceipt
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialId || (customers.length > 0 ? customers[0].id : '')
  );

  useEffect(() => {
    if (initialId) {
      setSelectedId(initialId);
    }
  }, [initialId]);

  const activeCustomer = customers.find(c => c.id === selectedId);
  const activeMeter = meterRecords.find(m => m.id === selectedId);

  // Bill computations
  const pemakaian = activeMeter ? activeMeter.pemakaian : 0;
  const biayaAir = activeMeter ? activeMeter.biayaAir : 0;
  const tunggakanLalu = activeMeter ? activeMeter.tunggakanLalu : (activeCustomer ? activeCustomer.tunggakan : 0);
  const totalTagihan = activeMeter ? activeMeter.totalTagihan : tunggakanLalu;
  const sudahTerbayar = activeMeter ? (activeMeter.terbayar || 0) : 0;
  const sisaBelumDibayar = activeMeter ? activeMeter.sisaTagihan : (activeCustomer ? activeCustomer.tunggakan : 0);

  // Form states
  const [inputBayar, setInputBayar] = useState<number>(sisaBelumDibayar);
  const [metode, setMetode] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [kasir, setKasir] = useState('Admin Air');
  const [keterangan, setKeterangan] = useState('Pembayaran Air');
  const [lastTransaction, setLastTransaction] = useState<PaymentTransaction | null>(null);

  // Update inputBayar default when customer changes
  useEffect(() => {
    setInputBayar(sisaBelumDibayar);
    setLastTransaction(null);
  }, [selectedId, sisaBelumDibayar]);

  const numBayar = Number(inputBayar) || 0;
  const kembalian = Math.max(0, numBayar - sisaBelumDibayar);
  const sisaTunggakan = Math.max(0, sisaBelumDibayar - numBayar);
  const statusPembayaran = sisaTunggakan <= 0 ? 'LUNAS' : 'CICILAN';

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    if (numBayar <= 0) {
      alert('Jumlah pembayaran harus lebih besar dari 0!');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const trxId = `TRX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    const newTx: PaymentTransaction = {
      noTransaksi: trxId,
      tanggal: dateStr,
      idPelanggan: activeCustomer.id,
      namaPelanggan: activeCustomer.nama,
      totalTagihan: sisaBelumDibayar,
      jumlahBayar: numBayar,
      sisaTunggakan: sisaTunggakan,
      statusPembayaran: statusPembayaran,
      keterangan: keterangan || `Pembayaran ${statusPembayaran}`,
      metode: metode,
      kasir: kasir || 'Admin Air'
    };

    onProcessPayment(newTx);
    setLastTransaction(newTx);
  };

  const handleSendWA = (tx: PaymentTransaction) => {
    const msg = generateWhatsAppMessage({
      namaUsaha: settings.namaUsaha,
      namaPelanggan: tx.namaPelanggan,
      idPelanggan: tx.idPelanggan,
      periode: settings.periodeAktif,
      meterLalu: activeMeter?.meterLalu || 0,
      meterKini: activeMeter?.meterKini || 0,
      pemakaian: pemakaian,
      tarif: settings.tarifDefault,
      biayaAir: biayaAir,
      tunggakanLalu: tunggakanLalu,
      totalTagihan: tx.totalTagihan,
      jumlahBayar: tx.jumlahBayar,
      sisaTunggakan: tx.sisaTunggakan,
      noTransaksi: tx.noTransaksi,
      namaBankRek: settings.namaBankRek,
      catatan: settings.catatanStruk
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>PEMBAYARAN & CICILAN</span>
            </h2>
            <span className="text-xs bg-slate-700 text-slate-300 font-mono px-2 py-0.5 rounded-full">
              Sheet #4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Penerimaan kas, perhitungan sisa tunggakan/kembalian, cetak struk, dan kirim bukti via WhatsApp.</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sisi Kiri: Form Input Pembayaran */}
        <div className="lg:col-span-7 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-5">
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* Customer Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pilih Pelanggan (ID & Nama)</span>
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.nama} (Tagihan: {formatRupiah(c.tunggakan)})
                  </option>
                ))}
              </select>
            </div>

            {/* Bill Summary Card */}
            {activeCustomer && (
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">ID & Nama:</span>
                  <span className="font-bold text-white font-mono">
                    {activeCustomer.id} - {activeCustomer.nama}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Pemakaian Air ({settings.periodeAktif}):</span>
                  <span className="font-mono text-slate-300">
                    {formatNumber(pemakaian)} m³ x {formatRupiah(settings.tarifDefault)} = <strong className="text-white">{formatRupiah(biayaAir)}</strong>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Tunggakan Lalu:</span>
                  <span className="font-mono text-rose-400 font-semibold">
                    {formatRupiah(tunggakanLalu)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-1.5">
                  <span className="text-slate-300">Total Tagihan Periode Ini:</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {formatRupiah(totalTagihan)}
                  </span>
                </div>
                {sudahTerbayar > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-400">
                    <span>Sudah Terbayar Sebelumnya:</span>
                    <span className="font-mono font-bold">
                      {formatRupiah(sudahTerbayar)}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Sisa Yang Harus Dibayar:</span>
                  <span className={`text-lg font-bold font-mono ${sisaBelumDibayar <= 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {formatRupiah(sisaBelumDibayar)}
                  </span>
                </div>

                {sisaBelumDibayar <= 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tagihan pelanggan ini sudah <strong>LUNAS</strong>! Tidak ada sisa tunggakan.</span>
                  </div>
                )}
              </div>
            )}

            {/* Input Nominal Bayar */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Jumlah Bayar (Kolom F) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={inputBayar}
                  onChange={(e) => setInputBayar(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-900 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-xl pl-12 pr-4 py-2.5 text-xl font-extrabold text-emerald-400 font-mono outline-none text-right"
                  required
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">
                Tombol Nominal Cepat:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => setInputBayar(sisaBelumDibayar)}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-1.5 px-2 rounded-lg truncate border border-slate-600"
                >
                  Uang Pas ({formatRupiah(sisaBelumDibayar)})
                </button>
                {biayaAir > 0 && biayaAir !== sisaBelumDibayar && sisaBelumDibayar > 0 && (
                  <button
                    type="button"
                    onClick={() => setInputBayar(biayaAir)}
                    className="bg-slate-700 hover:bg-slate-600 text-cyan-300 text-xs font-semibold py-1.5 px-2 rounded-lg truncate border border-slate-600"
                  >
                    Bln Ini Aja
                  </button>
                )}
                {[50000, 100000, 200000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInputBayar(amt)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono py-1.5 px-2 rounded-lg border border-slate-700 truncate"
                  >
                    {formatNumber(amt / 1000)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Live Calculation: Kembalian & Sisa Tunggakan */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80">
              <div>
                <span className="text-[11px] text-slate-400 block">Sisa Tunggakan (G)</span>
                <span className={`text-base font-bold font-mono ${sisaTunggakan > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {formatRupiah(sisaTunggakan)}
                </span>
                <span className="text-[10px] block text-slate-500">
                  Status: <strong className={statusPembayaran === 'LUNAS' ? 'text-emerald-400' : 'text-amber-400'}>{statusPembayaran}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Kembalian</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {formatRupiah(kembalian)}
                </span>
                <span className="text-[10px] block text-slate-500">
                  {kembalian > 0 ? 'Kembalikan ke pelanggan' : 'Tidak ada kembalian'}
                </span>
              </div>
            </div>

            {/* Metode & Kasir */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={metode}
                  onChange={(e) => setMetode(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer">Transfer Bank / QRIS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Petugas / Kasir (Kolom I)
                </label>
                <input
                  type="text"
                  value={kasir}
                  onChange={(e) => setKasir(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 text-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Simpan Pembayaran & Cetak Struk</span>
            </button>
          </form>
        </div>

        {/* Sisi Kanan: Bukti Transaksi Terakhir & Cetak / WA */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-base text-white flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Struk Transaksi Pembayaran</span>
            </h3>

            {lastTransaction ? (
              <div className="space-y-4">
                {/* Visual Struk Kertas */}
                <div
                  id="preview-receipt"
                  className="bg-slate-950 p-4 rounded-xl border border-slate-700 font-mono text-xs text-slate-200 space-y-2 shadow-inner"
                >
                  <div className="text-center pb-2 border-b border-dashed border-slate-700">
                    <p className="font-bold text-sm text-cyan-400">{settings.namaUsaha.toUpperCase()}</p>
                    <p className="text-[10px] text-slate-400">{settings.alamatUsaha}</p>
                    <p className="text-[10px] text-slate-400">Telp/WA: {settings.kontakHp}</p>
                  </div>

                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">No. TRX:</span>
                      <span className="font-bold">{lastTransaction.noTransaksi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Waktu:</span>
                      <span>{lastTransaction.tanggal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ID Pelanggan:</span>
                      <span className="font-bold text-cyan-300">{lastTransaction.idPelanggan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nama:</span>
                      <span className="font-bold">{lastTransaction.namaPelanggan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Periode:</span>
                      <span>{settings.periodeAktif}</span>
                    </div>
                  </div>

                  <div className="border-t border-b border-dashed border-slate-700 py-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Tagihan:</span>
                      <span className="font-bold">{formatRupiah(lastTransaction.totalTagihan)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Jumlah Bayar ({lastTransaction.metode}):</span>
                      <span>{formatRupiah(lastTransaction.jumlahBayar)}</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>Sisa Tunggakan:</span>
                      <span>{formatRupiah(lastTransaction.sisaTunggakan)}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span>Status:</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${lastTransaction.statusPembayaran === 'LUNAS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {lastTransaction.statusPembayaran}
                      </span>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-400 pt-1">
                    <p>{settings.catatanStruk}</p>
                    <p className="mt-1">Kasir: {lastTransaction.kasir}</p>
                  </div>
                </div>

                {/* Tombol Aksi Cetak & Kirim WA */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onPrintReceipt(lastTransaction)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Struk</span>
                  </button>

                  <button
                    onClick={() => handleSendWA(lastTransaction)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim WA</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p>Belum ada transaksi pembayaran yang dilakukan di sesi ini.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pilih pelanggan, isi nominal bayar, lalu klik Simpan Pembayaran untuk mencetak kwitansi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
