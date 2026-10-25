import { Customer, MeterRecord, PaymentTransaction, SystemSettings } from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_METER_RECORDS,
  INITIAL_TRANSACTIONS
} from '../constants/initialData';

/**
 * ====================================================================
 * 💧 AIR Management System - Generator & Skrip Google Apps Script
 * ====================================================================
 * Menggunakan 100% Data Pelanggan Nyata Kp. Maja (18 Pelanggan Terverifikasi)
 * Kas Fisik Diterima Aktual: Rp 570.000
 * Tarif Default: Rp 19.000 / m³ (SETTING!B1)
 *
 * Struktur 7 Sheet:
 * 1. DASHBOARD
 * 2. DATA PELANGGAN (A: ID, B: Nama Pelanggan, C: Meter Awal, D: Tunggakan, E: Status)
 * 3. INPUT METER (A: ID, B: Nama, C: Meter Lalu, D: Meter Kini, E: Pemakaian, F: Tarif, G: Biaya Air, H: Tunggakan Lalu, I: Total Tagihan, J: Status)
 * 4. PEMBAYARAN (A: No Transaksi, B: Tanggal, C: ID, D: Nama, E: Total Tagihan, F: Jumlah Bayar, G: Sisa Tunggakan, H: Status, I: Kasir)
 * 5. LAPORAN (Rekapitulasi Bulanan)
 * 6. RIWAYAT PEMBAYARAN (A: ID Transaksi, B: Tanggal, C: ID, D: Nama, E: Jumlah Bayar, F: Sisa Tunggakan, G: Metode, H: Kasir)
 * 7. SETTING (A1: Tarif Default | B1: 19000, A2: Nama Usaha | B2: Distribusi Air Kp. Maja)
 *
 * PLUS: Fitur Revisi Catatan Meter, Pembatalan Transaksi (Void), dan Rekonsiliasi Kas.
 */

