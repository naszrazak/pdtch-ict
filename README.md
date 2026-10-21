# Aset ICT PDTCH

Sistem Senarai Aset ICT PDTCH (Fasa 1). Rujuk [PERANCANGAN.md](PERANCANGAN.md) untuk keputusan reka bentuk.

Teknologi: React + TypeScript + Vite + Tailwind, Firebase (Auth, Firestore, Hosting). Berfungsi dalam pelan **Spark** (percuma); Storage tidak digunakan.

## Persediaan Firebase (sekali sahaja)

Projek Firebase: `pdtch-ict`. Di [Firebase Console](https://console.firebase.google.com/project/pdtch-ict):

1. **Authentication → Sign-in method**: aktifkan **Google**. Login hanya melalui akaun Google.
2. **Authentication → Settings → User actions**: biarkan **"Enable create (sign-up)"** bertanda, jika tidak akaun Google baharu tidak boleh log masuk. Akses sistem tetap dikawal oleh senarai **Pengguna** dalam sistem; akaun Google yang tiada dalam senarai ditolak dan dipadam terus dari Firebase Authentication (selepas sistem dimulakan).
3. **Firestore Database**: cipta pangkalan data (mod production, lokasi `asia-southeast1`).

Kemudian, dari komputer yang ada Node.js 20 atau lebih baharu:

```bash
npm install
npx firebase login
npm run deploy        # semak jenis, bina, deploy peraturan Firestore dan hosting
```

## Mula guna

1. Buka sistem, log masuk sebagai **FT**. Kali pertama, sistem minta "Mulakan sistem" dan FT menjadi **Admin pertama**.
   Langkah ini hanya boleh dibuat sekali.
2. **Import Staf**: muat naik `DATABASE_STAF_PDTCH_2026_SYAMIR.xlsx`. Sistem mencipta 3 bahagian, 9 unit dan 100 staf.
   Kumpulan "Warga Kerja UE" dikecualikan. Import boleh diulang dengan selamat (nama sedia ada dilangkau).
3. **Pengguna**: tambah emel PPTM (emel akaun Google mereka) dan pilih peranan Admin.
4. Mula rekod aset di meja staf (mesra telefon): **Tambah aset → pilih staf → isi → Simpan & tambah lagi**.

## Peranan

| Peranan | Akses |
|---|---|
| Admin (FT, PPTM) | Penuh: termasuk padam, struktur bahagian/unit, import, pengguna, log audit |
| Juruteknik | Tambah dan kemaskini staf/aset; tidak boleh padam |

Setiap perubahan direkod dalam **Log Audit** (siapa, apa, bila, medan yang berubah). Log tidak boleh diubah atau dipadam.

## Ciri Fasa 1

- Login dan peranan (Admin / Juruteknik)
- Struktur Bahagian → Unit → Staf, termasuk import dari Excel
- Rekod aset: jenis, jenama, model, no. siri, no. pendaftaran harta modal, tarikh terima, tarikh tamat warranty,
  status, pemegang (staf atau GUNASAMA), catatan
- Ikat aset kepada aset lain (contoh: monitor kepada PC). Bila pemegang PC bertukar, aset yang diikat boleh dipindah bersama
- Sejarah pemegang untuk setiap aset
- Senarai aset belum lengkap (tiada no. siri, no. pendaftaran atau tarikh warranty)
- Laporan **SENARAI ASET ICT (JENIS)**: A4 landskap, ikut bahagian atau unit, PDF dan Excel

## Pembangunan

```bash
npm run dev            # pelayan dev (menyambung ke Firebase sebenar)
npm run dev:emulator   # pelayan dev dengan Firebase Emulator tempatan (perlu Java)
npm run lint           # ESLint + semakan jenis TypeScript
npm test               # ujian unit (import Excel, laporan, log perubahan)
npm run test:rules     # ujian peraturan Firestore dengan emulator (perlu Java)
npm run build
```

Struktur:

```
src/
  types.ts        jenis data (Bahagian, Unit, Staf, Aset, LogAudit, ...)
  lib/            logik tanpa UI: firebase, tulis (simpan + log audit), importStaf, laporan, eksport (PDF/Excel), ...
  context/        Auth (profil & peranan) dan Data (langganan langsung koleksi Firestore)
  components/     komponen UI dikongsi
  pages/          halaman
firestore.rules   peraturan keselamatan Firestore
tests/            ujian unit
tests-rules/      ujian peraturan Firestore
```

Koleksi Firestore: `bahagian`, `unit`, `staf`, `aset` (subkoleksi `sejarah`), `pengguna` (id = emel), `logAudit`, `config/sistem`.
