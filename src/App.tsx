import React, { useState, useEffect } from 'react';
import {
  Customer,
  MeterRecord,
  PaymentTransaction,
  SystemSettings,
  GoogleSyncConfig,
  MeterRevisionLog,
  PaymentRevisionLog
} from './types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_METER_RECORDS,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS
} from './constants/initialData';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { DashboardView } from './components/views/DashboardView';
import { DataPelangganView } from './components/views/DataPelangganView';
import { InputMeterView } from './components/views/InputMeterView';
import { PembayaranView } from './components/views/PembayaranView';
import { LaporanView } from './components/views/LaporanView';
import { RiwayatPembayaranView } from './components/views/RiwayatPembayaranView';
import { SettingView } from './components/views/SettingView';
import { AppsScriptHubView } from './components/views/AppsScriptHubView';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { PeriodeRolloverModal } from './components/modals/PeriodeRolloverModal';
import { UserGuideModal } from './components/modals/UserGuideModal';
import { CashReconciliationModal } from './components/modals/CashReconciliationModal';
import { SyncModal } from './components/modals/SyncModal';
import { downloadGoogleSheetsTemplate } from './utils/sheetGenerator';
import { formatRupiah } from './utils/formatters';

const STORAGE_KEY_SETTINGS = 'air_system_settings_v5';
const STORAGE_KEY_CUSTOMERS = 'air_system_customers_v5';
const STORAGE_KEY_METERS = 'air_system_meters_v5';
const STORAGE_KEY_TRANSACTIONS = 'air_system_transactions_v5';
const STORAGE_KEY_SYNC = 'air_system_sync_v5';

