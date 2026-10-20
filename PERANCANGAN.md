# Perancangan Sistem Senarai Aset ICT PDTCH

Ringkasan keputusan daripada sesi perbincangan. Rujuk dokumen ini sebelum mula membina.

## Tujuan

Sistem untuk merekod dan mengurus aset ICT di PDTCH, mengikut hierarki:

**PDTCH → Bahagian → Unit → Staf (pengguna) → Aset**

## Pengguna sistem

- Hanya personel IT: **FT** (pembina dan pengurus sistem) dan **PPTM**
- Kedua-duanya **Admin** (akses penuh)
- Peranan **Juruteknik** disediakan untuk kegunaan kemudian (boleh tambah dan kemaskini, tidak boleh padam)
- Setiap perubahan direkod: siapa buat, apa diubah, bila

## Teknologi

- React + Vite + Tailwind
- Firebase (Auth, Firestore, Storage, Hosting)
- **Projek Firebase baru**, berasingan daripada sistem lain
- Mesra telefon, kerana sistem diguna terus untuk kerja inventori di meja staf

## Struktur organisasi

| Bahagian | Unit | Bil. staf |
|---|---|---|
| Bahagian Pengurusan Daerah | Pejabat Pegawai Daerah | 2 |
| | Unit Pentadbiran dan Kewangan | 25 |
| | Unit Teknologi Maklumat | 2 |
| Bahagian Pembangunan Daerah | Unit Pembangunan Fizikal | 12 |
| | Unit Pembangunan Masyarakat | 7 |
| Bahagian Pengurusan Tanah | Unit Pembangunan Tanah | 11 |
| | Unit Pelupusan Tanah | 17 |
| | Unit Pendaftaran dan Hasil | 9 |
| | Unit Penguatkuasaan dan Pemantauan | 15 |
| **Jumlah** | | **100** |

Sumber: fail Excel `DATABASE_STAF_PDTCH_2026_SYAMIR.xlsx` (asalnya senarai penerima corporate gift 2026).

- Bahagian **"Warga Kerja UE"** (11 orang) dalam fail itu **dikecualikan**. Mereka personel PDTCH yang dipinjamkan ke UE dan tidak menggunakan aset di sini. Boleh ditambah kemudian jika mereka kembali.
- Jawatan dalam fail ditulis ringkas dan **tanpa gred**. Gred dikosongkan dulu dan dilengkapkan kemudian dalam sistem.
- Fail Excel ini perlu dimuat naik semula ke sesi pembinaan untuk diimport.

## Aset ICT

- Setiap peranti direkod sebagai aset sendiri: PC, laptop, monitor, printer, UPS, scanner dan lain-lain
- Maklumat aset:
  - Jenis, jenama, model
  - Nombor siri (pilihan)
  - No. pendaftaran harta modal (pilihan), format contoh `PDTCH/12000/H/23/30`
  - Tarikh terima, tarikh tamat warranty (pilihan)
  - Status: aktif, rosak, dalam pembaikan, dilupuskan
  - Pemegang: seorang staf, **atau GUNASAMA** (dikongsi, di bawah unit)
  - Gambar label nombor siri atau pelekat harta modal (pilihan)
- Aset boleh **diikat** ke aset lain, contohnya monitor ke set PC (pilihan)
- Senarai **"aset belum lengkap"**: aset tanpa nombor siri, no. pendaftaran atau tarikh warranty
- Sejarah pemegang disimpan bila aset berpindah tangan

## Stor alat ganti (aset habis guna)

- SSD, RAM, power supply, keyboard, mouse dan lain-lain
- Jenis, spesifikasi/kapasiti, nombor siri (jika ada), kuantiti
- Status: dalam stor, atau dipasang di aset tertentu

## Kerosakan dan penggantian (trace)

1. Buka rekod kerosakan untuk aset
2. Pilih alat ganti dari stor
3. Stok ditolak, part direkod sebagai dipasang dalam aset tersebut
4. Part lama direkod sebagai rosak (untuk dilupus atau claim warranty)

Boleh cari dua hala:
- Part bernombor siri X berada di aset mana / dipegang siapa
- Aset Y pernah tukar part apa (sejarah penuh)

## Laporan: Senarai Aset ICT

Mengikut format sedia ada di PDTCH:

- Saiz **A4 landskap**
- Tajuk: **SENARAI ASET ICT (jenis aset)**, contohnya (KOMPUTER), diikuti nama bahagian/unit
- Lajur: **Bil, Nama Pengguna, Jawatan / Gred, Jenama / Model, No. Siri, No. Pendaftaran**
- Aset gunasama ditulis **GUNASAMA** di lajur Nama Pengguna
- **Tiada logo, tiada ruang tandatangan**
- Filter: bahagian, unit, jenis aset, status (dan pilihan lajur tarikh warranty)
- Boleh jana ikut bahagian (gabung semua unit) atau ikut unit
- Output: **PDF** (cetak) dan **Excel** (sunting)

## Fasa pembinaan

1. **Fasa 1**: login, struktur bahagian/unit/staf (termasuk import 100 staf), rekod aset, senarai aset belum lengkap, laporan Senarai Aset ICT
2. **Fasa 2**: stor alat ganti, rekod kerosakan dan penggantian, trace
3. **Fasa 3**: dashboard penuh, laporan tambahan, amaran warranty, label QR

## Status

Perancangan selesai. Belum mula membina. Langkah seterusnya: mula Fasa 1 dalam repo ini.
