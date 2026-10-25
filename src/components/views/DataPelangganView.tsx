import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  Gauge,
  Send,
  CheckCircle2,
  AlertTriangle,
  Info,
  ClipboardList,
  UploadCloud,
  Check,
  X
} from 'lucide-react';
import { Customer, MeterRecord, SystemSettings } from '../../types';
import { formatRupiah, formatNumber, generateWhatsAppMessage } from '../../utils/formatters';

interface DataPelangganViewProps {
  customers: Customer[];
  meterRecords: MeterRecord[];
  settings: SystemSettings;
  onAddCustomer: (customer: Customer) => void;
  onBulkAddCustomers: (customers: Customer[], replaceAll?: boolean) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onSelectCustomerForPayment: (customerId: string) => void;
  onOpenMeterModal: (customerId: string) => void;
}

export const DataPelangganView: React.FC<DataPelangganViewProps> = ({
  customers,
  meterRecords,
  settings,
  onAddCustomer,
  onBulkAddCustomers,
  onUpdateCustomer,
  onDeleteCustomer,
  onSelectCustomerForPayment,
  onOpenMeterModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LUNAS' | 'BELUM LUNAS'>('ALL');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Bulk paste modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');
  const [bulkReplaceAll, setBulkReplaceAll] = useState(false);
  const [bulkParsedPreview, setBulkParsedPreview] = useState<Customer[]>([]);

  // Form states
  const [formId, setFormId] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formMeterAwal, setFormMeterAwal] = useState<number>(0);
  const [formTunggakan, setFormTunggakan] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generate next ID like A009
  const getNextId = (offset = 0) => {
    const existingNums = customers
      .map(c => {
        const match = c.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    return `A${String(maxNum + 1 + offset).padStart(3, '0')}`;
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormId(getNextId());
    setFormNama('');
    setFormMeterAwal(0);
    setFormTunggakan(0);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormId(customer.id);
    setFormNama(customer.nama);
    setFormMeterAwal(customer.meterAwal);
    setFormTunggakan(customer.tunggakan);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Smart Parser for Bulk Text
  const parseBulkText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed: Customer[] = [];
    let autoIdCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip header lines if user pasted header
      if (
        line.toLowerCase().includes('nama') &&
        (line.toLowerCase().includes('meter') || line.toLowerCase().includes('tunggakan'))
      ) {
        continue;
      }

      // Split by tab, pipe, semicolon, or comma
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes('|')) {
        parts = line.split('|');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else if (line.includes(',')) {
        parts = line.split(',');
      } else {
        // Fallback: split by multiple spaces
        parts = line.split(/\s{2,}/);
      }

      parts = parts.map(p => p.trim());

      if (parts.length >= 2) {
        let id = '';
        let nama = '';
        let meterAwal = 0;
        let tunggakan = 0;

        // Check if first column looks like an ID (e.g. A001, 1, 01, P-01)
        const firstLooksLikeId =
          /^[A-Za-z0-9_-]{1,6}$/.test(parts[0]) &&
          parts.length >= 3 &&
          isNaN(Number(parts[1]));

        if (firstLooksLikeId) {
          id = parts[0].toUpperCase();
          nama = parts[1];
          meterAwal = parseFloat(parts[2].replace(/[^0-9.-]/g, '')) || 0;
          tunggakan = parts[3] ? parseFloat(parts[3].replace(/[^0-9.-]/g, '')) || 0 : 0;
        } else {
          // Format without ID: Nama, Meter Awal, Tunggakan
          id = `A${String(autoIdCounter).padStart(3, '0')}`;
          autoIdCounter++;
          nama = parts[0];
          meterAwal = parseFloat(parts[1].replace(/[^0-9.-]/g, '')) || 0;
          tunggakan = parts[2] ? parseFloat(parts[2].replace(/[^0-9.-]/g, '')) || 0 : 0;
        }

        if (nama) {
          parsed.push({
            id,
            nama,
            meterAwal,
            tunggakan,
            status: tunggakan <= 0 ? 'LUNAS' : 'BELUM LUNAS'
          });
        }
      }
    }

    setBulkParsedPreview(parsed);
  };

  const handleBulkInputChange = (val: string) => {
    setBulkInputText(val);
    parseBulkText(val);
  };

  const handleSaveBulk = () => {
    if (bulkParsedPreview.length === 0) return;
    onBulkAddCustomers(bulkParsedPreview, bulkReplaceAll);
    setIsBulkModalOpen(false);
    setBulkInputText('');
    setBulkParsedPreview([]);
    alert(`✅ Berhasil memasukkan ${bulkParsedPreview.length} data pelanggan!`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formNama.trim()) {
      setErrorMsg('ID dan Nama Pelanggan wajib diisi!');
      return;
    }

    // Check duplicate ID if adding
    if (!editingCustomer && customers.some(c => c.id.toUpperCase() === formId.trim().toUpperCase())) {
      setErrorMsg(`ID ${formId} sudah digunakan oleh pelanggan lain!`);
      return;
    }

    const tunggakanVal = Number(formTunggakan) || 0;
    const customerObj: Customer = {
      id: formId.trim().toUpperCase(),
      nama: formNama.trim(),
      meterAwal: Number(formMeterAwal) || 0,
      tunggakan: tunggakanVal,
      status: tunggakanVal <= 0 ? 'LUNAS' : 'BELUM LUNAS'
    };

    if (editingCustomer) {
      onUpdateCustomer(customerObj);
    } else {
      onAddCustomer(customerObj);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus data pelanggan "${nama}" (${id})?`)) {
      onDeleteCustomer(id);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendWA = (c: Customer) => {
    const meter = meterRecords.find(m => m.id === c.id);
    const msg = generateWhatsAppMessage({
      namaUsaha: settings.namaUsaha,
      namaPelanggan: c.nama,
      idPelanggan: c.id,
      periode: settings.periodeAktif,
      meterLalu: meter ? meter.meterLalu : c.meterAwal,
      meterKini: meter ? meter.meterKini : c.meterAwal,
      pemakaian: meter ? meter.pemakaian : 0,
      tarif: settings.tarifDefault,
      biayaAir: meter ? meter.biayaAir : 0,
      tunggakanLalu: c.tunggakan,
      totalTagihan: meter ? meter.totalTagihan : c.tunggakan,
      namaBankRek: settings.namaBankRek,
      catatan: settings.catatanStruk
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>DATA PELANGGAN</span>
            </h2>
            <span className="text-xs bg-slate-700 text-slate-300 font-mono px-2 py-0.5 rounded-full">
              Sheet #2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Kolom A: ID • B: Nama • C: Meter Awal • D: Tunggakan • E: Status. Tarif aktif: <strong>{formatRupiah(settings.tarifDefault)}/m³</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setBulkInputText('');
              setBulkParsedPreview([]);
              setIsBulkModalOpen(true);
            }}
            className="bg-slate-700/80 hover:bg-slate-700 text-cyan-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-600 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Tempel Banyak (Bulk)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ID (A001) atau Nama Pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 outline-none transition-all"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('LUNAS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              statusFilter === 'LUNAS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Lunas</span>
          </button>
          <button
            onClick={() => setStatusFilter('BELUM LUNAS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              statusFilter === 'BELUM LUNAS'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Belum Lunas</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 w-24">Kolom A: ID</th>
                <th className="py-3.5 px-4">Kolom B: Nama Pelanggan</th>
                <th className="py-3.5 px-4 text-right">Kolom C: Meter Awal</th>
                <th className="py-3.5 px-4 text-right">Kolom D: Tunggakan</th>
                <th className="py-3.5 px-4 text-center">Kolom E: Status</th>
                <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada data pelanggan yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-700/30 transition-colors group"
                  >
                    {/* Kolom A: ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300 text-xs">
                      {c.id}
                    </td>

                    {/* Kolom B: Nama */}
                    <td className="py-3.5 px-4 text-white font-semibold">
                      {c.nama}
                    </td>

                    {/* Kolom C: Meter Awal */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {formatNumber(c.meterAwal)} <span className="text-[10px] text-slate-500">m³</span>
                    </td>

                    {/* Kolom D: Tunggakan */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span className={c.tunggakan > 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {formatRupiah(c.tunggakan)}
                      </span>
                    </td>

                    {/* Kolom E: Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          c.status === 'LUNAS'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Input Meter Button */}
                        <button
                          onClick={() => onOpenMeterModal(c.id)}
                          title="Input Meter"
                          className="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 transition-colors"
                        >
                          <Gauge className="w-3.5 h-3.5" />
                        </button>

                        {/* Bayar / Cicilan Button */}
                        <button
                          onClick={() => onSelectCustomerForPayment(c.id)}
                          title="Catat Pembayaran"
                          className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Tagihan */}
                        <button
                          onClick={() => handleSendWA(c)}
                          title="Kirim Tagihan via WhatsApp"
                          className="p-1.5 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Pelanggan"
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(c.id, c.nama)}
                          title="Hapus Pelanggan"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pelanggan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>{editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ID Pelanggan (Kolom A)
                </label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="Contoh: A001"
                  disabled={!!editingCustomer}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase outline-none disabled:opacity-50"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  ID adalah identitas unik utama pelanggan di Google Sheets.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Pelanggan (Kolom B)
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Teh Sunah / Mang Alung / Teh Minah"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meter Awal (Kolom C)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMeterAwal}
                    onChange={(e) => setFormMeterAwal(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white font-mono outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Angka meteran awal</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tunggakan (Kolom D)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formTunggakan}
                    onChange={(e) => setFormTunggakan(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white font-mono outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Dalam Rupiah (Rp)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Status Otomatis (Kolom E):</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded ${formTunggakan <= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                    {formTunggakan <= 0 ? 'LUNAS' : 'BELUM LUNAS'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30 transition-all active:scale-95"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tempel Data Banyak Sekaligus (Bulk Import) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsBulkModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">
                Tempel Data Pelanggan Sekaligus (Bulk Import)
              </h3>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Salin dan tempel baris data dari Excel, Google Sheets, atau WhatsApp. Sistem secara cerdas akan membaca <strong>ID</strong>, <strong>Nama</strong>, <strong>Meter Akhir Bulan Lalu (Meter Awal)</strong>, dan <strong>Sisa Tunggakan</strong>.
            </p>

            {/* Input Textarea */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Contoh Format yang Didukung:</span>
                <span className="font-mono text-cyan-400">A001 | Teh Sunah | 792 | 619000</span>
              </div>
              <textarea
                rows={6}
                value={bulkInputText}
                onChange={(e) => handleBulkInputChange(e.target.value)}
                placeholder={`Contoh 1 (Format dengan ID):
A001 | Teh Sunah | 817 | 1094000
A002 | Teh Minah | 199 | 39000
A003 | Mang Alung | 241 | 114000

Contoh 2 (Langsung copy kolom dari Excel / Google Sheets):
Teh Damrah	246	0
Mang Dulah	484	0`}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl p-3 text-xs text-white font-mono outline-none resize-none"
              />
            </div>

            {/* Preview Parsed Rows */}
            <div className="flex-1 overflow-hidden flex flex-col mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Hasil Pratinjau Terbaca ({bulkParsedPreview.length} Pelanggan)</span>
                </span>
                {bulkParsedPreview.length > 0 && (
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    Siap Dimasukkan
                  </span>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-y-auto max-h-40 p-2 text-xs">
                {bulkParsedPreview.length === 0 ? (
                  <p className="text-center py-6 text-slate-500 text-[11px]">
                    Tempelkan teks di atas untuk melihat pratinjau tabel otomatis.
                  </p>
                ) : (
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 pb-1">
                        <th className="py-1 px-2">ID</th>
                        <th className="py-1 px-2">Nama</th>
                        <th className="py-1 px-2 text-right">Meter Awal</th>
                        <th className="py-1 px-2 text-right">Tunggakan</th>
                        <th className="py-1 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {bulkParsedPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-1 px-2 text-cyan-300 font-bold">{item.id}</td>
                          <td className="py-1 px-2 text-white">{item.nama}</td>
                          <td className="py-1 px-2 text-right">{formatNumber(item.meterAwal)}</td>
                          <td className="py-1 px-2 text-right text-rose-300">{formatRupiah(item.tunggakan)}</td>
                          <td className="py-1 px-2 text-center">
                            <span className={item.tunggakan <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Opsi Penggantian & Tombol Simpan */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-700">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bulkReplaceAll}
                  onChange={(e) => setBulkReplaceAll(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Gantikan seluruh data pelanggan yang ada saat ini</span>
              </label>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulk}
                  disabled={bulkParsedPreview.length === 0}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Simpan {bulkParsedPreview.length} Pelanggan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