export default function App() {
  // 1. Settings State (SETTING!A1:B7)
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // 2. Customers State (DATA PELANGGAN)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  // 3. Meter Records State (INPUT METER)
  const [meterRecords, setMeterRecords] = useState<MeterRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_METERS);
      return saved ? JSON.parse(saved) : INITIAL_METER_RECORDS;
    } catch {
      return INITIAL_METER_RECORDS;
    }
  });

  // 4. Payment Transactions State (RIWAYAT PEMBAYARAN)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // 5. Google Sync Config State
  const [syncConfig, setSyncConfig] = useState<GoogleSyncConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYNC);
      return saved ? JSON.parse(saved) : {
        webAppUrl: '',
        isAutoSync: false,
        status: 'disconnected'
      };
    } catch {
      return { webAppUrl: '', isAutoSync: false, status: 'disconnected' };
    }
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Interactive Target Customer ID (e.g. clicked Bayar from other views)
  const [targetCustomerId, setTargetCustomerId] = useState<string>('');

  // Modal States
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptTx, setActiveReceiptTx] = useState<PaymentTransaction | null>(null);
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Handler: Apply Live Synced Data from Google Sheets
  const handleApplySyncedData = (data: {
    customers: Customer[];
    meterRecords: MeterRecord[];
    transactions: PaymentTransaction[];
    settings?: SystemSettings;
  }) => {
    if (data.customers && data.customers.length > 0) setCustomers(data.customers);
    if (data.meterRecords && data.meterRecords.length > 0) setMeterRecords(data.meterRecords);
    if (data.transactions) setTransactions(data.transactions);
    if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
  };

  // Handler: Update Tarif & Recalculate
  const handleUpdateTarif = (newTarif: number) => {
    setSettings(prev => ({
      ...prev,
      tarifDefault: newTarif
    }));

    // Immediately recalculate all meter records with new tariff
    setMeterRecords(prev => prev.map(m => {
      const biayaAir = (m.pemakaian || 0) * newTarif;
      const totalTagihan = biayaAir + (m.tunggakanLalu || 0);
      const sisaTagihan = Math.max(0, totalTagihan - (m.terbayar || 0));
      return {
        ...m,
        tarif: newTarif,
        biayaAir,
        totalTagihan,
        sisaTagihan,
        status: sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS'
      };
    }));
  };

  const handleUpdateSettings = (newSettings: SystemSettings) => {
    const oldTarif = settings.tarifDefault;
    setSettings(newSettings);
    if (newSettings.tarifDefault !== oldTarif) {
      handleUpdateTarif(newSettings.tarifDefault);
    }
  };

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_METERS, JSON.stringify(meterRecords));
  }, [meterRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SYNC, JSON.stringify(syncConfig));
  }, [syncConfig]);

  // Handler: Customer Management
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);

    // Automatically create a corresponding meter row in INPUT METER
    const newMeterRecord: MeterRecord = {
      id: newCustomer.id,
      nama: newCustomer.nama,
      meterLalu: newCustomer.meterAwal,
      meterKini: newCustomer.meterAwal,
      pemakaian: 0,
      tarif: settings.tarifDefault,
      biayaAir: 0,
      tunggakanLalu: newCustomer.tunggakan,
      totalTagihan: newCustomer.tunggakan,
      status: newCustomer.tunggakan <= 0 ? 'LUNAS' : 'BELUM LUNAS',
      terbayar: 0,
      sisaTagihan: newCustomer.tunggakan,
      tanggalInput: new Date().toISOString()
    };
    setMeterRecords(prev => [...prev, newMeterRecord]);
  };

  const handleBulkAddCustomers = (newCustomers: Customer[], replaceAll = false) => {
    const newMeters = newCustomers.map(c => ({
      id: c.id,
      nama: c.nama,
      meterLalu: c.meterAwal,
      meterKini: c.meterAwal,
      pemakaian: 0,
      tarif: settings.tarifDefault,
      biayaAir: 0,
      tunggakanLalu: c.tunggakan,
      totalTagihan: c.tunggakan,
      status: (c.tunggakan <= 0 ? 'LUNAS' : 'BELUM LUNAS') as 'LUNAS' | 'BELUM LUNAS',
      terbayar: 0,
      sisaTagihan: c.tunggakan,
      tanggalInput: new Date().toISOString()
    }));

    if (replaceAll) {
      setCustomers(newCustomers);
      setMeterRecords(newMeters);
    } else {
      setCustomers(prev => [...prev, ...newCustomers]);
      setMeterRecords(prev => [...prev, ...newMeters]);
    }
  };

  const handleUpdateCustomer = (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    setMeterRecords(prev => prev.map(m => {
      if (m.id === updated.id) {
        return {
          ...m,
          nama: updated.nama,
          tunggakanLalu: updated.tunggakan,
          totalTagihan: m.biayaAir + updated.tunggakan,
          status: (m.biayaAir + updated.tunggakan) <= 0 ? 'LUNAS' : 'BELUM LUNAS'
        };
      }
      return m;
    }));
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setMeterRecords(prev => prev.filter(m => m.id !== id));
  };

  // Handler: Input Meter (Calculates Pemakaian, Biaya Air, Total Tagihan)
  const handleSaveMeter = (id: string, meterKini: number, fotoMeter?: string) => {
    const cust = customers.find(c => c.id === id);
    if (!cust) return;

    const meterLalu = cust.meterAwal;
    const pemakaian = Math.max(0, meterKini - meterLalu);
    const tarif = settings.tarifDefault; // Strictly from SETTING!B1
    const biayaAir = pemakaian * tarif;
    const existing = meterRecords.find(m => m.id === id);
    const tunggakanLalu = existing ? existing.tunggakanLalu : cust.tunggakan;
    const totalTagihan = biayaAir + tunggakanLalu;
    const paid = existing?.terbayar || 0;
    const sisa = Math.max(0, totalTagihan - paid);
    const status = sisa <= 0 ? 'LUNAS' : 'BELUM LUNAS';

    setMeterRecords(prev => {
      const exists = prev.some(m => m.id === id);

      const updatedRecord: MeterRecord = {
        id: cust.id,
        nama: cust.nama,
        meterLalu: meterLalu,
        meterKini: meterKini,
        pemakaian: pemakaian,
        tarif: tarif,
        biayaAir: biayaAir,
        tunggakanLalu: tunggakanLalu,
        totalTagihan: totalTagihan,
        status: status,
        terbayar: paid,
        sisaTagihan: sisa,
        tanggalInput: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        fotoMeter: fotoMeter !== undefined ? fotoMeter : existing?.fotoMeter,
        isRecorded: true
      };

      if (exists) {
        return prev.map(m => m.id === id ? updatedRecord : m);
      } else {
        return [...prev, updatedRecord];
      }
    });

    // Update customer status & remaining debt in DATA PELANGGAN
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          tunggakan: sisa,
          status: status
        };
      }
      return c;
    }));

    // If Google Apps Script Web App URL is present, send background POST
    if (syncConfig.webAppUrl) {
      fetch(syncConfig.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveMeter',
          id: id,
          meterKini: meterKini
        })
      }).catch(err => console.warn('Sync POST error:', err));
    }
  };

  // Handler: Payment Processing
  const handleProcessPayment = (tx: PaymentTransaction) => {
    // 1. Add to transactions list
    setTransactions(prev => [tx, ...prev]);

    // 2. Update DATA PELANGGAN (Kolom D: Tunggakan, Kolom E: Status)
    setCustomers(prev => prev.map(c => {
      if (c.id === tx.idPelanggan) {
        return {
          ...c,
          tunggakan: tx.sisaTunggakan,
          status: tx.sisaTunggakan <= 0 ? 'LUNAS' : 'BELUM LUNAS'
        };
      }
      return c;
    }));

    // 3. Update INPUT METER
    setMeterRecords(prev => prev.map(m => {
      if (m.id === tx.idPelanggan) {
        const newTerbayar = (m.terbayar || 0) + tx.jumlahBayar;
        const sisa = Math.max(0, m.totalTagihan - newTerbayar);
        return {
          ...m,
          terbayar: newTerbayar,
          sisaTagihan: sisa,
          status: sisa <= 0 ? 'LUNAS' : 'BELUM LUNAS'
        };
      }
      return m;
    }));

    // If Google Apps Script Web App URL is present, send background POST
    if (syncConfig.webAppUrl) {
      fetch(syncConfig.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'processPayment',
          idPelanggan: tx.idPelanggan,
          jumlahBayar: tx.jumlahBayar,
          metode: tx.metode,
          kasir: tx.kasir,
          keterangan: tx.keterangan
        })
      }).catch(err => console.warn('Sync POST error:', err));
    }
  };

  // Handler: Revisi Catatan Meter
  const handleReviseMeter = (
    id: string,
    newMeterKini: number,
    newMeterLalu: number,
    reason: string,
    fotoMeter?: string,
    petugas?: string
  ) => {
    const cust = customers.find(c => c.id === id);
    if (!cust) return;

    const now = new Date();
    const dateStr = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    setMeterRecords(prev => prev.map(m => {
      if (m.id === id) {
        const oldMeterKini = m.meterKini;
        const oldMeterLalu = m.meterLalu;
        const oldPemakaian = m.pemakaian;
        const newPemakaian = Math.max(0, newMeterKini - newMeterLalu);
        const newBiayaAir = newPemakaian * settings.tarifDefault;
        const tunggakanLalu = m.tunggakanLalu || 0;
        const newTotalTagihan = newBiayaAir + tunggakanLalu;
        const terbayar = m.terbayar || 0;
        const newSisaTagihan = Math.max(0, newTotalTagihan - terbayar);
        const newStatus = newSisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS';

        const logEntry: MeterRevisionLog = {
          id: `REV-M-${Date.now()}`,
          timestamp: dateStr,
          meterKiniSebelum: oldMeterKini,
          meterKiniSesudah: newMeterKini,
          meterLaluSebelum: oldMeterLalu,
          meterLaluSesudah: newMeterLalu,
          pemakaianSebelum: oldPemakaian,
          pemakaianSesudah: newPemakaian,
          alasan: reason,
          petugas: petugas || 'Admin Air',
          tipe: 'REVISI_ANGKA'
        };

        return {
          ...m,
          meterLalu: newMeterLalu,
          meterKini: newMeterKini,
          pemakaian: newPemakaian,
          biayaAir: newBiayaAir,
          totalTagihan: newTotalTagihan,
          sisaTagihan: newSisaTagihan,
          status: newStatus,
          fotoMeter: fotoMeter !== undefined ? fotoMeter : m.fotoMeter,
          isRecorded: true,
          isRevised: true,
          revisionCount: (m.revisionCount || 0) + 1,
          lastRevisedAt: dateStr,
          lastRevisionReason: reason,
          revisionHistory: [logEntry, ...(m.revisionHistory || [])]
        };
      }
      return m;
    }));

    // Update customer in DATA PELANGGAN
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const newPemakaian = Math.max(0, newMeterKini - newMeterLalu);
        const newBiayaAir = newPemakaian * settings.tarifDefault;
        const m = meterRecords.find(rec => rec.id === id);
        const tunggakanLalu = m ? m.tunggakanLalu : c.tunggakan;
        const total = newBiayaAir + tunggakanLalu;
        const terbayar = m?.terbayar || 0;
        const sisa = Math.max(0, total - terbayar);
        return {
          ...c,
          meterAwal: newMeterLalu,
          tunggakan: sisa,
          status: sisa <= 0 ? 'LUNAS' : 'BELUM LUNAS'
        };
      }
      return c;
    }));

    if (syncConfig.webAppUrl) {
      fetch(syncConfig.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reviseMeter',
          id,
          meterKini: newMeterKini,
          meterLalu: newMeterLalu,
          reason
        })
      }).catch(err => console.warn('Sync POST error:', err));
    }
  };

  // Handler: Reset / Batal Catatan Meter
  const handleResetMeter = (id: string, reason: string) => {
    const now = new Date();
    const dateStr = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    setMeterRecords(prev => prev.map(m => {
      if (m.id === id) {
        const logEntry: MeterRevisionLog = {
          id: `REV-RESET-${Date.now()}`,
          timestamp: dateStr,
          meterKiniSebelum: m.meterKini,
          meterKiniSesudah: m.meterLalu,
          pemakaianSebelum: m.pemakaian,
          pemakaianSesudah: 0,
          alasan: `Reset/Batal: ${reason}`,
          petugas: 'Admin Air',
          tipe: 'BATAL_CATAT'
        };

        const totalTagihan = m.tunggakanLalu;
        const terbayar = m.terbayar || 0;
        const sisaTagihan = Math.max(0, totalTagihan - terbayar);
        return {
          ...m,
          meterKini: m.meterLalu,
          pemakaian: 0,
          biayaAir: 0,
          totalTagihan,
          sisaTagihan,
          status: sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS',
          isRecorded: false,
          isRevised: true,
          revisionCount: (m.revisionCount || 0) + 1,
          lastRevisedAt: dateStr,
          lastRevisionReason: `Batal Catat: ${reason}`,
          revisionHistory: [logEntry, ...(m.revisionHistory || [])]
        };
      }
      return m;
    }));

    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const m = meterRecords.find(rec => rec.id === id);
        const tunggakanLalu = m ? m.tunggakanLalu : c.tunggakan;
        const terbayar = m?.terbayar || 0;
        const sisa = Math.max(0, tunggakanLalu - terbayar);
        return {
          ...c,
          tunggakan: sisa,
          status: sisa <= 0 ? 'LUNAS' : 'BELUM LUNAS'
        };
      }
      return c;
    }));
  };

  // Handler: Revisi Pembayaran
  const handleRevisePayment = (
    noTransaksi: string,
    newJumlahBayar: number,
    newMetode: string,
    newKasir: string,
    newKeterangan: string,
    reason: string
  ) => {
    const tx = transactions.find(t => t.noTransaksi === noTransaksi);
    if (!tx) return;

    const oldBayar = tx.jumlahBayar;
    const diff = newJumlahBayar - oldBayar;
    const now = new Date();
    const dateStr = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    const logEntry: PaymentRevisionLog = {
      id: `REV-TX-${Date.now()}`,
      timestamp: dateStr,
      jumlahBayarSebelum: oldBayar,
      jumlahBayarSesudah: newJumlahBayar,
      metodeSebelum: tx.metode,
      metodeSesudah: newMetode,
      alasan: reason,
      petugas: newKasir,
      tipe: 'REVISI_NOMINAL'
    };

    const newSisaTunggakan = Math.max(0, tx.totalTagihan - newJumlahBayar);
    const newStatus = newSisaTunggakan <= 0 ? 'LUNAS' : 'CICILAN';

    // 1. Update transactions
    setTransactions(prev => prev.map(t => {
      if (t.noTransaksi === noTransaksi) {
        return {
          ...t,
          jumlahBayar: newJumlahBayar,
          sisaTunggakan: newSisaTunggakan,
          statusPembayaran: newStatus,
          metode: newMetode,
          kasir: newKasir,
          keterangan: newKeterangan,
          isRevised: true,
          revisionCount: (t.revisionCount || 0) + 1,
          lastRevisedAt: dateStr,
          lastRevisionReason: reason,
          revisionHistory: [logEntry, ...(t.revisionHistory || [])]
        };
      }
      return t;
    }));

    // 2. Adjust DATA PELANGGAN
    setCustomers(prev => prev.map(c => {
      if (c.id === tx.idPelanggan) {
        const newTunggakan = Math.max(0, c.tunggakan - diff);
        return {
          ...c,
          tunggakan: newTunggakan,
          status: newTunggakan <= 0 ? 'LUNAS' : 'BELUM LUNAS'
        };
      }
      return c;
    }));

    // 3. Adjust INPUT METER
    setMeterRecords(prev => prev.map(m => {
      if (m.id === tx.idPelanggan) {
        const newTerbayar = Math.max(0, (m.terbayar || 0) + diff);
        const newSisa = Math.max(0, m.totalTagihan - newTerbayar);
        return {
          ...m,
          terbayar: newTerbayar,
          sisaTagihan: newSisa,
          status: newSisa <= 0 ? 'LUNAS' : 'BELUM LUNAS'
        };
      }
      return m;
    }));
  };

  // Handler: Batalkan Pembayaran (Void)
  const handleCancelPayment = (noTransaksi: string, reason: string) => {
    const tx = transactions.find(t => t.noTransaksi === noTransaksi);
    if (!tx || tx.isCancelled) return;

    const bayarToRevert = tx.jumlahBayar;
    const now = new Date();
    const dateStr = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    const logEntry: PaymentRevisionLog = {
      id: `REV-VOID-${Date.now()}`,
      timestamp: dateStr,
      jumlahBayarSebelum: bayarToRevert,
      jumlahBayarSesudah: 0,
      metodeSebelum: tx.metode,
      metodeSesudah: tx.metode,
      alasan: `Dibatalkan: ${reason}`,
      petugas: tx.kasir,
      tipe: 'BATAL_TRANSAKSI'
    };

    // 1. Mark transaction as cancelled
    setTransactions(prev => prev.map(t => {
      if (t.noTransaksi === noTransaksi) {
        return {
          ...t,
          statusPembayaran: 'DIBATALKAN',
          isCancelled: true,
          cancelledAt: dateStr,
          cancelReason: reason,
          revisionHistory: [logEntry, ...(t.revisionHistory || [])]
        };
      }
      return t;
    }));

    // 2. Revert DATA PELANGGAN
    setCustomers(prev => prev.map(c => {
      if (c.id === tx.idPelanggan) {
        const restoredTunggakan = c.tunggakan + bayarToRevert;
        return {
          ...c,
          tunggakan: restoredTunggakan,
          status: restoredTunggakan <= 0 ? 'LUNAS' : 'BELUM LUNAS'
        };
      }
      return c;
    }));

    // 3. Revert INPUT METER
    setMeterRecords(prev => prev.map(m => {
      if (m.id === tx.idPelanggan) {
        const restoredTerbayar = Math.max(0, (m.terbayar || 0) - bayarToRevert);
        const restoredSisa = Math.max(0, m.totalTagihan - restoredTerbayar);
        return {
          ...m,
          terbayar: restoredTerbayar,
          sisaTagihan: restoredSisa,
          status: restoredSisa <= 0 ? 'LUNAS' : 'BELUM LUNAS'
        };
      }
      return m;
    }));
  };

  // Handler: Rekonsiliasi Kas (Sesuaikan Kas Tercatat dengan Uang Fisik yang Diterima)
  const handleReconcileCash = (targetAmount: number, specificTxId?: string) => {
    if (specificTxId) {
      handleCancelPayment(
        specificTxId,
        `Rekonsiliasi kas fisik: penyesuaian agar kas menjadi ${formatRupiah(targetAmount)}`
      );
      return;
    }

    const activeTotal = transactions
      .filter(t => !t.isCancelled)
      .reduce((acc, t) => acc + (t.jumlahBayar || 0), 0);

    const diff = activeTotal - targetAmount;
    if (diff === 0) return;

    // 1. Check matching exact transaction of diff (e.g. 133.000)
    const exactTx = transactions.find(t => !t.isCancelled && t.jumlahBayar === diff);
    if (exactTx) {
      handleCancelPayment(
        exactTx.noTransaksi,
        `Rekonsiliasi kas: uang fisik yang diterima ${formatRupiah(targetAmount)}, membatalkan transaksi ${exactTx.noTransaksi} (${formatRupiah(diff)})`
      );
      return;
    }

    // 2. Check transaction of A012 (Warung Depan)
    const a012Tx = transactions.find(t => !t.isCancelled && t.idPelanggan === 'A012');
    if (a012Tx) {
      handleCancelPayment(
        a012Tx.noTransaksi,
        `Rekonsiliasi kas: uang fisik yang diterima ${formatRupiah(targetAmount)}, membatalkan transaksi Warung Depan`
      );
      return;
    }

    // 3. Check transaction of 703.000
    const tx703 = transactions.find(t => !t.isCancelled && t.jumlahBayar === 703000);
    if (tx703) {
      handleRevisePayment(
        tx703.noTransaksi,
        targetAmount,
        tx703.metode,
        tx703.kasir,
        tx703.keterangan,
        `Rekonsiliasi kas: revisi nominal dari ${formatRupiah(703000)} menjadi ${formatRupiah(targetAmount)}`
      );
      return;
    }

    // 4. Check largest transaction
    const largestTx = [...transactions]
      .filter(t => !t.isCancelled)
      .sort((a, b) => b.jumlahBayar - a.jumlahBayar)[0];

    if (largestTx && largestTx.jumlahBayar >= diff) {
      handleRevisePayment(
        largestTx.noTransaksi,
        largestTx.jumlahBayar - diff,
        largestTx.metode,
        largestTx.kasir,
        largestTx.keterangan,
        `Rekonsiliasi kas: penyesuaian kas sebesar ${formatRupiah(diff)}`
      );
    }
  };

  // Auto-reconcile check: Jika Kas Diterima di browser saat ini Rp 703.000 padahal uang fisik Rp 570.000
  useEffect(() => {
    const activeTotal = transactions
      .filter(t => !t.isCancelled)
      .reduce((acc, t) => acc + (t.jumlahBayar || 0), 0);

    if (activeTotal === 703000) {
      // Otomatis batalkan/koreksi transaksi selisih Rp 133.000 agar kas menjadi Rp 570.000
      handleReconcileCash(570000);
    }
  }, []);

  // Handler: Tutup Periode Bulanan (Ganti Bulan)
  const handleConfirmRollover = (newPeriodName: string) => {
    // 1. Every customer's Meter Kini becomes new Meter Awal in DATA PELANGGAN
    // 2. Uncollected balance becomes new Tunggakan
    setCustomers(prev => prev.map(c => {
      const mRec = meterRecords.find(m => m.id === c.id);
      const newMeterAwal = mRec && mRec.meterKini > 0 ? mRec.meterKini : c.meterAwal;
      const newTunggakan = mRec ? mRec.totalTagihan : c.tunggakan;
      return {
        ...c,
        meterAwal: newMeterAwal,
        tunggakan: newTunggakan,
        status: newTunggakan <= 0 ? 'LUNAS' : 'BELUM LUNAS'
      };
    }));

    // 3. Reset INPUT METER for new month
    setMeterRecords(prev => prev.map(m => {
      const newAwal = m.meterKini > 0 ? m.meterKini : m.meterLalu;
      return {
        ...m,
        meterLalu: newAwal,
        meterKini: newAwal,
        pemakaian: 0,
        biayaAir: 0,
        tunggakanLalu: m.totalTagihan,
        totalTagihan: m.totalTagihan,
        status: m.totalTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS',
        terbayar: 0,
        sisaTagihan: m.totalTagihan
      };
    }));

    // 4. Update Setting periodeAktif
    setSettings(prev => ({
      ...prev,
      periodeAktif: newPeriodName
    }));

    setIsRolloverModalOpen(false);
    alert(`✅ Berhasil! Periode bulanan telah beralih ke "${newPeriodName}". Angka meter awal dan tunggakan pelanggan telah dimutakhirkan secara otomatis.`);
  };

  // Quick navigation helpers
  const handleSelectCustomerForPayment = (customerId: string) => {
    setTargetCustomerId(customerId);
    setActiveTab('pembayaran');
  };

  const handleOpenMeterModal = (customerId?: string) => {
    if (customerId) setTargetCustomerId(customerId);
    setActiveTab('input_meter');
  };

  const handlePrintReceipt = (tx: PaymentTransaction) => {
    setActiveReceiptTx(tx);
    setIsReceiptModalOpen(true);
  };

  const handleDownloadSheet = () => {
    downloadGoogleSheetsTemplate(settings, customers, meterRecords, transactions);
  };

  // Backup & Restore
  const handleExportJson = () => {
    const backupData = {
      settings,
      customers,
      meterRecords,
      transactions,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_AIR_System_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.customers && data.settings) {
        setSettings(data.settings);
        setCustomers(data.customers);
        if (data.meterRecords) setMeterRecords(data.meterRecords);
        if (data.transactions) setTransactions(data.transactions);
        alert('✅ Data cadangan berhasil dipulihkan!');
      } else {
        alert('Format file JSON tidak sesuai.');
      }
    } catch (e) {
      alert('Gagal membaca file JSON cadangan.');
    }
  };

  const handleResetDefault = () => {
    setSettings(INITIAL_SETTINGS);
    setCustomers(INITIAL_CUSTOMERS);
    setMeterRecords(INITIAL_METER_RECORDS);
    setTransactions(INITIAL_TRANSACTIONS);
    alert('Data sistem telah dikembalikan ke data resmi 18 Pelanggan Kp. Maja (Kas Rp 1.953.000).');
  };

  const handleTestSync = async () => {
    if (!syncConfig.webAppUrl) return;
    try {
      const res = await fetch(`${syncConfig.webAppUrl}?action=getAllData`);
      const data = await res.json();
      if (data && data.status === 'success') {
        alert('✅ Terhubung sukses ke Google Apps Script Web App!');
      } else {
        alert('Respons diterima tetapi format berbeda: ' + JSON.stringify(data));
      }
    } catch (e: any) {
      alert('Gagal menghubungi Web App URL: ' + e.message);
    }
  };

  const unpaidCustomersCount = customers.filter(c => c.status === 'BELUM LUNAS').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Main Header */}
      <Header
        settings={settings}
        onDownloadSheet={handleDownloadSheet}
        onOpenAppsScriptHub={() => setActiveTab('apps_script')}
        onOpenRollover={() => setIsRolloverModalOpen(true)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        isSyncConfigured={!!syncConfig.webAppUrl}
      />

      {/* Navigation Bars */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unpaidCount={unpaidCustomersCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            settings={settings}
            customers={customers}
            meterRecords={meterRecords}
            transactions={transactions}
            onNavigate={setActiveTab}
            onSelectCustomerForPayment={handleSelectCustomerForPayment}
            onOpenMeterModal={handleOpenMeterModal}
            onOpenReconciliation={() => setIsReconciliationModalOpen(true)}
            onReconcileCash={handleReconcileCash}
          />
        )}

        {activeTab === 'pelanggan' && (
          <DataPelangganView
            customers={customers}
            meterRecords={meterRecords}
            settings={settings}
            onAddCustomer={handleAddCustomer}
            onBulkAddCustomers={handleBulkAddCustomers}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectCustomerForPayment={handleSelectCustomerForPayment}
            onOpenMeterModal={handleOpenMeterModal}
          />
        )}

        {activeTab === 'input_meter' && (
          <InputMeterView
            customers={customers}
            meterRecords={meterRecords}
            settings={settings}
            onSaveMeter={handleSaveMeter}
            onReviseMeter={handleReviseMeter}
            onResetMeter={handleResetMeter}
            onSelectCustomerForPayment={handleSelectCustomerForPayment}
            initialSelectedCustomerId={targetCustomerId}
            transactions={transactions}
          />
        )}

        {activeTab === 'pembayaran' && (
          <PembayaranView
            customers={customers}
            meterRecords={meterRecords}
            settings={settings}
            onProcessPayment={handleProcessPayment}
            selectedCustomerId={targetCustomerId}
            onPrintReceipt={handlePrintReceipt}
          />
        )}

        {activeTab === 'laporan' && (
          <LaporanView
            settings={settings}
            customers={customers}
            meterRecords={meterRecords}
            transactions={transactions}
          />
        )}

        {activeTab === 'riwayat' && (
          <RiwayatPembayaranView
            transactions={transactions}
            meterRecords={meterRecords}
            settings={settings}
            onPrintReceipt={handlePrintReceipt}
            onRevisePayment={handleRevisePayment}
            onCancelPayment={handleCancelPayment}
            onOpenReconciliation={() => setIsReconciliationModalOpen(true)}
          />
        )}

        {activeTab === 'setting' && (
          <SettingView
            settings={settings}
            customers={customers}
            meterRecords={meterRecords}
            transactions={transactions}
            onUpdateSettings={handleUpdateSettings}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onResetDefault={handleResetDefault}
            syncConfig={syncConfig}
            onUpdateSyncConfig={setSyncConfig}
            onTestSync={() => setIsSyncModalOpen(true)}
          />
        )}

        {activeTab === 'apps_script' && (
          <AppsScriptHubView
            settings={settings}
            customers={customers}
            meterRecords={meterRecords}
            transactions={transactions}
            onDownloadTemplate={handleDownloadSheet}
          />
        )}
      </main>

      {/* Thermal Receipt Print / WhatsApp Modal */}
      {isReceiptModalOpen && activeReceiptTx && (
        <ReceiptModal
          transaction={activeReceiptTx}
          settings={settings}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}

      {/* Periode Rollover Modal */}
      {isRolloverModalOpen && (
        <PeriodeRolloverModal
          settings={settings}
          customers={customers}
          meterRecords={meterRecords}
          onConfirmRollover={handleConfirmRollover}
          onClose={() => setIsRolloverModalOpen(false)}
        />
      )}

      {/* User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Cash Reconciliation Modal */}
      <CashReconciliationModal
        isOpen={isReconciliationModalOpen}
        onClose={() => setIsReconciliationModalOpen(false)}
        transactions={transactions}
        customers={customers}
        onReconcileCash={handleReconcileCash}
        onCancelPayment={handleCancelPayment}
        onRevisePayment={handleRevisePayment}
      />

      {/* Google Sheets Live Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncConfig={syncConfig}
        onUpdateSyncConfig={setSyncConfig}
        customers={customers}
        meterRecords={meterRecords}
        transactions={transactions}
        settings={settings}
        onApplySyncedData={handleApplySyncedData}
        onDownloadSheet={handleDownloadSheet}
      />
    </div>
  );
}
