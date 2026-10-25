import * as XLSX from 'xlsx';
import { Customer, MeterRecord, PaymentTransaction, SystemSettings } from '../types';

export function downloadGoogleSheetsTemplate(
  settings: SystemSettings,
  customers: Customer[],
  meterRecords: MeterRecord[],
  transactions: PaymentTransaction[]
) {
  const wb = XLSX.utils.book_new();

  // 1. DASHBOARD
  const dashboardData = [
    ['💧 AIR MANAGEMENT SYSTEM - DASHBOARD DISTRIBUSI AIR'],
    ['Ringkasan Statistik Sistem & Keuangan'],
    [],
    ['Metrik', 'Nilai'],
    ['Tarif Default (SETTING!B1)', settings.tarifDefault],
    ['Nama Usaha (SETTING!B2)', settings.namaUsaha],
    ['Periode Aktif', settings.periodeAktif],
    ['Total Pelanggan Terdaftar', customers.length],
    ['Total Pemakaian Air Bulan Ini (m³)', meterRecords.reduce((acc, m) => acc + (m.pemakaian || 0), 0)],
    ['Total Tagihan Berjalan (Rp)', meterRecords.reduce((acc, m) => acc + (m.totalTagihan || 0), 0)],
    ['Total Kas Masuk (Rp)', transactions.reduce((acc, t) => acc + (t.jumlahBayar || 0), 0)],
    ['Total Sisa Tunggakan (Rp)', customers.reduce((acc, c) => acc + (c.tunggakan || 0), 0)]
  ];
  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'DASHBOARD');

  // 2. DATA PELANGGAN
  // Kolom: A=ID, B=Nama Pelanggan, C=Meter Awal, D=Tunggakan, E=Status
  const pelangganRows: any[] = [
    ['ID', 'Nama Pelanggan', 'Meter Awal', 'Tunggakan', 'Status']
  ];
  customers.forEach(c => {
    pelangganRows.push([
      c.id,
      c.nama,
      c.meterAwal,
      c.tunggakan,
      c.status
    ]);
  });
  const wsPelanggan = XLSX.utils.aoa_to_sheet(pelangganRows);
  XLSX.utils.book_append_sheet(wb, wsPelanggan, 'DATA PELANGGAN');

  // 3. INPUT METER
  // Kolom: ID, Nama Pelanggan, Meter Lalu, Meter Kini, Pemakaian (m³), Tarif, Biaya Air, Tunggakan Lalu, Total Tagihan, Status
  const inputMeterRows: any[] = [
    ['ID', 'Nama Pelanggan', 'Meter Lalu', 'Meter Kini', 'Pemakaian (m³)', 'Tarif', 'Biaya Air', 'Tunggakan Lalu', 'Total Tagihan', 'Status']
  ];
  meterRecords.forEach(m => {
    inputMeterRows.push([
      m.id,
      m.nama,
      m.meterLalu,
      m.meterKini,
      m.pemakaian,
      m.tarif,
      m.biayaAir,
      m.tunggakanLalu,
      m.totalTagihan,
      m.status
    ]);
  });
  const wsInput = XLSX.utils.aoa_to_sheet(inputMeterRows);
  XLSX.utils.book_append_sheet(wb, wsInput, 'INPUT METER');

  // 4. PEMBAYARAN
  // Kolom: No Transaksi, Tanggal, ID Pelanggan, Nama Pelanggan, Total Tagihan, Jumlah Bayar, Sisa Tunggakan, Status Pembayaran, Keterangan / Kasir
  const pembayaranRows: any[] = [
    ['No Transaksi', 'Tanggal', 'ID Pelanggan', 'Nama Pelanggan', 'Total Tagihan', 'Jumlah Bayar', 'Sisa Tunggakan', 'Status Pembayaran', 'Keterangan / Kasir']
  ];
  transactions.forEach(t => {
    pembayaranRows.push([
      t.noTransaksi,
      t.tanggal,
      t.idPelanggan,
      t.namaPelanggan,
      t.totalTagihan,
      t.jumlahBayar,
      t.sisaTunggakan,
      t.statusPembayaran,
      `${t.keterangan} (${t.kasir})`
    ]);
  });
  const wsPembayaran = XLSX.utils.aoa_to_sheet(pembayaranRows);
  XLSX.utils.book_append_sheet(wb, wsPembayaran, 'PEMBAYARAN');

  // 5. LAPORAN
  const laporanRows: any[] = [
    ['LAPORAN REKAPITULASI DISTRIBUSI AIR'],
    [`Nama Usaha: ${settings.namaUsaha} | Periode: ${settings.periodeAktif}`],
    [],
    ['ID', 'Nama Pelanggan', 'Pemakaian (m³)', 'Biaya Air', 'Tunggakan Lalu', 'Total Tagihan', 'Status']
  ];
  meterRecords.forEach(m => {
    laporanRows.push([
      m.id,
      m.nama,
      m.pemakaian,
      m.biayaAir,
      m.tunggakanLalu,
      m.totalTagihan,
      m.status
    ]);
  });
  const wsLaporan = XLSX.utils.aoa_to_sheet(laporanRows);
  XLSX.utils.book_append_sheet(wb, wsLaporan, 'LAPORAN');

  // 6. RIWAYAT PEMBAYARAN
  // Kolom: ID Transaksi, Tanggal & Waktu, ID Pelanggan, Nama Pelanggan, Jumlah Bayar, Sisa Tunggakan, Metode, Petugas / Kasir
  const riwayatRows: any[] = [
    ['ID Transaksi', 'Tanggal & Waktu', 'ID Pelanggan', 'Nama Pelanggan', 'Jumlah Bayar', 'Sisa Tunggakan', 'Metode', 'Petugas / Kasir']
  ];
  transactions.forEach(t => {
    riwayatRows.push([
      t.noTransaksi,
      t.tanggal,
      t.idPelanggan,
      t.namaPelanggan,
      t.jumlahBayar,
      t.sisaTunggakan,
      t.metode,
      t.kasir
    ]);
  });
  const wsRiwayat = XLSX.utils.aoa_to_sheet(riwayatRows);
  XLSX.utils.book_append_sheet(wb, wsRiwayat, 'RIWAYAT PEMBAYARAN');

  // 7. SETTING
  // Kolom A & B sesuai spesifikasi:
  // A1 = Tarif Default, B1 = 19000
  // A2 = Nama Usaha, B2 = Distribusi Air Desa
  const settingRows = [
    ['Tarif Default', settings.tarifDefault],
    ['Nama Usaha', settings.namaUsaha],
    ['Periode Aktif', settings.periodeAktif],
    ['Alamat Usaha', settings.alamatUsaha],
    ['Kontak / No WA', settings.kontakHp],
    ['Catatan Struk', settings.catatanStruk],
    ['Rekening Kasir', settings.namaBankRek]
  ];
  const wsSetting = XLSX.utils.aoa_to_sheet(settingRows);
  XLSX.utils.book_append_sheet(wb, wsSetting, 'SETTING');

  // Generate filename & download
  const fileName = `AIR_Management_System_Template_${settings.periodeAktif.replace(/\\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
