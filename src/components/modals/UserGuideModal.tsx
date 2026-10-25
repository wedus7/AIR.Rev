import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Gauge,
  CreditCard,
  History,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Printer,
  Camera,
  Edit3,
  Ban
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [activeSection, setActiveSection] = useState<'meter' | 'pembayaran' | 'log' | 'tips'>('meter');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900/95 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Panduan Lengkap Langkah Demi Langkah</span>
              </h3>
              <p className="text-xs text-slate-400">
                Cara mencatat, mengoreksi salah input, membatalkan transaksi, dan audit data.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700 bg-slate-900/50 p-2 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSection('meter')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSection === 'meter'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>1. Catat & Revisi Meter</span>
          </button>

          <button
            onClick={() => setActiveSection('pembayaran')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSection === 'pembayaran'
                ? 'bg-cyan-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>2. Kasir & Revisi Bayar</span>
          </button>

          <button
            onClick={() => setActiveSection('log')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSection === 'log'
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>3. Buku Log Audit</span>
          </button>

          <button
            onClick={() => setActiveSection('tips')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSection === 'tips'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Tips Anti Panik</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeSection === 'meter' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2 text-cyan-300">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Cara Mencatat Angka Meter Bulanan</span>
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>Buka tab menu <strong>"Input Meter"</strong> (atau klik tombol Meter dari Dashboard).</li>
                  <li>Di formulir sebelah kiri, pilih nama pelanggan dari dropdown. Jika ingin cepat menemukan pelanggan yang belum dicatat, klik <strong>"Cari yg Belum"</strong>.</li>
                  <li>Ketik angka meter fisik terbaru di kolom <strong>"Meter Kini"</strong>.</li>
                  <li><em>(Opsional)</em> Klik <strong>"Ambil Foto / Pilih Gambar"</strong> untuk melampirkan foto angka meter fisik sebagai bukti dokumentasi.</li>
                  <li>Periksa rincian pemakaian (m³) dan total tagihan yang otomatis dihitung sistem.</li>
                  <li>Klik tombol hijau <strong>"Simpan Catatan Meter"</strong>. Status pelanggan seketika berubah menjadi <strong>"Dicatat" ✅</strong>.</li>
                </ol>
              </div>

              <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2">
                <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Cara Merevisi Jika Terlanjur Salah Ketik Angka Meter</span>
                </h4>
                <p className="text-slate-300">Jika Anda salah ketik angka (misal tertekan 1500 padahal 150 m³):</p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>Cari nama pelanggan di tabel sebelah kanan, lalu klik tombol kuning <strong>"Revisi"</strong> (ikon pensil ✏️).</li>
                  <li>Kotak dialog <strong>"Revisi & Koreksi Catatan Meter"</strong> akan terbuka.</li>
                  <li>Ketikkan angka yang benar pada <strong>"Meter Kini Hasil Revisi"</strong>.</li>
                  <li>Jika angka meter bulan lalu juga keliru, Anda bisa mencentang <em>"Koreksi Meter Lalu?"</em> untuk memperbaiki angka meter awalnya sekaligus.</li>
                  <li>Pilih alasan revisi (misal: <em>"Salah ketik angka meter"</em> atau <em>"Keliru membaca angka meter fisik"</em>).</li>
                  <li>Periksa kotak perbandingan (*Sebelum vs Sesudah*).</li>
                  <li>Klik tombol <strong>"Simpan Perubahan"</strong>. Tagihan pelanggan dan sisa hutang akan otomatis dihitung ulang secara aman!</li>
                </ol>
              </div>

              <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/30 space-y-2">
                <h4 className="font-bold text-rose-300 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Cara Membatalkan Catatan (Reset ke "Belum Dicatat")</span>
                </h4>
                <p className="text-slate-300">Jika Anda salah mencatat di baris pelanggan yang salah (misal mencatat meteran Pak Joko di baris Pak Budi):</p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>Buka modal revisi pelanggan tersebut (klik <strong>"Revisi"</strong> di tabel).</li>
                  <li>Di bagian bawah dialog, klik tombol merah <strong>"Batal Catat (Reset ke Belum Dicatat)"</strong>.</li>
                  <li>Ketik alasan singkat (misal: <em>"Tertukar rumah warga"</em>), lalu klik <strong>"Ya, Batalkan Catatan"</strong>.</li>
                  <li>Data meteran pelanggan tersebut akan dikosongkan kembali dan statusnya kembali menjadi <strong>"Belum Dicatat"</strong> tanpa merusak data saldo lainnya.</li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'pembayaran' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2 text-cyan-300">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Cara Menerima Pembayaran Kasir (Lunas / Cicilan)</span>
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>Buka tab menu <strong>"Pembayaran"</strong> (atau klik tombol Bayar dari tabel pelanggan/meter).</li>
                  <li>Pilih nama pelanggan. Kartu ringkasan akan langsung menampilkan rincian tagihan, riwayat cicilan, dan <strong>Sisa Yang Harus Dibayar</strong>.</li>
                  <li>Ketik jumlah uang yang diterima, atau klik tombol cepat <strong>"Uang Pas"</strong>.</li>
                  <li>Pilih metode (<strong>Tunai</strong> atau <strong>Transfer</strong>).</li>
                  <li>Klik tombol <strong>"Proses Pembayaran"</strong>. Kwitansi langsung terbit dan dapat dicetak atau dikirim ke WhatsApp pelanggan.</li>
                </ol>
              </div>

              <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2">
                <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Cara Merevisi Transaksi Pembayaran (Salah Ketik Nominal)</span>
                </h4>
                <p className="text-slate-300">Jika kasir salah memasukkan nominal (misal bayar 50.000 terketik 500.000):</p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>Buka tab menu <strong>"Riwayat Transaksi"</strong>.</li>
                  <li>Cari nomor transaksi yang bersangkutan, lalu klik tombol kuning <strong>"Revisi"</strong> (ikon pensil ✏️).</li>
                  <li>Ketikkan <strong>Jumlah Bayar Hasil Koreksi</strong> yang sebenarnya (misal 50.000).</li>
                  <li>Pilih alasan koreksi (misal: <em>"Salah ketik nominal bayar"</em>).</li>
                  <li>Klik <strong>"Simpan Revisi Pembayaran"</strong>. Sistem akan langsung mengoreksi kas masuk, memperbarui saldo sisa tagihan pelanggan, dan memperbarui kwitansi dengan tanda <em>"KWITANSI HASIL REVISI"</em>.</li>
                </ol>
              </div>

              <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/30 space-y-2">
                <h4 className="font-bold text-rose-300 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Cara Membatalkan Transaksi Pembayaran (Void / Input Dobel)</span>
                </h4>
                <p className="text-slate-300">Jika kasir tidak sengaja menekan tombol bayar 2 kali atau salah memilih pelanggan:</p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>Buka tab menu <strong>"Riwayat Transaksi"</strong>.</li>
                  <li>Di baris transaksi yang salah, klik tombol merah <strong>"Batalkan"</strong> (ikon larangan 🚫).</li>
                  <li>Ketik alasan pembatalan (misal: <em>"Input ganda"</em> atau <em>"Pelanggan membatalkan transaksi"</em>).</li>
                  <li>Klik <strong>"Ya, Batalkan Transaksi"</strong>.</li>
                  <li>Uang masuk transaksi tersebut otomatis dibatalkan, tidak dihitung lagi di kas, dan tagihan pelanggan dikembalikan utuh ke status belum bayar.</li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'log' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2 text-purple-300">
                  <History className="w-4 h-4 text-purple-400" />
                  <span>Memeriksa Audit Trail di "Buku Log Revisi"</span>
                </h4>
                <p className="text-slate-300">
                  Semua perubahan atau koreksi yang pernah dilakukan selalu tersimpan jejak auditnya untuk mencegah kecurigaan atau selisih pembukuan:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>Klik tombol <strong>"Buku Log Revisi"</strong> yang tersedia di header atas menu <em>Input Meter</em> atau <em>Riwayat Pembayaran</em>.</li>
                  <li>Tersedia 2 tab:
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-300">
                      <li><strong>Koreksi Meter</strong>: Melihat siapa yang mengoreksi angka meter, angka lama vs baru, pemakaian, dan alasannya.</li>
                      <li><strong>Koreksi Bayar</strong>: Melihat histori perubahan nominal pembayaran, pembatalan kwitansi, dan kasir yang bertugas.</li>
                    </ul>
                  </li>
                  <li>Gunakan kolom pencarian untuk menyaring berdasarkan nama warga, ID, atau kata kunci alasan revisi.</li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'tips' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 space-y-2.5">
                <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>4 Tips Praktis Petugas Lapangan & Pengelola</span>
                </h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Jangan Panik Saat Salah Ketik:</strong> Anda tidak perlu menghapus pelanggan atau mengulang dari awal. Cukup klik tombol <strong>"Revisi"</strong> di tabel untuk memperbaiki angka.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Perhatikan Banner Peringatan Cerdas:</strong> Jika angka pemakaian terdeteksi loncat sangat tinggi (&gt; 40 m³), sistem otomatis memberi peringatan kuning agar Anda mengecek apakah ada kelebihan angka nol.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Gunakan Foto Meteran:</strong> Biasakan mengambil foto meteran fisik saat ragu, sehingga bukti visual tersimpan di sistem dan dapat dibuka kapan saja.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Unduh Cadangan Berkala:</strong> Di tab <em>"Setting"</em>, gunakan tombol <strong>"Ekspor Data (.json)"</strong> atau di header klik <strong>"Template Sheet"</strong> untuk menyimpan berkas cadangan ke komputer atau HP.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-between items-center">
          <span className="text-[11px] text-slate-400">
            AIR Management System • Distribusi Air Desa
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
