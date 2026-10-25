# Sistem Administrasi Distribusi Air - Kp. Maja

Sistem manajemen pencatatan meteran air, tagihan bulanan, pencatatan kas masuk/keluar, dan kwitansi pembayaran distribusi air warga berbasis web terintegrasi dengan **Google Sheets & Google Apps Script**.

Dibuat khusus dan telah tervalidasi dengan data riil **18 Pelanggan Kp. Maja**, tarif dasar **Rp 19.000 / m³**, dan status pembukuan kas riil (**Rp 570.000** diterima).

---

## 🚀 Fitur Utama

1. **Dashboard & Ringkasan Keuangan**
   - Total Pelanggan: **18 Pelanggan Aktif** (A001 - A018).
   - Kas Riil Diterima: **Rp 570.000** (3 transaksi pembayaran lunas: A005, A007, A008).
   - Total Tunggakan Awal Terdata: **Rp 4.328.000**.
   - Sisa Tunggakan Berjalan: **Rp 3.758.000**.
   - Tarif Air: **Rp 19.000 / m³**.

2. **Pencatatan Meteran (Input Angka Meter)**
   - Input angka meter baru, kalkulasi otomatis pemakaian kubikasi ($m^3$).
   - Perhitungan tagihan pemakaian + tunggakan bulan sebelumnya.
   - Deteksi otomatis anomali (angka meter mundur / selisih mencurigakan).

3. **Pembayaran & Kwitansi Otomatis**
   - Catat pembayaran tunai atau transfer rekening.
   - Cetak struk/kwitansi termal (58mm/80mm) dan unduh PDF kwitansi resmi.
   - Fitur **Kirim Struk via WhatsApp** otomatis dengan format pesan yang rapi.

4. **Integrasi Google Sheets (7 Tab Otomatis)**
   - Terintegrasi penuh dengan 7 tab Google Sheets:
     `PELANGGAN`, `METER`, `TAGIHAN`, `PEMBAYARAN`, `KAS_OPERASIONAL`, `LOG_AKTIVITAS`, `SETTING`.
   - Kode generator Google Apps Script (`Setup.gs`, `Code.gs`, `Api.gs`) sudah siap pakai di tab **Apps Script Hub**.

5. **Aman untuk Remix & Ekspor GitHub**
   - Kode inisial (`initialData.ts`) sudah menggunakan data resmi Kp. Maja.
   - Aplikasi dapat di-**Remix** di Google AI Studio tanpa kehilangan data atau kembali ke data dummy.
   - Siap diekspor ke repositori GitHub kapan saja.

---

## Data Pelanggan Terdaftar (18 Pelanggan Resmi)

| ID | Nama Pelanggan | Status Meter Awal | Tunggakan Awal | Status Bayar |
| :--- | :--- | :--- | :--- | :--- |
| A001 | Teh Sunah | 0 m³ | Rp 518.000 | Belum Lunas |
| A002 | Teh Lilis | 0 m³ | Rp 467.000 | Belum Lunas |
| A003 | Mas Dono | 0 m³ | Rp 201.000 | Belum Lunas |
| A004 | Teh Asnah | 0 m³ | Rp 473.000 | Belum Lunas |
| A005 | Teh Damrah | 0 m³ | Rp 190.000 | LUNAS (Rp 190.000) |
| A006 | Mas Eko | 0 m³ | Rp 175.000 | Belum Lunas |
| A007 | Teh Rum | 0 m³ | Rp 190.000 | LUNAS (Rp 190.000) |
| A008 | Teh Asih | 0 m³ | Rp 190.000 | LUNAS (Rp 190.000) |
| A009 | Bp. Deden / Teh Lina | 0 m³ | Rp 177.000 | Belum Lunas |
| A010 | Teh Halimah | 0 m³ | Rp 133.000 | Belum Lunas |
| A011 | Mang Jana | 0 m³ | Rp 190.000 | Belum Lunas |
| A012 | Mang Kardi | 0 m³ | Rp 190.000 | Belum Lunas |
| A013 | Bi Oom | 0 m³ | Rp 190.000 | Belum Lunas |
| A014 | Bp. Dedi | 0 m³ | Rp 190.000 | Belum Lunas |
| A015 | Bi Ade | 0 m³ | Rp 190.000 | Belum Lunas |
| A016 | Mas Aris | 0 m³ | Rp 190.000 | Belum Lunas |
| A017 | Bp. Wawan | 0 m³ | Rp 284.000 | Belum Lunas |
| A018 | Mang Mamat | 0 m³ | Rp 190.000 | Belum Lunas |

