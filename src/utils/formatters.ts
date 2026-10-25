export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num || 0);
}

export function generateWhatsAppMessage(params: {
  namaUsaha?: string;
  namaPelanggan: string;
  idPelanggan: string;
  periode: string;
  meterLalu: number;
  meterKini: number;
  pemakaian: number;
  tarif: number;
  biayaAir: number;
  tunggakanLalu: number;
  totalTagihan: number;
  jumlahBayar?: number;
  sisaTunggakan?: number;
  noTransaksi?: string;
  namaBankRek?: string;
  catatan?: string;
}): string {
  const isBayar = params.jumlahBayar !== undefined && params.jumlahBayar > 0;
  
  if (isBayar) {
    return `*BUKTI PEMBAYARAN AIR*
----------------------------------------
Nama : *${params.namaPelanggan}*
Periode : *${params.periode}*
No. Kwitansi : ${params.noTransaksi || '-'}
----------------------------------------
Total Tagihan  : ${formatRupiah(params.totalTagihan)}
*Jumlah Bayar  : ${formatRupiah(params.jumlahBayar || 0)}*
Sisa Tunggakan : *${formatRupiah(params.sisaTunggakan || 0)}*
Status : *${(params.sisaTunggakan || 0) <= 0 ? 'LUNAS ✅' : 'CICILAN ⏳'}*
----------------------------------------
Terima kasih.`;
  }

  return `*TAGIHAN PEMAKAIAN AIR*
----------------------------------------
Nama : *${params.namaPelanggan}*
Periode : *${params.periode}*
----------------------------------------
Rincian Meter:
• Meter Lalu : ${formatNumber(params.meterLalu)} m³
• Meter Kini : ${formatNumber(params.meterKini)} m³
• Pemakaian : *${formatNumber(params.pemakaian)} m³*

Rincian Tagihan:
• Biaya Air : ${formatRupiah(params.biayaAir)}
• Tunggakan Lalu : ${formatRupiah(params.tunggakanLalu)}
----------------------------------------
*TOTAL TAGIHAN : ${formatRupiah(params.totalTagihan)}*
----------------------------------------
Terima kasih.`;
}

export function generateGroupSummaryWhatsApp(
  records: { nama: string; totalTagihan: number; sisaTagihan?: number }[],
  periode: string
): string {
  const unpaid = records.filter(r => (r.sisaTagihan !== undefined ? r.sisaTagihan : r.totalTagihan) > 0);
  
  if (unpaid.length === 0) {
    return `*TAGIHAN AIR ${periode.toUpperCase()}*\nSemua tagihan sudah lunas.`;
  }

  let text = `*TAGIHAN AIR ${periode.toUpperCase()}*\n`;
  let totalSemua = 0;

  unpaid.forEach((r, idx) => {
    const sisa = r.sisaTagihan !== undefined ? r.sisaTagihan : r.totalTagihan;
    totalSemua += sisa;
    text += `${idx + 1}. ${r.nama} : ${formatRupiah(sisa)}\n`;
  });

  text += `----------------------------------------\n`;
  text += `*Total : ${formatRupiah(totalSemua)}*`;

  return text;
}
