import React, { useState, useRef, useEffect } from 'react';
import {
  Gauge,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Send,
  Save,
  ArrowRight,
  Info,
  Camera,
  Image as ImageIcon,
  X,
  Filter,
  Check,
  ChevronRight,
  Edit3,
  RotateCcw,
  History,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { Customer, MeterRecord, PaymentTransaction, SystemSettings } from '../../types';
import { formatRupiah, formatNumber, generateWhatsAppMessage } from '../../utils/formatters';
import { MeterRevisionModal } from '../modals/MeterRevisionModal';
import { RevisionLogModal } from '../modals/RevisionLogModal';

interface InputMeterViewProps {
  customers: Customer[];
  meterRecords: MeterRecord[];
  settings: SystemSettings;
  onSaveMeter: (id: string, meterKini: number, fotoMeter?: string) => void;
  onReviseMeter: (
    id: string,
    newMeterKini: number,
    newMeterLalu: number,
    reason: string,
    fotoMeter?: string,
    petugas?: string
  ) => void;
  onResetMeter: (id: string, reason: string) => void;
  onSelectCustomerForPayment: (customerId: string) => void;
  initialSelectedCustomerId?: string;
  transactions?: PaymentTransaction[];
}

export const InputMeterView: React.FC<InputMeterViewProps> = ({
  customers,
  meterRecords,
  settings,
  onSaveMeter,
  onReviseMeter,
  onResetMeter,
  onSelectCustomerForPayment,
  initialSelectedCustomerId,
  transactions = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unrecorded' | 'recorded' | 'revised'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialSelectedCustomerId || (customers.length > 0 ? customers[0].id : '')
  );

  // Modal states
  const [revisionRecord, setRevisionRecord] = useState<MeterRecord | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Active form state for the selected customer
  const activeCustomer = customers.find(c => c.id === selectedCustomerId);
  const activeMeterRecord = meterRecords.find(m => m.id === selectedCustomerId);

  const [inputMeterKini, setInputMeterKini] = useState<string>(
    activeMeterRecord && activeMeterRecord.isRecorded ? String(activeMeterRecord.meterKini) : ''
  );
  const [fotoMeter, setFotoMeter] = useState<string | undefined>(
    activeMeterRecord?.fotoMeter
  );
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSelectedCustomerId) {
      handleSelectCustomer(initialSelectedCustomerId);
    }
  }, [initialSelectedCustomerId]);

  // Handle switching customer
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const m = meterRecords.find(rec => rec.id === id);
    setInputMeterKini(m && m.isRecorded ? String(m.meterKini) : '');
    setFotoMeter(m?.fotoMeter);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
  };

  // Live calculations for the active input
  const meterLalu = activeCustomer ? activeCustomer.meterAwal : 0;
  const numMeterKini = inputMeterKini === '' ? meterLalu : Number(inputMeterKini);
  const pemakaian = Math.max(0, numMeterKini - meterLalu);
  const tarif = settings.tarifDefault;
  const biayaAir = pemakaian * tarif;
  const tunggakanLalu = activeCustomer ? activeCustomer.tunggakan : 0;
  const totalTagihan = biayaAir + tunggakanLalu;

  // Anomaly warning for quick form
  const isPemakaianSpike = pemakaian > 40;
  const isMeterSmaller = inputMeterKini !== '' && numMeterKini < meterLalu;

  // Handle photo upload/capture
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.65);
          setFotoMeter(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFotoMeter(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCurrentMeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    if (numMeterKini < meterLalu) {
      setSaveErrorMsg(`Meter Kini (${numMeterKini}) tidak boleh lebih kecil dari Meter Lalu (${meterLalu})!`);
      return;
    }

    if (activeMeterRecord?.isRecorded) {
      // It's a revision of an already recorded record!
      onReviseMeter(
        selectedCustomerId,
        numMeterKini,
        meterLalu,
        'Koreksi cepat dari Form Catat',
        fotoMeter,
        'Admin Air'
      );
      setSaveErrorMsg('');
      setSaveSuccessMsg(`Berhasil merevisi catatan meter untuk ${activeCustomer?.nama} (${selectedCustomerId})!`);
    } else {
      onSaveMeter(selectedCustomerId, numMeterKini, fotoMeter);
      setSaveErrorMsg('');
      setSaveSuccessMsg(`Berhasil mencatat meter untuk ${activeCustomer?.nama} (${selectedCustomerId})!`);
    }
    setTimeout(() => setSaveSuccessMsg(''), 4500);
  };

  const handleOpenRevision = (rec: MeterRecord) => {
    setRevisionRecord(rec);
    setIsRevisionModalOpen(true);
  };

  // Find next unrecorded customer
  const unrecordedList = customers.filter(c => {
    const m = meterRecords.find(rec => rec.id === c.id);
    return !m?.isRecorded;
  });

  const handleJumpToNextUnrecorded = () => {
    const next = unrecordedList.find(c => c.id !== selectedCustomerId);
    if (next) {
      handleSelectCustomer(next.id);
    }
  };

  const handleSendWA = (rec: MeterRecord) => {
    const msg = generateWhatsAppMessage({
      namaUsaha: settings.namaUsaha,
      namaPelanggan: rec.nama,
      idPelanggan: rec.id,
      periode: settings.periodeAktif,
      meterLalu: rec.meterLalu,
      meterKini: rec.meterKini,
      pemakaian: rec.pemakaian,
      tarif: settings.tarifDefault,
      biayaAir: rec.biayaAir,
      tunggakanLalu: rec.tunggakanLalu,
      totalTagihan: rec.totalTagihan,
      namaBankRek: settings.namaBankRek,
      catatan: settings.catatanStruk
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filtering records
  const totalCount = customers.length;
  const recordedCount = meterRecords.filter(m => m.isRecorded).length;
  const unrecordedCount = totalCount - recordedCount;
  const revisedCount = meterRecords.filter(m => m.isRevised).length;

  const filteredRecords = meterRecords
    .filter(m => {
      // Search filter
      const matchesSearch =
        m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nama.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Status tab filter
      if (filterMode === 'recorded') return m.isRecorded === true;
      if (filterMode === 'unrecorded') return !m.isRecorded;
      if (filterMode === 'revised') return m.isRevised === true;
      return true;
    });

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner with Revision Log button */}
      <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cyan-400" />
              <span>INPUT METER AIR</span>
            </h2>
            <span className="text-xs bg-slate-700 text-slate-300 font-mono px-2 py-0.5 rounded-full">
              Sheet #3
            </span>
            {revisedCount > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Edit3 className="w-3 h-3" />
                <span>{revisedCount} Direvisi</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Pencatatan angka meteran periode <strong>{settings.periodeAktif}</strong>. Fitur revisi & koreksi siap dipakai kapan saja jika salah input.</span>
          </p>
        </div>

        {/* Action & Status Tracker */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            title="Lihat seluruh riwayat koreksi"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Buku Log Revisi</span>
          </button>

          <div className="flex items-center gap-3 text-xs bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-700/70">
            <div>
              <span className="text-slate-400 block text-[10px]">Sudah Dicatat</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">
                {recordedCount} / {totalCount}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px]">Belum Dicatat</span>
              <span className="text-amber-400 font-bold font-mono text-sm">
                {unrecordedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Input Cepat (Kiri) & Tabel Rincian (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Kolom 1: Formulir Input Meter Cepat */}
        <div className="bg-slate-800/90 border border-cyan-800/50 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Form Catat Meter</span>
            </h3>

            {activeMeterRecord?.isRecorded ? (
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Sudah Dicatat</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Belum Dicatat
              </span>
            )}
          </div>

          {/* Banner Mode Revisi if already recorded */}
          {activeMeterRecord?.isRecorded && (
            <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Mode Koreksi / Revisi</span>
                </span>
                {activeMeterRecord.isRevised && (
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded font-mono">
                    Rev #{activeMeterRecord.revisionCount || 1}
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-[11px] leading-tight">
                Pelanggan ini sudah dicatat ({activeMeterRecord.meterKini} m³). Mengubah angka akan memperbarui catatan.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenRevision(activeMeterRecord)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <History className="w-3 h-3" />
                  <span>Dialog Revisi Lengkap</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Yakin ingin membatalkan status pencatatan untuk ${activeCustomer?.nama}?`)) {
                      onResetMeter(selectedCustomerId, 'Dibatalkan dari Form Cepat');
                    }
                  }}
                  className="text-rose-400 hover:text-rose-300 text-[10px] underline font-medium"
                >
                  Reset ke Belum Dicatat
                </button>
              </div>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
              {unrecordedList.length > 0 && (
                <button
                  type="button"
                  onClick={handleJumpToNextUnrecorded}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1"
                >
                  <span>Lanjut</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {saveErrorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {/* Anomaly warnings */}
          {isPemakaianSpike && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Pemakaian melonjak ({pemakaian} m³)!</strong> Periksa kembali angka meter kini agar tidak salah input digit.
              </span>
            </div>
          )}

          {isMeterSmaller && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Meter Kini tidak boleh lebih kecil dari Meter Lalu ({meterLalu})!</span>
            </div>
          )}

          <form onSubmit={handleSaveCurrentMeter} className="space-y-4">
            {/* Pilih Pelanggan Dropdown */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Pilih Pelanggan
                </label>
                {unrecordedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleJumpToNextUnrecorded}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                  >
                    <span>Cari yg Belum</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              >
                {customers.map((c) => {
                  const m = meterRecords.find(rec => rec.id === c.id);
                  const isDone = m?.isRecorded;
                  const isRev = m?.isRevised;
                  return (
                    <option key={c.id} value={c.id}>
                      {isDone ? (isRev ? '✏️' : '✅') : '⏳'} {c.id} - {c.nama} (Awal: {c.meterAwal} m³)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Meter Lalu (C) vs Meter Kini (D) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">Meter Lalu</span>
                <span className="font-mono text-lg font-bold text-slate-200">
                  {formatNumber(meterLalu)}
                </span>
                <span className="text-xs text-slate-400 ml-1">m³</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-cyan-300 mb-1">
                  Meter Kini *
                </label>
                <input
                  type="number"
                  step="any"
                  min={meterLalu}
                  value={inputMeterKini}
                  onChange={(e) => setInputMeterKini(e.target.value)}
                  placeholder={`Min: ${meterLalu}`}
                  className="w-full bg-slate-900 border-2 border-cyan-500/50 focus:border-cyan-400 rounded-xl px-3 py-2 text-lg font-bold text-white font-mono outline-none text-right"
                  required
                />
              </div>
            </div>

            {/* Fitur Foto Meteran */}
            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Foto Meteran (Opsional)</span>
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  Boleh dilewati
                </span>
              </div>

              {fotoMeter ? (
                <div className="relative group w-full bg-slate-950 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-between p-2">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setActivePhotoModal(fotoMeter)}
                  >
                    <img
                      src={fotoMeter}
                      alt="Foto Meter"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                    />
                    <div className="text-left">
                      <span className="text-xs font-semibold text-cyan-300 block">
                        Foto Terlampir
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Klik untuk perbesar
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
                    title="Hapus Foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                    id="camera-input-meter"
                  />
                  <label
                    htmlFor="camera-input-meter"
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-dashed border-slate-600 hover:border-cyan-400/60 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>Ambil Foto / Pilih Gambar</span>
                  </label>
                </div>
              )}
            </div>

            {/* Live Calculation Preview */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Pemakaian (m³):</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {formatNumber(pemakaian)} m³
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Tarif:</span>
                <span className="font-mono text-cyan-300 font-semibold">{formatRupiah(tarif)}/m³</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Biaya Air (Pakai x Tarif):</span>
                <span className="font-mono font-semibold text-white">{formatRupiah(biayaAir)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tunggakan Lalu:</span>
                <span className="font-mono font-semibold text-rose-400">{formatRupiah(tunggakanLalu)}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-white">Total Tagihan:</span>
                <span className="font-mono text-cyan-400 text-base">{formatRupiah(totalTagihan)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isMeterSmaller}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                activeMeterRecord?.isRecorded
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-amber-500/20'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
              }`}
            >
              {activeMeterRecord?.isRecorded ? (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>Simpan Revisi Catatan</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Catatan Meter</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Pay / WhatsApp Buttons */}
          {activeMeterRecord && (
            <div className="mt-4 pt-4 border-t border-slate-700/80 flex items-center gap-2">
              <button
                onClick={() => onSelectCustomerForPayment(selectedCustomerId)}
                className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Bayar Sekarang</span>
              </button>
              <button
                onClick={() => handleSendWA(activeMeterRecord)}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-xl transition-colors"
                title="Kirim Tagihan WhatsApp"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Kolom 2: Tabel INPUT METER dengan Filter & Aksi Revisi */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700 overflow-x-auto">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterMode === 'all'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({totalCount})
              </button>

              <button
                onClick={() => setFilterMode('unrecorded')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  filterMode === 'unrecorded'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <span>Belum Dicatat</span>
                <span className="bg-amber-400/20 px-1.5 py-0.2 rounded-full text-[10px]">
                  {unrecordedCount}
                </span>
              </button>

              <button
                onClick={() => setFilterMode('recorded')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  filterMode === 'recorded'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <span>Sudah Dicatat</span>
                <span className="bg-emerald-500/20 px-1.5 py-0.2 rounded-full text-[10px]">
                  {recordedCount}
                </span>
              </button>

              {revisedCount > 0 && (
                <button
                  onClick={() => setFilterMode('revised')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    filterMode === 'revised'
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400 shadow-sm font-bold'
                      : 'text-amber-300 hover:text-amber-200'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Direvisi</span>
                  <span className="bg-amber-500/30 px-1.5 py-0.2 rounded-full text-[10px]">
                    {revisedCount}
                  </span>
                </button>
              )}
            </div>

            {/* Pencarian */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari ID atau Nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-900/90 font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-3">Nama</th>
                    <th className="py-3 px-2 text-right">Lalu</th>
                    <th className="py-3 px-2 text-right">Kini</th>
                    <th className="py-3 px-2 text-right">Pakai</th>
                    <th className="py-3 px-2 text-right">Biaya</th>
                    <th className="py-3 px-2 text-right">Tunggakan</th>
                    <th className="py-3 px-3 text-right">Total Tagihan</th>
                    <th className="py-3 px-2 text-center">Foto</th>
                    <th className="py-3 px-2 text-center">Aksi / Revisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-medium">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                        Tidak ada data meter yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((m) => {
                      const isRecorded = m.isRecorded === true;
                      const isRevised = m.isRevised === true;
                      return (
                        <tr
                          key={m.id}
                          onClick={() => handleSelectCustomer(m.id)}
                          className={`cursor-pointer hover:bg-slate-700/40 transition-colors ${
                            m.id === selectedCustomerId ? 'bg-cyan-500/10' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1 items-start">
                              {isRecorded ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Dicatat</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                  Belum
                                </span>
                              )}
                              {isRevised && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRevision(m);
                                  }}
                                  className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded hover:bg-amber-500/30 transition-colors"
                                  title={`Direvisi ${m.revisionCount || 1}x: ${m.lastRevisionReason || ''}`}
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>Direvisi</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 font-mono font-bold text-cyan-300">
                            {m.id}
                          </td>
                          <td className="py-3 px-3 font-semibold text-white">
                            {m.nama}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-300">
                            {formatNumber(m.meterLalu)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-cyan-300">
                            {isRecorded ? formatNumber(m.meterKini) : '-'}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-emerald-400 font-semibold">
                            {isRecorded && m.pemakaian > 0 ? `${formatNumber(m.pemakaian)} m³` : isRecorded ? '0 m³' : '-'}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-200">
                            {formatRupiah(m.biayaAir)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-rose-400">
                            {formatRupiah(m.tunggakanLalu)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            {formatRupiah(m.totalTagihan)}
                          </td>
                          <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            {m.fotoMeter ? (
                              <button
                                onClick={() => setActivePhotoModal(m.fotoMeter!)}
                                className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors inline-flex items-center justify-center"
                                title="Lihat Foto Meteran"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {/* Dedicated REVISI Button */}
                              {isRecorded ? (
                                <button
                                  onClick={() => handleOpenRevision(m)}
                                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1 text-[11px] font-bold"
                                  title="Revisi / Koreksi Catatan Meter Ini"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span className="hidden sm:inline">Revisi</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSelectCustomer(m.id)}
                                  className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-colors text-[11px] font-semibold"
                                  title="Catat Meteran Sekarang"
                                >
                                  Catat
                                </button>
                              )}

                              <button
                                onClick={() => handleSendWA(m)}
                                className="p-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
                                title="Kirim WA Tagihan"
                              >
                                <Send className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onSelectCustomerForPayment(m.id)}
                                className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition-colors"
                                title="Bayar"
                              >
                                <CreditCard className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Revisi Meter */}
      <MeterRevisionModal
        isOpen={isRevisionModalOpen}
        onClose={() => {
          setIsRevisionModalOpen(false);
          setRevisionRecord(null);
        }}
        record={revisionRecord}
        customer={customers.find(c => c.id === revisionRecord?.id)}
        settings={settings}
        onSaveRevision={(id, newKini, newLalu, reason, foto, pet) => {
          onReviseMeter(id, newKini, newLalu, reason, foto, pet);
          setSaveSuccessMsg(`Berhasil merevisi catatan meter pelanggan ${id}!`);
          setTimeout(() => setSaveSuccessMsg(''), 4500);
        }}
        onResetRecord={(id, reason) => {
          onResetMeter(id, reason);
          setSaveSuccessMsg(`Pencatatan meter pelanggan ${id} telah dibatalkan (kembali ke Belum Dicatat).`);
          setTimeout(() => setSaveSuccessMsg(''), 4500);
        }}
      />

      {/* Modal Log Revisi Data */}
      <RevisionLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        meterRecords={meterRecords}
        transactions={transactions}
      />

      {/* Lightbox Modal untuk Preview Foto Meteran */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-4 relative shadow-2xl">
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Bukti Fisik Angka Meter</span>
            </h4>
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={activePhotoModal}
                alt="Bukti Meteran"
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
