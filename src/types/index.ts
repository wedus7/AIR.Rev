export type PaymentStatus = 'LUNAS' | 'BELUM LUNAS';
export type TransactionStatus = 'LUNAS' | 'CICILAN';

export interface Customer {
  id: string;          // Kolom A: ID (e.g. A001)
  nama: string;        // Kolom B: Nama Pelanggan
  meterAwal: number;   // Kolom C: Meter Awal
  tunggakan: number;   // Kolom D: Tunggakan (Rp)
  status: PaymentStatus; // Kolom E: Status (LUNAS / BELUM LUNAS)
}

export interface MeterRevisionLog {
  id: string;
  timestamp: string;
  meterKiniSebelum: number;
  meterKiniSesudah: number;
  meterLaluSebelum?: number;
  meterLaluSesudah?: number;
  pemakaianSebelum?: number;
  pemakaianSesudah?: number;
  alasan: string;
  petugas: string;
  tipe: 'REVISI_ANGKA' | 'BATAL_CATAT' | 'GANTI_FOTO';
}

export interface MeterRecord {
  id: string;          // Kolom A: ID Pelanggan
  nama: string;        // Kolom B: Nama Pelanggan
  meterLalu: number;   // Kolom C: Meter Lalu (dari Meter Awal)
  meterKini: number;   // Kolom D: Meter Kini (Inputan)
  pemakaian: number;   // Kolom E: Pemakaian m³ (Meter Kini - Meter Lalu)
  tarif: number;       // Kolom F: Tarif (Rp/m³) - diambil dari SETTING!B1
  biayaAir: number;    // Kolom G: Biaya Air (Pemakaian * Tarif)
  tunggakanLalu: number;// Kolom H: Tunggakan Lalu (dari DATA PELANGGAN!D)
  totalTagihan: number; // Kolom I: Total Tagihan (Biaya Air + Tunggakan Lalu)
  status: PaymentStatus | 'BELUM INPUT'; // Kolom J: Status
  terbayar: number;    // Jumlah yang sudah dibayar periode ini
  sisaTagihan: number; // Sisa yang belum dibayar periode ini
  tanggalInput?: string;
  fotoMeter?: string;  // Foto angka meter fisik (opsional)
  isRecorded?: boolean;// Status apakah meteran sudah dicatat bulan ini
  // Fitur Revisi Catatan
  isRevised?: boolean;
  revisionCount?: number;
  lastRevisedAt?: string;
  lastRevisionReason?: string;
  revisionHistory?: MeterRevisionLog[];
}

export interface PaymentRevisionLog {
  id: string;
  timestamp: string;
  jumlahBayarSebelum: number;
  jumlahBayarSesudah: number;
  metodeSebelum?: string;
  metodeSesudah?: string;
  alasan: string;
  petugas: string;
  tipe: 'REVISI_NOMINAL' | 'BATAL_TRANSAKSI';
}

export interface PaymentTransaction {
  noTransaksi: string;     // Kolom A: No Transaksi (e.g. TRX-202610-001)
  tanggal: string;         // Kolom B: Tanggal & Jam
  idPelanggan: string;     // Kolom C: ID Pelanggan
  namaPelanggan: string;   // Kolom D: Nama Pelanggan
  totalTagihan: number;    // Kolom E: Total Tagihan
  jumlahBayar: number;     // Kolom F: Jumlah Bayar
  sisaTunggakan: number;   // Kolom G: Sisa Tunggakan
  statusPembayaran: TransactionStatus | 'DIBATALKAN'; // Kolom H: LUNAS / CICILAN / DIBATALKAN
  keterangan: string;      // Kolom I: Keterangan / Kasir
  metode: string;          // Tunai / Transfer
  kasir: string;
  // Fitur Revisi Pembayaran
  isRevised?: boolean;
  revisionCount?: number;
  lastRevisedAt?: string;
  lastRevisionReason?: string;
  revisionHistory?: PaymentRevisionLog[];
  isCancelled?: boolean;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface SystemSettings {
  tarifDefault: number;   // A1: Tarif Default | B1: 19000
  namaUsaha: string;       // A2: Nama Usaha | B2: Distribusi Air Desa
  periodeAktif: string;    // e.g. "Oktober 2026"
  alamatUsaha: string;     // e.g. "Desa Sukamaju RT 02 / RW 01"
  kontakHp: string;        // e.g. "081234567890"
  catatanStruk: string;    // e.g. "Harap simpan bukti pembayaran ini."
  namaBankRek: string;     // e.g. "BRI: 1234-01-000123-50-1"
}

export interface GoogleSyncConfig {
  webAppUrl: string;
  isAutoSync: boolean;
  lastSync?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
}