Total Kas Diterima Masuk: Rp 190.000 (A005) + Rp 190.000 (A007) + Rp 190.000 (A008) = Rp 570.000.

---

## 🛠️ Cara Menjalankan Proyek Secara Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru.
- npm atau yarn / pnpm.

### Instalasi & Menjalankan Dev Server
```bash
# Clone repositori dari GitHub
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME

# Install seluruh dependensi
npm install

# Jalankan server pengembangan lokal (Port 3000)
npm run dev
```

Buka browser Anda di `http://localhost:3000`.

### Build untuk Produksi
```bash
npm run build
```
Folder hasil build akan berada di `dist/`, siap di-deploy ke Vercel, Netlify, Cloudflare Pages, atau hosting static lainnya.

---

## 📤 Cara Ekspor ke GitHub dari AI Studio

Jika Anda ingin menyimpan proyek ini ke GitHub dari Google AI Studio:

### Metode 1: Menggunakan Tombol Bawaan AI Studio
1. Pada antarmuka Google AI Studio, klik menu titik tiga (`...`) atau ikon GitHub / Ekspor di sudut kanan atas panel preview/workspace.
2. Pilih **Export to GitHub** atau **Create Repository**.
3. Beri nama repositori (contoh: `distribusi-air-kp-maja`) dan pilih apakah Public atau Private.
4. Klik **Confirm / Push**. Seluruh file proyek termasuk data asli Kp. Maja akan tersimpan di repositori GitHub Anda.

### Metode 2: Download ZIP & Push Manual via Git Terminal
1. Unduh kode aplikasi sebagai file ZIP dari AI Studio.
2. Ekstrak file ZIP di komputer Anda.
3. Buka terminal di folder hasil ekstrak, lalu jalankan:
```bash
git init
git add .
git commit -m "feat: inisialisasi sistem distribusi air kp maja dengan data resmi"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA_REPO_ANDA.git
git push -u origin main
```

---

## 🔄 Cara Remix Aplikasi di Google AI Studio

Aplikasi ini sudah diprogram agar **100% aman untuk di-Remix**:
1. Klik tombol **Remix** di sudut kanan atas Google AI Studio.
2. AI Studio akan membuat salinan workspace baru.
3. Karena `INITIAL_CUSTOMERS`, `INITIAL_SETTINGS`, dan `INITIAL_TRANSACTIONS` sudah mengunci data 18 pelanggan dan kas Rp 570.000, aplikasi hasil remix akan langsung menampilkan data yang tepat tanpa perlu impor manual ataupun khawatir data kembali ke contoh lama.

---

## 📊 Menghubungkan Google Sheets & Google Apps Script

1. Buat Google Spreadsheet baru di akun Google Drive Anda.
2. Buka menu **Ekstensi** > **Apps Script**.
3. Buka tab **Apps Script Hub** di dalam aplikasi ini, lalu:
   - Salin skrip dari tab **Setup.gs (Inisialisasi 7 Tab)**.
   - Tempel ke editor Apps Script, lalu klik **Jalankan** > fungsi `setupSemuaSheet()`.
   - Spreadsheet Anda akan otomatis dibuatkan 7 sheet lengkap dengan format tabel, warna, rumus saldo, dan data 18 pelanggan Kp. Maja.
4. Salin skrip dari tab **2. Api.gs (Web App Endpoint)**.
   - Buat file baru di Apps Script dengan nama `Api.gs`.
   - Klik **Deploy** > **Penerapan Baru (New Deployment)** > Jenis: **Aplikasi Web (Web App)**.
   - Akses: **Siapa saja (Anyone)**.
   - Salin URL Web App yang dihasilkan.
5. Kembali ke aplikasi, buka menu **Pengaturan**, dan tempelkan URL tersebut pada kolom **Koneksi Google Apps Script Web App**.
6. Klik **Simpan URL** dan **Uji Koneksi**. Selesai!

---

## 📄 Lisensi
Hak Cipta © 2026 Pengelola Distribusi Air Kp. Maja. Bebas digunakan dan dikembangkan untuk kepentingan kemasyarakatan.