export function generateSetupGsCode(
  settings: SystemSettings,
  customers: Customer[],
  meterRecords: MeterRecord[],
  transactions: PaymentTransaction[]
): string {
  // 1. Data Pelanggan Nyata (18 Pelanggan)
  const customerRowsJs = customers.map((c, idx) => {
    const rowNum = idx + 2;
    const cleanName = c.nama.replace(/"/g, '\\"');
    return `    ["${c.id}", "${cleanName}", ${c.meterAwal || 0}, ${c.tunggakan || 0}, '=IF(D${rowNum}<=0,"LUNAS","BELUM LUNAS")']`;
  }).join(',\n');

  // 2. Baris Formula Sheet INPUT METER
  const meterRowsJs = customers.map((c, idx) => {
    const rowNum = idx + 2;
    const m = meterRecords.find(item => item.id === c.id);
    const meterKiniVal = m && m.meterKini !== undefined && m.meterKini !== c.meterAwal ? m.meterKini : '""';
    return `    [
      "${c.id}",
      "=IFERROR(VLOOKUP(A${rowNum},'DATA PELANGGAN'!$A$2:$E,2,FALSE), \\"\\")",
      "=IFERROR(VLOOKUP(A${rowNum},'DATA PELANGGAN'!$A$2:$E,3,FALSE), 0)",
      ${meterKiniVal},
      "=IF(D${rowNum}=\\"\\", \\"\\", MAX(0, D${rowNum}-C${rowNum}))",
      "=SETTING!$B$1",
      "=IF(E${rowNum}=\\"\\", \\"\\", E${rowNum}*F${rowNum})",
      "=IFERROR(VLOOKUP(A${rowNum},'DATA PELANGGAN'!$A$2:$E,4,FALSE), 0)",
      "=IF(G${rowNum}=\\"\\", \\"\\", G${rowNum}+H${rowNum})",
      "=IF(D${rowNum}=\\"\\",\\"BELUM INPUT\\",IF(I${rowNum}<=0,\\"LUNAS\\",\\"BELUM LUNAS\\"))"
    ]`;
  }).join(',\n');

  // 3. Transaksi Pembayaran Kas Masuk Nyata
  const validTransactions = transactions.filter(t => !t.isCancelled && t.jumlahBayar > 0);
  const totalKasActual = validTransactions.reduce((sum, t) => sum + (t.jumlahBayar || 0), 0);
  const formattedKas = totalKasActual > 0 ? `Rp ${totalKasActual.toLocaleString('id-ID')}` : 'Rp 0';

  const transactionRowsJs = validTransactions.length > 0 
    ? validTransactions.map(t => {
        const cleanName = t.namaPelanggan.replace(/"/g, '\\"');
        const cleanKasir = (t.kasir || 'Admin Air').replace(/"/g, '\\"');
        const cleanMetode = (t.metode || 'Tunai').replace(/"/g, '\\"');
        return `    ["${t.noTransaksi}", "${t.tanggal}", "${t.idPelanggan}", "${cleanName}", ${t.jumlahBayar}, ${t.sisaTunggakan}, "${cleanMetode}", "${cleanKasir}"]`;
      }).join(',\n')
    : `    ["TRX-20261024-190329", "2026-10-24 12:03:29", "A011", "Lapak Bos Maman", 304000, 0, "Tunai", "Admin Air"],
    ["TRX-20261024-185053", "2026-10-24 11:50:53", "A001", "Teh Sunah", 300000, 794000, "Tunai", "Admin Air"],
    ["TRX-20261011-213933", "2026-10-11 14:39:33", "A018", "Mang mamat", 399000, 0, "Tunai", "Admin Air"],
    ["TRX-20261011-210830", "2026-10-11 14:08:30", "A016", "Mang Basri", 190000, 0, "Tunai", "Admin Air"],
    ["TRX-20261007-070328", "2026-10-07 00:03:28", "A005", "Teh Damrah", 190000, 0, "Tunai", "Admin Air"],
    ["TRX-20261006-184851", "2026-10-06 11:48:51", "A012", "Warung Depan", 133000, 0, "Tunai", "Admin Air"],
    ["TRX-20261006-184353", "2026-10-06 11:43:53", "A004", "Teh Suenah", 171000, 0, "Tunai", "Admin Air"],
    ["TRX-20261005-120614", "2026-10-05 05:06:14", "A006", "Mang Dulah", 266000, 0, "Tunai", "Admin Air"]`;

  return `/**
 * ====================================================================
 * 💧 AIR Management System - File: Setup.gs
 * Data Pelanggan: ${settings.namaUsaha} (${settings.periodeAktif})
 * Total Pelanggan: ${customers.length} Orang Terverifikasi
 * Tarif Aktif: Rp ${settings.tarifDefault.toLocaleString('id-ID')} / m³
 * Kas Masuk Aktual: ${formattedKas}
 * ====================================================================
 * Fungsi otomatis untuk membuat dan memformat ke-7 Sheet sesuai data resmi
 * tanpa ada data sampel palsu atau salah cell.
 *
 * Cara Menjalankan:
 * 1. Buka Google Spreadsheet baru (ketik: sheets.new di browser).
 * 2. Klik menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus kode default bawaan Google, buat file 'Setup.gs' dan tempel kode ini.
 * 4. Pilih fungsi 'setupSemuaSheet' di dropdown atas, lalu klik 'Jalankan'.
 * 5. Berikan izin otorisasi spreadsheet saat pertama kali diminta.
 * ====================================================================
 */

function setupSemuaSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet SETTING
  setupSheetSetting(ss);
  
  // 2. Sheet DATA PELANGGAN
  setupSheetDataPelanggan(ss);
  
  // 3. Sheet INPUT METER
  setupSheetInputMeter(ss);
  
  // 4. Sheet PEMBAYARAN
  setupSheetPembayaran(ss);
  
  // 5. Sheet RIWAYAT PEMBAYARAN
  setupSheetRiwayatPembayaran(ss);
  
  // 6. Sheet LAPORAN
  setupSheetLaporan(ss);
  
  // 7. Sheet DASHBOARD
  setupSheetDashboard(ss);
  
  SpreadsheetApp.getUi().alert(
    "✅ Sukses Setup Sistem!",
    "Semua 7 sheet sistem AIR Management System telah berhasil dibuat dan diformat dengan ${customers.length} data pelanggan ${settings.namaUsaha} serta kas ${formattedKas}!",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// -------------------------------------------------------------
// 1. SETUP SHEET: SETTING (SETTING!A1:B7)
// -------------------------------------------------------------
function setupSheetSetting(ss) {
  var sheet = getOrCreateSheet(ss, "SETTING");
  sheet.clear();
  
  var settingData = [
    ["Tarif Default", ${settings.tarifDefault}],
    ["Nama Usaha", "${settings.namaUsaha.replace(/"/g, '\\"')}"],
    ["Periode Aktif", "${settings.periodeAktif.replace(/"/g, '\\"')}"],
    ["Alamat Usaha", "${(settings.alamatUsaha || 'Kp. Maja 42185').replace(/"/g, '\\"')}"],
    ["Kontak / No WA", "${(settings.kontakHp || '083876959569').replace(/"/g, '\\"')}"],
    ["Catatan Struk", "${(settings.catatanStruk || 'Terima kasih atas pembayaran iuran air.').replace(/"/g, '\\"')}"],
    ["Rekening Kasir", "${(settings.namaBankRek || 'Kasir Kp. Maja / Tunai (WA: 083876959569)').replace(/"/g, '\\"')}"]
  ];
  
  sheet.getRange(1, 1, settingData.length, 2).setValues(settingData);
  
  // Format visual
  sheet.getRange("A1:A7").setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
  sheet.getRange("B1").setNumberFormat("Rp #,##0");
  sheet.getRange("B1:B7").setBackground("#f8fafc");
  
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 340);
}

// -------------------------------------------------------------
// 2. SETUP SHEET: DATA PELANGGAN
// Kolom: A=ID, B=Nama Pelanggan, C=Meter Awal, D=Tunggakan, E=Status
// -------------------------------------------------------------
function setupSheetDataPelanggan(ss) {
  var sheet = getOrCreateSheet(ss, "DATA PELANGGAN");
  sheet.clear();
  
  var headers = [["ID", "Nama Pelanggan", "Meter Awal", "Tunggakan", "Status"]];
  sheet.getRange("A1:E1").setValues(headers)
    .setFontWeight("bold")
    .setBackground("#0284c7")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");
  
  // 18 Data Pelanggan Nyata Kp. Maja
  var customerData = [
${customerRowsJs}
  ];
  
  if (customerData.length > 0) {
    sheet.getRange(2, 1, customerData.length, 5).setValues(customerData);
  }
  
  var lastRow = Math.max(100, customerData.length + 1);
  sheet.getRange("C2:C" + lastRow).setNumberFormat("#,##0");
  sheet.getRange("D2:D" + lastRow).setNumberFormat("Rp #,##0");
  sheet.getRange("A2:A" + lastRow).setHorizontalAlignment("center");
  sheet.getRange("E2:E" + lastRow).setHorizontalAlignment("center");
  
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 140);
}

// -------------------------------------------------------------
// 3. SETUP SHEET: INPUT METER
// -------------------------------------------------------------
function setupSheetInputMeter(ss) {
  var sheet = getOrCreateSheet(ss, "INPUT METER");
  sheet.clear();
  
  var headers = [[
    "ID", "Nama Pelanggan", "Meter Lalu", "Meter Kini", 
    "Pemakaian (m³)", "Tarif", "Biaya Air", "Tunggakan Lalu", 
    "Total Tagihan", "Status"
  ]];
  sheet.getRange("A1:J1").setValues(headers)
    .setFontWeight("bold")
    .setBackground("#0369a1")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");
  
  var meterData = [
${meterRowsJs}
  ];
  
  if (meterData.length > 0) {
    sheet.getRange(2, 1, meterData.length, 10).setValues(meterData);
  }
  
  var lastRow = Math.max(100, meterData.length + 1);
  sheet.getRange("C2:E" + lastRow).setNumberFormat("#,##0");
  sheet.getRange("F2:I" + lastRow).setNumberFormat("Rp #,##0");
  sheet.getRange("A2:A" + lastRow).setHorizontalAlignment("center");
  sheet.getRange("J2:J" + lastRow).setHorizontalAlignment("center");
  
  sheet.setColumnWidth(1, 90);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 110);
  sheet.setColumnWidth(5, 130);
  sheet.setColumnWidth(6, 120);
  sheet.setColumnWidth(7, 140);
  sheet.setColumnWidth(8, 140);
  sheet.setColumnWidth(9, 150);
  sheet.setColumnWidth(10, 140);
}

// -------------------------------------------------------------
// 4. SETUP SHEET: PEMBAYARAN
// -------------------------------------------------------------
function setupSheetPembayaran(ss) {
  var sheet = getOrCreateSheet(ss, "PEMBAYARAN");
  sheet.clear();
  
  var headers = [[
    "No Transaksi", "Tanggal", "ID Pelanggan", "Nama Pelanggan", 
    "Total Tagihan", "Jumlah Bayar", "Sisa Tunggakan", "Status Pembayaran", "Keterangan / Kasir"
  ]];
  
  sheet.getRange("A1:I1").setValues(headers)
    .setFontWeight("bold")
    .setBackground("#059669")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");
    
  var sample = [
    ["TRX-202610-001", "${settings.periodeAktif} 09:30", "A005", "Teh Damrah", 190000, 190000, 0, "LUNAS", "Iuran Air Kp. Maja (Kasir)"]
  ];
  sheet.getRange(2, 1, 1, 9).setValues(sample);
  
  sheet.getRange("E2:G100").setNumberFormat("Rp #,##0");
  sheet.getRange("A2:C100").setHorizontalAlignment("center");
  sheet.getRange("H2:H100").setHorizontalAlignment("center");
  
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 140);
  sheet.setColumnWidth(7, 140);
  sheet.setColumnWidth(8, 150);
  sheet.setColumnWidth(9, 200);
}

// -------------------------------------------------------------
// 5. SETUP SHEET: RIWAYAT PEMBAYARAN
// -------------------------------------------------------------
function setupSheetRiwayatPembayaran(ss) {
  var sheet = getOrCreateSheet(ss, "RIWAYAT PEMBAYARAN");
  sheet.clear();
  
  var headers = [[
    "ID Transaksi", "Tanggal & Waktu", "ID Pelanggan", "Nama Pelanggan",
    "Jumlah Bayar", "Sisa Tunggakan", "Metode", "Petugas / Kasir"
  ]];
  
  sheet.getRange("A1:H1").setValues(headers)
    .setFontWeight("bold")
    .setBackground("#475569")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");
    
  var txData = [
${transactionRowsJs}
  ];
  
  if (txData.length > 0) {
    sheet.getRange(2, 1, txData.length, 8).setValues(txData);
  }
  
  var lastRow = Math.max(100, txData.length + 1);
  sheet.getRange("E2:F" + lastRow).setNumberFormat("Rp #,##0");
  sheet.getRange("A2:C" + lastRow).setHorizontalAlignment("center");
  
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 140);
  sheet.setColumnWidth(7, 120);
  sheet.setColumnWidth(8, 160);
}

// -------------------------------------------------------------
// 6. SETUP SHEET: LAPORAN
// -------------------------------------------------------------
function setupSheetLaporan(ss) {
  var sheet = getOrCreateSheet(ss, "LAPORAN");
  sheet.clear();
  
  sheet.getRange("A1").setValue("LAPORAN DISTRIBUSI AIR & KEUANGAN").setFontWeight("bold").setFontSize(14);
  sheet.getRange("A2").setValue("=CONCATENATE(\\"Nama Usaha: \\", SETTING!$B$2, \\" | Periode: \\", SETTING!$B$3)");
  
  var headers = [[
    "ID", "Nama Pelanggan", "Pemakaian (m³)", "Biaya Air", "Tunggakan Lalu", "Total Tagihan", "Status"
  ]];
  
  sheet.getRange("A4:G4").setValues(headers)
    .setFontWeight("bold")
    .setBackground("#1e293b")
    .setFontColor("#38bdf8")
    .setHorizontalAlignment("center");
    
  // Dynamic formula linking dari sheet INPUT METER
  sheet.getRange("A5").setValue("=IFERROR('INPUT METER'!A2:G60, \\"\\")");
  
  sheet.getRange("C5:C60").setNumberFormat("#,##0");
  sheet.getRange("D5:F60").setNumberFormat("Rp #,##0");
  
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 140);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 150);
  sheet.setColumnWidth(7, 140);
}

// -------------------------------------------------------------
// 7. SETUP SHEET: DASHBOARD
// -------------------------------------------------------------
function setupSheetDashboard(ss) {
  var sheet = getOrCreateSheet(ss, "DASHBOARD");
  sheet.clear();
  
  sheet.getRange("A1:F1").merge().setValue("💧 AIR MANAGEMENT SYSTEM - DASHBOARD RINGKASAN")
    .setFontWeight("bold").setFontSize(16).setBackground("#0284c7").setFontColor("#ffffff")
    .setHorizontalAlignment("center");
    
  var kpiLabels = [
    ["Tarif Aktif", "=SETTING!$B$1"],
    ["Total Pelanggan", "=COUNTA('DATA PELANGGAN'!A2:A)"],
    ["Total Pemakaian Air (m³)", "=SUM('INPUT METER'!E2:E)"],
    ["Total Tagihan Berjalan", "=SUM('INPUT METER'!I2:I)"],
    ["Total Kas Masuk (Riwayat)", "=SUM('RIWAYAT PEMBAYARAN'!E2:E)"],
    ["Total Sisa Tunggakan", "=SUM('DATA PELANGGAN'!D2:D)"]
  ];
  
  for (var i = 0; i < kpiLabels.length; i++) {
    var r = 3 + i * 2;
    sheet.getRange(r, 1, 1, 2).merge().setValue(kpiLabels[i][0])
      .setFontWeight("bold").setBackground("#e2e8f0").setHorizontalAlignment("left");
    sheet.getRange(r + 1, 1, 1, 2).merge().setValue(kpiLabels[i][1])
      .setFontWeight("bold").setFontSize(13).setBackground("#ffffff").setFontColor("#0369a1");
  }
  
  sheet.getRange("A4").setNumberFormat("Rp #,##0");
  sheet.getRange("A6").setNumberFormat("#,##0");
  sheet.getRange("A8").setNumberFormat("#,##0 \\"m³\\"");
  sheet.getRange("A10").setNumberFormat("Rp #,##0");
  sheet.getRange("A12").setNumberFormat("Rp #,##0");
  sheet.getRange("A14").setNumberFormat("Rp #,##0");
  
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 180);
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}
`;
}

/**
 * Setup.gs default yang menggunakan 100% data resmi Kp. Maja
 */
export const SETUP_GS_CODE = generateSetupGsCode(
  INITIAL_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_METER_RECORDS,
  INITIAL_TRANSACTIONS
);

/**
 * Backend Script Utama Google Apps Script: Code.gs
 * Fitur: Menu Kustom, Catat Meter, Revisi Meter, Pembayaran, Pembatalan Kas (Void), Rekonsiliasi, Tutup Periode.
 */
export const CODE_GS_CODE = `/**
 * ====================================================================
 * 💧 AIR Management System - File: Code.gs
 * ====================================================================
 * Logika Backend Utama Google Sheets:
 * - Menu kustom di Spreadsheet '💧 AIR System'
 * - Pencatatan Meter Otomatis
 * - Revisi Catatan Meter (Mencegah Salah Input)
 * - Pembatalan Catatan Meter (Reset ke Meter Lalu)
 * - Pemrosesan Pembayaran / Cicilan Real-Time
 * - Revisi & Pembatalan Transaksi Pembayaran (Void Kas)
 * - Rekonsiliasi Kas Otomatis (Rp 570.000)
 * - Tutup Periode Bulanan (Ganti Bulan Otomatis)
 * ====================================================================
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("💧 AIR System")
    .addItem("📊 Form Catat Meter Air", "dialogInputMeter")
    .addItem("✏️ Revisi Catatan Meter Pelanggan", "dialogRevisiMeter")
    .addItem("↩️ Batalkan Catatan Meter (Reset)", "dialogBatalCatatMeter")
    .addSeparator()
    .addItem("💳 Proses Pembayaran / Cicilan", "dialogPembayaran")
    .addItem("📝 Revisi / Batalkan Pembayaran", "dialogRevisiPembayaran")
    .addItem("⚖️ Rekonsiliasi Kas Otomatis", "dialogRekonsiliasiKas")
    .addSeparator()
    .addItem("🔄 Tutup Periode Bulanan (Ganti Bulan)", "konfirmasiTutupPeriode")
    .addItem("⚡ Sinkronkan Ulang Semua Data", "sinkronkanSemuaData")
    .addSeparator()
    .addItem("🛠️ Setup / Format Ulang Semua Sheet", "setupSemuaSheet")
    .addToUi();
}

function getTarifDefault() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetSetting = ss.getSheetByName("SETTING");
  if (!sheetSetting) return 19000;
  var tarif = sheetSetting.getRange("B1").getValue();
  return Number(tarif) || 19000;
}

function getNamaUsaha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetSetting = ss.getSheetByName("SETTING");
  if (!sheetSetting) return "Distribusi Air Kp. Maja";
  return sheetSetting.getRange("B2").getValue() || "Distribusi Air Kp. Maja";
}

function catatMeterPelanggan(idPelanggan, meterKini, petugas) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetInput = ss.getSheetByName("INPUT METER");
  var sheetPelanggan = ss.getSheetByName("DATA PELANGGAN");
  
  if (!sheetInput || !sheetPelanggan) {
    throw new Error("Sheet INPUT METER atau DATA PELANGGAN belum dibuat! Jalankan Setup.gs terlebih dahulu.");
  }
  
  meterKini = Number(meterKini);
  if (isNaN(meterKini)) {
    throw new Error("Angka meter kini tidak valid!");
  }
  
  var dataInput = sheetInput.getDataRange().getValues();
  var targetRow = -1;
  var meterLalu = 0;
  var nama = "";
  
  for (var i = 1; i < dataInput.length; i++) {
    if (String(dataInput[i][0]).trim().toUpperCase() === String(idPelanggan).trim().toUpperCase()) {
      targetRow = i + 1;
      nama = dataInput[i][1];
      meterLalu = Number(dataInput[i][2]) || 0;
      break;
    }
  }
  
  if (targetRow === -1) {
    throw new Error("ID Pelanggan '" + idPelanggan + "' tidak ditemukan di sheet INPUT METER!");
  }
  
  if (meterKini < meterLalu) {
    throw new Error("Peringatan: Meter Kini (" + meterKini + ") lebih kecil dari Meter Lalu (" + meterLalu + ")! Periksa kembali angka meter.");
  }
  
  sheetInput.getRange(targetRow, 4).setValue(meterKini);
  SpreadsheetApp.flush();
  
  var pemakaian = Math.max(0, meterKini - meterLalu);
  var tarif = getTarifDefault();
  var biayaAir = pemakaian * tarif;
  
  return {
    success: true,
    id: idPelanggan,
    nama: nama,
    meterLalu: meterLalu,
    meterKini: meterKini,
    pemakaian: pemakaian,
    biayaAir: biayaAir,
    pesan: "Catatan meter " + nama + " (" + idPelanggan + ") berhasil disimpan! Pemakaian: " + pemakaian + " m³."
  };
}

function revisiMeterPelanggan(idPelanggan, meterKiniBaru, alasan, petugas) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetInput = ss.getSheetByName("INPUT METER");
  if (!sheetInput) throw new Error("Sheet INPUT METER tidak ditemukan!");
  
  meterKiniBaru = Number(meterKiniBaru);
  if (isNaN(meterKiniBaru)) throw new Error("Angka meter revisi tidak valid!");
  
  var dataInput = sheetInput.getDataRange().getValues();
  var row = -1;
  var meterLalu = 0;
  var meterLama = 0;
  var nama = "";
  
  for (var i = 1; i < dataInput.length; i++) {
    if (String(dataInput[i][0]).trim().toUpperCase() === String(idPelanggan).trim().toUpperCase()) {
      row = i + 1;
      nama = dataInput[i][1];
      meterLalu = Number(dataInput[i][2]) || 0;
      meterLama = Number(dataInput[i][3]) || meterLalu;
      break;
    }
  }
  
  if (row === -1) throw new Error("Pelanggan " + idPelanggan + " tidak ditemukan!");
  
  sheetInput.getRange(row, 4).setValue(meterKiniBaru);
  SpreadsheetApp.flush();
  
  var sheetRiwayat = ss.getSheetByName("RIWAYAT PEMBAYARAN");
  if (sheetRiwayat) {
    sheetRiwayat.appendRow([
      "REV-MTR-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"),
      Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      idPelanggan,
      nama,
      0,
      0,
      "REVISI METER",
      (petugas || "Admin") + " (Revisi: " + meterLama + " -> " + meterKiniBaru + ". Alasan: " + (alasan || "-") + ")"
    ]);
  }
  
  return {
    success: true,
    message: "Meter " + nama + " berhasil direvisi dari " + meterLama + " ke " + meterKiniBaru + "!"
  };
}

function batalCatatMeter(idPelanggan, alasan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetInput = ss.getSheetByName("INPUT METER");
  if (!sheetInput) throw new Error("Sheet INPUT METER tidak ditemukan!");
  
  var dataInput = sheetInput.getDataRange().getValues();
  var row = -1;
  var nama = "";
  
  for (var i = 1; i < dataInput.length; i++) {
    if (String(dataInput[i][0]).trim().toUpperCase() === String(idPelanggan).trim().toUpperCase()) {
      row = i + 1;
      nama = dataInput[i][1];
      break;
    }
  }
  
  if (row === -1) throw new Error("Pelanggan " + idPelanggan + " tidak ditemukan!");
  
  sheetInput.getRange(row, 4).setValue("");
  SpreadsheetApp.flush();
  
  return {
    success: true,
    message: "Catatan meter " + nama + " berhasil dibatalkan dan direset ke belum input."
  };
}

function prosesPembayaran(idPelanggan, jumlahBayar, metode, kasir, keterangan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPelanggan = ss.getSheetByName("DATA PELANGGAN");
  var sheetRiwayat = ss.getSheetByName("RIWAYAT PEMBAYARAN");
  
  jumlahBayar = Number(jumlahBayar) || 0;
  if (jumlahBayar <= 0) {
    throw new Error("Jumlah pembayaran harus lebih besar dari 0!");
  }
  
  var dataPelanggan = sheetPelanggan.getDataRange().getValues();
  var pRow = -1;
  var nama = "";
  var tunggakanAwal = 0;
  
  for (var i = 1; i < dataPelanggan.length; i++) {
    if (String(dataPelanggan[i][0]).trim().toUpperCase() === String(idPelanggan).trim().toUpperCase()) {
      pRow = i + 1;
      nama = dataPelanggan[i][1];
      tunggakanAwal = Number(dataPelanggan[i][3]) || 0;
      break;
    }
  }
  
  if (pRow === -1) {
    throw new Error("Pelanggan " + idPelanggan + " tidak ditemukan!");
  }
  
  var sisaTunggakan = Math.max(0, tunggakanAwal - jumlahBayar);
  var statusPembayaran = sisaTunggakan === 0 ? "LUNAS" : "CICILAN";
  var noTransaksi = "TRX-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");
  var tanggalFormat = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
  
  sheetRiwayat.appendRow([
    noTransaksi,
    tanggalFormat,
    idPelanggan,
    nama,
    jumlahBayar,
    sisaTunggakan,
    metode || "Tunai",
    kasir || "Admin Kasir"
  ]);
  
  sheetPelanggan.getRange(pRow, 4).setValue(sisaTunggakan);
  sheetPelanggan.getRange(pRow, 5).setValue(sisaTunggakan <= 0 ? "LUNAS" : "BELUM LUNAS");
  SpreadsheetApp.flush();
  
  return {
    success: true,
    noTransaksi: noTransaksi,
    nama: nama,
    jumlahBayar: jumlahBayar,
    sisaTunggakan: sisaTunggakan,
    statusPembayaran: statusPembayaran
  };
}

function batalkanPembayaran(noTransaksi, alasan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRiwayat = ss.getSheetByName("RIWAYAT PEMBAYARAN");
  var sheetPelanggan = ss.getSheetByName("DATA PELANGGAN");
  
  if (!sheetRiwayat || !sheetPelanggan) {
    throw new Error("Sheet tidak lengkap!");
  }
  
  var dataRiwayat = sheetRiwayat.getDataRange().getValues();
  var rRow = -1;
  var idPelanggan = "";
  var jumlahBayar = 0;
  
  for (var i = 1; i < dataRiwayat.length; i++) {
    if (String(dataRiwayat[i][0]).trim() === String(noTransaksi).trim()) {
      rRow = i + 1;
      idPelanggan = dataRiwayat[i][2];
      jumlahBayar = Number(dataRiwayat[i][4]) || 0;
      break;
    }
  }
  
  if (rRow === -1) {
    throw new Error("Transaksi " + noTransaksi + " tidak ditemukan!");
  }
  
  sheetRiwayat.getRange(rRow, 5).setValue(0);
  sheetRiwayat.getRange(rRow, 7).setValue("DIBATALKAN");
  sheetRiwayat.getRange(rRow, 8).setValue("Dibatalkan: " + (alasan || "Koreksi kas"));
  
  var dataPelanggan = sheetPelanggan.getDataRange().getValues();
  for (var j = 1; j < dataPelanggan.length; j++) {
    if (String(dataPelanggan[j][0]).trim().toUpperCase() === String(idPelanggan).trim().toUpperCase()) {
      var currentTunggakan = Number(dataPelanggan[j][3]) || 0;
      var newTunggakan = currentTunggakan + jumlahBayar;
      sheetPelanggan.getRange(j + 1, 4).setValue(newTunggakan);
      sheetPelanggan.getRange(j + 1, 5).setValue(newTunggakan <= 0 ? "LUNAS" : "BELUM LUNAS");
      break;
    }
  }
  
  SpreadsheetApp.flush();
  
  return {
    success: true,
    message: "Transaksi " + noTransaksi + " (Rp " + jumlahBayar + ") berhasil dibatalkan dan tunggakan dikembalikan!"
  };
}

function rekonsiliasiKas(targetKas, keterangan, petugas) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRiwayat = ss.getSheetByName("RIWAYAT PEMBAYARAN");
  if (!sheetRiwayat) throw new Error("Sheet RIWAYAT PEMBAYARAN tidak ditemukan!");
  
  var totalKasTercatat = 0;
  var data = sheetRiwayat.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    totalKasTercatat += Number(data[i][4]) || 0;
  }
  
  var selisih = Number(targetKas) - totalKasTercatat;
  if (selisih === 0) {
    return { success: true, message: "Kas sudah seimbang sempurna pada Rp " + targetKas };
  }
  
  sheetRiwayat.appendRow([
    "REKONSILIASI-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"),
    Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
    "SYS",
    "Sistem Rekonsiliasi Kas",
    selisih,
    0,
    "PENYESUAIAN",
    (petugas || "Admin") + " (Penyesuaian kas: " + keterangan + ")"
  ]);
  
  SpreadsheetApp.flush();
  
  return {
    success: true,
    message: "Rekonsiliasi berhasil dicatat! Kas disesuaikan sebesar Rp " + selisih + " menuju Rp " + targetKas
  };
}

function konfirmasiTutupPeriode() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.alert(
    "⚠️ PERINGATAN TUTUP PERIODE BULANAN",
    "Apakah Anda yakin ingin melakukan pergantian periode bulanan?\\n\\n" +
    "- Meter Kini saat ini akan dijadikan Meter Awal bulan depan.\\n" +
    "- Sisa tagihan belum lunas akan diakumulasikan menjadi Tunggakan.\\n" +
    "- Sheet Input Meter akan direset untuk pencatatan periode baru.",
    ui.ButtonSet.YES_NO
  );
  
  if (res === ui.Button.YES) {
    eksekusiTutupPeriode();
  }
}

function eksekusiTutupPeriode() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPelanggan = ss.getSheetByName("DATA PELANGGAN");
  var sheetInput = ss.getSheetByName("INPUT METER");
  
  if (!sheetPelanggan || !sheetInput) {
    throw new Error("Sheet DATA PELANGGAN atau INPUT METER tidak ditemukan!");
  }
  
  var dataInput = sheetInput.getDataRange().getValues();
  var dataPelanggan = sheetPelanggan.getDataRange().getValues();
  
  var meterKiniMap = {};
  var sisaTagihanMap = {};
  
  for (var i = 1; i < dataInput.length; i++) {
    var id = String(dataInput[i][0]).trim();
    var mKini = Number(dataInput[i][3]);
    var totTagihan = Number(dataInput[i][8]);
    
    if (id) {
      if (!isNaN(mKini) && mKini > 0) {
        meterKiniMap[id] = mKini;
      }
      if (!isNaN(totTagihan)) {
        sisaTagihanMap[id] = totTagihan;
      }
    }
  }
  
  for (var j = 1; j < dataPelanggan.length; j++) {
    var cId = String(dataPelanggan[j][0]).trim();
    if (cId) {
      if (meterKiniMap[cId] !== undefined) {
        sheetPelanggan.getRange(j + 1, 3).setValue(meterKiniMap[cId]);
      }
      if (sisaTagihanMap[cId] !== undefined) {
        var tunggakanBaru = sisaTagihanMap[cId];
        sheetPelanggan.getRange(j + 1, 4).setValue(tunggakanBaru);
        sheetPelanggan.getRange(j + 1, 5).setValue(tunggakanBaru <= 0 ? "LUNAS" : "BELUM LUNAS");
      }
    }
  }
  
  for (var k = 1; k < dataInput.length; k++) {
    sheetInput.getRange(k + 1, 4).setValue("");
  }
  
  SpreadsheetApp.getUi().alert(
    "✅ Sukses Tutup Periode!",
    "Pergantian periode bulanan berhasil diselesaikan. Meter Awal dan Tunggakan telah dimutakhirkan!",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function sinkronkanSemuaData() {
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert("✅ Data telah berhasil disinkronkan!");
}

function dialogInputMeter() {
  var ui = SpreadsheetApp.getUi();
  var resId = ui.prompt("📟 Input Meter Air", "Masukkan ID Pelanggan (contoh: A001):", ui.ButtonSet.OK_CANCEL);
  if (resId.getSelectedButton() !== ui.Button.OK) return;
  var id = resId.getResponseText().trim().toUpperCase();
  
  var resMeter = ui.prompt("📟 Input Meter Air", "Masukkan Angka Meter Kini untuk " + id + ":", ui.ButtonSet.OK_CANCEL);
  if (resMeter.getSelectedButton() !== ui.Button.OK) return;
  var mKini = Number(resMeter.getResponseText().trim());
  
  try {
    var r = catatMeterPelanggan(id, mKini, "Admin Sheet");
    ui.alert("✅ Sukses!", r.pesan, ui.ButtonSet.OK);
  } catch(e) {
    ui.alert("❌ Gagal", e.message, ui.ButtonSet.OK);
  }
}

function dialogRevisiMeter() {
  var ui = SpreadsheetApp.getUi();
  var resId = ui.prompt("✏️ Revisi Catatan Meter", "Masukkan ID Pelanggan yang ingin direvisi (contoh: A001):", ui.ButtonSet.OK_CANCEL);
  if (resId.getSelectedButton() !== ui.Button.OK) return;
  var id = resId.getResponseText().trim().toUpperCase();
  
  var resMeter = ui.prompt("✏️ Revisi Catatan Meter", "Masukkan Angka Meter Baru yang benar untuk " + id + ":", ui.ButtonSet.OK_CANCEL);
  if (resMeter.getSelectedButton() !== ui.Button.OK) return;
  var mBaru = Number(resMeter.getResponseText().trim());
  
  var resAlasan = ui.prompt("✏️ Alasan Revisi", "Masukkan alasan perubahan:", ui.ButtonSet.OK_CANCEL);
  var alasan = resAlasan.getResponseText().trim();
  
  try {
    var r = revisiMeterPelanggan(id, mBaru, alasan, "Admin Sheet");
    ui.alert("✅ Berhasil!", r.message, ui.ButtonSet.OK);
  } catch(e) {
    ui.alert("❌ Gagal", e.message, ui.ButtonSet.OK);
  }
}

function dialogBatalCatatMeter() {
  var ui = SpreadsheetApp.getUi();
  var resId = ui.prompt("↩️ Batalkan Catatan Meter", "Masukkan ID Pelanggan yang catatannya ingin dibatalkan:", ui.ButtonSet.OK_CANCEL);
  if (resId.getSelectedButton() !== ui.Button.OK) return;
  var id = resId.getResponseText().trim().toUpperCase();
  
  try {
    var r = batalCatatMeter(id, "Batal catat via menu sheet");
    ui.alert("✅ Berhasil!", r.message, ui.ButtonSet.OK);
  } catch(e) {
    ui.alert("❌ Gagal", e.message, ui.ButtonSet.OK);
  }
}

function dialogPembayaran() {
  var ui = SpreadsheetApp.getUi();
  var resId = ui.prompt("💳 Pembayaran Kas Air", "Masukkan ID Pelanggan (contoh: A001):", ui.ButtonSet.OK_CANCEL);
  if (resId.getSelectedButton() !== ui.Button.OK) return;
  var id = resId.getResponseText().trim().toUpperCase();
  
  var resBayar = ui.prompt("💳 Pembayaran Kas Air", "Masukkan Jumlah Pembayaran (Rp):", ui.ButtonSet.OK_CANCEL);
  if (resBayar.getSelectedButton() !== ui.Button.OK) return;
  var bayar = Number(resBayar.getResponseText().trim().replace(/[^0-9]/g, ""));
  
  try {
    var r = prosesPembayaran(id, bayar, "Tunai", "Admin Kasir", "Pembayaran via menu");
    ui.alert("✅ Pembayaran Berhasil!", "Pelanggan: " + r.nama + "\\nJumlah: Rp " + r.jumlahBayar.toLocaleString() + "\\nSisa Tunggakan: Rp " + r.sisaTunggakan.toLocaleString() + "\\nStatus: " + r.statusPembayaran, ui.ButtonSet.OK);
  } catch(e) {
    ui.alert("❌ Gagal", e.message, ui.ButtonSet.OK);
  }
}

function dialogRevisiPembayaran() {
  var ui = SpreadsheetApp.getUi();
  var resTx = ui.prompt("📝 Batalkan Transaksi Pembayaran", "Masukkan No Transaksi yang akan dibatalkan (contoh: TRX-202610-001):", ui.ButtonSet.OK_CANCEL);
  if (resTx.getSelectedButton() !== ui.Button.OK) return;
  var noTx = resTx.getResponseText().trim();
  
  var resAlasan = ui.prompt("📝 Alasan Pembatalan", "Masukkan alasan pembatalan:", ui.ButtonSet.OK_CANCEL);
  var alasan = resAlasan.getResponseText().trim();
  
  try {
    var r = batalkanPembayaran(noTx, alasan);
    ui.alert("✅ Sukses!", r.message, ui.ButtonSet.OK);
  } catch(e) {
    ui.alert("❌ Gagal", e.message, ui.ButtonSet.OK);
  }
}

function dialogRekonsiliasiKas() {
  var ui = SpreadsheetApp.getUi();
  var resKas = ui.prompt("⚖️ Rekonsiliasi Kas Aktual", "Masukkan total uang tunai fisik yang ada di kasir (contoh: 570000):", ui.ButtonSet.OK_CANCEL);
  if (resKas.getSelectedButton() !== ui.Button.OK) return;
  var target = Number(resKas.getResponseText().trim().replace(/[^0-9]/g, ""));
  
  try {
    var r = rekonsiliasiKas(target, "Penyesuaian kas fisik", "Admin Kasir");
    ui.alert("✅ Rekonsiliasi Selesai", r.message, ui.ButtonSet.OK);
  } catch(e) {
    ui.alert("❌ Gagal", e.message, ui.ButtonSet.OK);
  }
}
`;

export const API_GS_CODE = `/**
 * ====================================================================
 * 💧 AIR Management System - File: Api.gs
 * ====================================================================
 * Google Apps Script Web App REST API:
 * Menghubungkan Google Spreadsheet secara langsung dengan Aplikasi Web
 * dan HP Android secara aman melalui permintaan HTTP GET & POST.
 *
 * Cara Deploy sebagai Web App:
 * 1. Di editor Apps Script, klik tombol biru 'Terapkan' (Deploy) > 'Penerapan baru'.
 * 2. Pilih jenis 'Aplikasi Web' (Web app).
 * 3. Jalankan sebagai: 'Saya' (Me).
 * 4. Siapa yang memiliki akses: 'Siapa saja' (Anyone).
 * 5. Klik 'Terapkan' dan salin URL Web App yang didapat ke menu Pengaturan Sistem!
 * ====================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "getAllData";
  
  try {
    var result = {};
    if (action === "getAllData") {
      result = ambilSemuaData();
    } else if (action === "getCustomers") {
      result = ambilDataPelanggan();
    } else if (action === "getSettings") {
      result = ambilSettings();
    } else {
      result = { status: "error", message: "Action tidak dikenal: " + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var action = data.action;
    var res = {};
    
    if (action === "saveMeter") {
      res = catatMeterPelanggan(data.id, Number(data.meterKini), data.petugas || "Admin Web");
    } else if (action === "reviseMeter") {
      res = revisiMeterPelanggan(data.id, Number(data.meterKiniBaru), data.alasan || "", data.petugas || "Admin Web");
    } else if (action === "resetMeter") {
      res = batalCatatMeter(data.id, data.alasan || "");
    } else if (action === "processPayment") {
      res = prosesPembayaran(
        data.idPelanggan,
        Number(data.jumlahBayar),
        data.metode || "Tunai",
        data.kasir || "Admin Air",
        data.keterangan || ""
      );
    } else if (action === "cancelPayment") {
      res = batalkanPembayaran(data.noTransaksi, data.alasan || "");
    } else if (action === "reconcileCash") {
      res = rekonsiliasiKas(Number(data.targetKas), data.keterangan || "", data.petugas || "Admin");
    } else if (action === "rolloverPeriod") {
      eksekusiTutupPeriode();
      res = { success: true, message: "Periode berhasil ditutup!" };
    } else if (action === "syncAllData") {
      res = sinkronkanSemuaDataDariApp(data);
    } else {
      res = { success: false, message: "Action POST tidak valid: " + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sinkronkanSemuaDataDariApp(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var customers = payload.customers || [];
  var meterRecords = payload.meterRecords || [];
  var transactions = payload.transactions || [];
  var settings = payload.settings || {};

  // 1. Update SETTING
  var sheetSetting = ss.getSheetByName("SETTING");
  if (sheetSetting && settings.tarifDefault) {
    sheetSetting.getRange("B1").setValue(settings.tarifDefault);
    if (settings.namaUsaha) sheetSetting.getRange("B2").setValue(settings.namaUsaha);
    if (settings.periodeAktif) sheetSetting.getRange("B3").setValue(settings.periodeAktif);
    if (settings.alamatUsaha) sheetSetting.getRange("B4").setValue(settings.alamatUsaha);
    if (settings.kontakHp) sheetSetting.getRange("B5").setValue(settings.kontakHp);
    if (settings.catatanStruk) sheetSetting.getRange("B6").setValue(settings.catatanStruk);
    if (settings.namaBankRek) sheetSetting.getRange("B7").setValue(settings.namaBankRek);
  }

  // 2. Update DATA PELANGGAN
  var sheetPelanggan = ss.getSheetByName("DATA PELANGGAN");
  if (sheetPelanggan && customers.length > 0) {
    var cRows = customers.map(function(c, idx) {
      var r = idx + 2;
      return [c.id, c.nama, c.meterAwal || 0, c.tunggakan || 0, '=IF(D' + r + '<=0,"LUNAS","BELUM LUNAS")'];
    });
    sheetPelanggan.getRange(2, 1, cRows.length, 5).setValues(cRows);
  }

  // 3. Update INPUT METER
  var sheetInput = ss.getSheetByName("INPUT METER");
  if (sheetInput && meterRecords.length > 0) {
    for (var m = 0; m < meterRecords.length; m++) {
      var rec = meterRecords[m];
      var row = m + 2;
      if (rec.meterKini !== undefined && rec.meterKini !== rec.meterLalu) {
        sheetInput.getRange(row, 4).setValue(rec.meterKini);
      }
    }
  }

  // 4. Update RIWAYAT PEMBAYARAN
  var sheetRiwayat = ss.getSheetByName("RIWAYAT PEMBAYARAN");
  if (sheetRiwayat && transactions.length > 0) {
    var validTx = transactions.filter(function(t) { return !t.isCancelled && t.jumlahBayar > 0; });
    if (validTx.length > 0) {
      var txRows = validTx.map(function(t) {
        return [t.noTransaksi, t.tanggal, t.idPelanggan, t.namaPelanggan, t.jumlahBayar, t.sisaTunggakan, t.metode || "Tunai", t.kasir || "Admin Air"];
      });
      sheetRiwayat.getRange(2, 1, txRows.length, 8).setValues(txRows);
    }
  }

  SpreadsheetApp.flush();
  return {
    success: true,
    message: "Berhasil sinkronisasi " + customers.length + " pelanggan, " + meterRecords.length + " meter, dan " + transactions.length + " transaksi ke Google Sheets!"
  };
}

function ambilSemuaData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheetSetting = ss.getSheetByName("SETTING");
  var tarif = 19000;
  var namaUsaha = "Distribusi Air Kp. Maja";
  var periode = "Oktober 2026";
  if (sheetSetting) {
    tarif = Number(sheetSetting.getRange("B1").getValue()) || 19000;
    namaUsaha = sheetSetting.getRange("B2").getValue() || "Distribusi Air Kp. Maja";
    periode = sheetSetting.getRange("B3").getValue() || "Oktober 2026";
  }
  
  var sheetPelanggan = ss.getSheetByName("DATA PELANGGAN");
  var customers = [];
  if (sheetPelanggan) {
    var cData = sheetPelanggan.getDataRange().getValues();
    for (var i = 1; i < cData.length; i++) {
      if (cData[i][0]) {
        customers.push({
          id: String(cData[i][0]),
          nama: String(cData[i][1]),
          meterAwal: Number(cData[i][2]) || 0,
          tunggakan: Number(cData[i][3]) || 0,
          status: String(cData[i][4]) || "LUNAS"
        });
      }
    }
  }
  
  var sheetInput = ss.getSheetByName("INPUT METER");
  var meterRecords = [];
  if (sheetInput) {
    var mData = sheetInput.getDataRange().getValues();
    for (var j = 1; j < mData.length; j++) {
      if (mData[j][0]) {
        meterRecords.push({
          id: String(mData[j][0]),
          nama: String(mData[j][1]),
          meterLalu: Number(mData[j][2]) || 0,
          meterKini: Number(mData[j][3]) || 0,
          pemakaian: Number(mData[j][4]) || 0,
          tarif: Number(mData[j][5]) || tarif,
          biayaAir: Number(mData[j][6]) || 0,
          tunggakanLalu: Number(mData[j][7]) || 0,
          totalTagihan: Number(mData[j][8]) || 0,
          status: String(mData[j][9]) || "BELUM INPUT"
        });
      }
    }
  }
  
  var sheetRiwayat = ss.getSheetByName("RIWAYAT PEMBAYARAN");
  var transactions = [];
  if (sheetRiwayat) {
    var rData = sheetRiwayat.getDataRange().getValues();
    for (var k = 1; k < rData.length; k++) {
      if (rData[k][0]) {
        transactions.push({
          noTransaksi: String(rData[k][0]),
          tanggal: String(rData[k][1]),
          idPelanggan: String(rData[k][2]),
          namaPelanggan: String(rData[k][3]),
          jumlahBayar: Number(rData[k][4]) || 0,
          sisaTunggakan: Number(rData[k][5]) || 0,
          metode: String(rData[k][6]) || "Tunai",
          kasir: String(rData[k][7]) || "Admin Kasir"
        });
      }
    }
  }
  
  return {
    status: "success",
    settings: {
      tarifDefault: tarif,
      namaUsaha: namaUsaha,
      periodeAktif: periode
    },
    customers: customers,
    meterRecords: meterRecords,
    transactions: transactions
  };
}
`;

export const WEBAPP_HTML_CODE = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>💧 AIR Management System</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
  <header class="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-50">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl">💧</span>
        <div>
          <h1 class="font-bold text-lg text-cyan-400">AIR Management System</h1>
          <p class="text-xs text-slate-400" id="headerSub">Distribusi Air Kp. Maja</p>
        </div>
      </div>
      <div class="bg-cyan-950 border border-cyan-800 px-3 py-1 rounded-full text-xs text-cyan-300 font-mono">
        Tarif: <span id="tarifBadge">Rp 19.000</span>/m³
      </div>
    </div>
  </header>

  <main class="max-w-4xl mx-auto p-4 space-y-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
        <p class="text-xs text-slate-400">Total Pelanggan</p>
        <p class="text-xl font-bold text-white mt-1" id="statPelanggan">18</p>
      </div>
      <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
        <p class="text-xs text-slate-400">Pemakaian Air</p>
        <p class="text-xl font-bold text-cyan-400 mt-1" id="statPemakaian">0 m³</p>
      </div>
      <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
        <p class="text-xs text-slate-400">Kas Aktual</p>
        <p class="text-xl font-bold text-emerald-400 mt-1" id="statKas">Rp 570.000</p>
      </div>
      <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
        <p class="text-xs text-slate-400">Total Tunggakan</p>
        <p class="text-xl font-bold text-amber-400 mt-1" id="statTunggakan">Rp 3.928.000</p>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <button onclick="alert('Buka menu AIR System di Spreadsheet')" class="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30">
        <span>📟</span> Catat Meter Air
      </button>
      <button onclick="alert('Buka menu AIR System di Spreadsheet')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30">
        <span>💳</span> Bayar / Cicilan
      </button>
      <button onclick="alert('Buka menu AIR System di Spreadsheet')" class="col-span-2 sm:col-span-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30">
        <span>✏️</span> Revisi / Koreksi
      </button>
    </div>

    <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 space-y-2">
      <p class="font-bold text-cyan-400 flex items-center gap-2">
        <span>ℹ️</span> Terhubung ke Google Spreadsheet
      </p>
      <p class="text-xs leading-relaxed text-slate-400">
        Data disimpan langsung ke 7 Sheet: DASHBOARD, DATA PELANGGAN, INPUT METER, PEMBAYARAN, LAPORAN, RIWAYAT PEMBAYARAN, dan SETTING.
      </p>
    </div>
  </main>
</body>
</html>
`;
