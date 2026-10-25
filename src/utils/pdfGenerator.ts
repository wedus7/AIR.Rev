import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, MeterRecord, PaymentTransaction, SystemSettings } from '../types';
import { formatRupiah, formatNumber } from './formatters';

export function exportLaporanToPDF(
  settings: SystemSettings,
  customers: Customer[],
  meterRecords: MeterRecord[],
  transactions: PaymentTransaction[]
) {
  // Create jsPDF instance in A4 landscape for complete column visibility
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const totalPemakaian = meterRecords.reduce((acc, m) => acc + (m.pemakaian || 0), 0);
  const totalBiayaAir = meterRecords.reduce((acc, m) => acc + (m.biayaAir || 0), 0);
  const totalTunggakanLalu = meterRecords.reduce((acc, m) => acc + (m.tunggakanLalu || 0), 0);
  const totalTagihan = meterRecords.reduce((acc, m) => acc + (m.totalTagihan || 0), 0);
  const totalKasMasuk = transactions.reduce((acc, t) => acc + (t.jumlahBayar || 0), 0);
  const totalSisaPiutang = customers.reduce((acc, c) => acc + (c.tunggakan || 0), 0);
  const lunasCount = customers.filter(c => c.status === 'LUNAS').length;
  const belumLunasCount = customers.filter(c => c.status === 'BELUM LUNAS').length;

  // Title & Header Information
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(settings.namaUsaha.toUpperCase(), 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`${settings.alamatUsaha} | Telp/WA: ${settings.kontakHp}`, 14, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(`LAPORAN REKAPITULASI TAGIHAN AIR - PERIODE ${settings.periodeAktif.toUpperCase()}`, 14, 28);

  // Line separator
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(14, 31, 283, 31);

  // Summary Metrics Box
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  const summaryY = 36;
  doc.text(`Tarif Air: ${formatRupiah(settings.tarifDefault)} / m3`, 14, summaryY);
  doc.text(`Total Pelanggan: ${customers.length} Warga (${lunasCount} Lunas, ${belumLunasCount} Belum Lunas)`, 70, summaryY);
  doc.text(`Total Pemakaian: ${formatNumber(totalPemakaian)} m3`, 175, summaryY);

  doc.text(`Total Tagihan: ${formatRupiah(totalTagihan)}`, 14, summaryY + 5);
  doc.text(`Kas Diterima: ${formatRupiah(totalKasMasuk)}`, 70, summaryY + 5);
  doc.text(`Sisa Piutang: ${formatRupiah(totalSisaPiutang)}`, 175, summaryY + 5);

  // Prepare table data
  const tableData = meterRecords.map((m, index) => {
    const cust = customers.find(c => c.id === m.id);
    const sisa = cust ? cust.tunggakan : (m.sisaTagihan || m.totalTagihan);
    const status = sisa <= 0 ? 'LUNAS' : 'BELUM LUNAS';

    return [
      (index + 1).toString(),
      m.id,
      m.nama,
      formatNumber(m.meterLalu),
      m.isRecorded || m.meterKini > 0 ? formatNumber(m.meterKini) : '-',
      (m.isRecorded || m.meterKini > 0) && m.pemakaian > 0 ? formatNumber(m.pemakaian) : '0',
      formatRupiah(m.biayaAir),
      formatRupiah(m.tunggakanLalu),
      formatRupiah(m.totalTagihan),
      formatRupiah(sisa),
      status
    ];
  });

  // Add autoTable
  autoTable(doc, {
    startY: 46,
    head: [[
      'No',
      'ID',
      'Nama Pelanggan',
      'M. Lalu',
      'M. Kini',
      'Pakai (m3)',
      'Biaya Air',
      'Tunggakan Lalu',
      'Total Tagihan',
      'Sisa Piutang',
      'Status'
    ]],
    body: tableData,
    foot: [[
      '',
      '',
      'TOTAL KESELURUHAN',
      '',
      '',
      `${formatNumber(totalPemakaian)} m3`,
      formatRupiah(totalBiayaAir),
      formatRupiah(totalTunggakanLalu),
      formatRupiah(totalTagihan),
      formatRupiah(totalSisaPiutang),
      ''
    ]],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 16 },
      2: { cellWidth: 40 },
      3: { halign: 'right', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 28 },
      7: { halign: 'right', cellWidth: 28 },
      8: { halign: 'right', cellWidth: 28 },
      9: { halign: 'right', cellWidth: 28 },
      10: { halign: 'center', cellWidth: 25 }
    },
    didParseCell: (data) => {
      // Highlight status column in body
      if (data.section === 'body' && data.column.index === 10) {
        if (data.cell.raw === 'LUNAS') {
          data.cell.styles.textColor = [16, 185, 129]; // emerald
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [225, 29, 72]; // rose
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Save the PDF directly to user's device
  const filename = `Laporan_Air_${settings.namaUsaha.replace(/\s+/g, '_')}_${settings.periodeAktif.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
