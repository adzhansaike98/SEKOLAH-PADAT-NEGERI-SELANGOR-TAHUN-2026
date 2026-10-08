# Dashboard Sekolah Padat Negeri Selangor 2026

Dashboard web interaktif, responsif dan boleh diterbitkan melalui **GitHub Pages**, menggunakan **129 rekod** daripada `UPDATED LIST DASHBOARD 20A (1)(2).xlsx` yang dibekalkan.

## Fungsi

- Peta OpenStreetMap/Leaflet berasaskan **latitude dan longitude** bagi setiap sekolah; penanda biru (SK) dan jingga (SMK), kluster dan pop-up.
- Graf daerah, komposisi SK/SMK, status geran, pemutihan, PBT dan kemudahan.
- Penapisan serentak mengikut daerah, jenis sekolah, status geran, pemutihan, carian nama/PBT/mukim.
- Jadual semua 129 rekod; pagination; pautan lokasi Google Maps dan eksport CSV rekod yang telah ditapis.
- Statistik dikira semula secara langsung apabila penapis berubah.

## Cara gunakan di GitHub

1. Buat repositori baharu di GitHub (contoh: `Dashboard-Sekolah-Padat-Selangor-2026`).
2. Muat naik **keseluruhan kandungan** folder ini (`index.html`, `styles.css`, `app.js`, dan folder `data/`) ke akar repositori.
3. Buka **Settings → Pages → Build and deployment**; pilih **Deploy from a branch**, `main` dan `/ (root)`; kemudian tekan **Save**.
4. Apabila diterbitkan, URL biasanya `https://NAMA-PENGGUNA.github.io/Dashboard-Sekolah-Padat-Selangor-2026/`.

## Uji secara tempatan

Di dalam folder projek jalankan:

```bash
python -m http.server 8000
```

Kemudian buka `http://localhost:8000`. **Jangan** buka `index.html` menggunakan `file://` kerana pelayar akan menghalang pembacaan JSON.

## Struktur fail

```
index.html             Antara muka
styles.css             Tema dan responsif
app.js                 Logik peta, graf, penapis, eksport CSV
data/sekolah.json      129 rekod sekolah daripada Excel
```

## Nota penting mengenai data

- Daerah **Hulu Langat** diseragamkan sebagai **Ulu Langat** supaya kedua-dua ejaan tidak dikira sebagai dua daerah.
- Jumlah: **129 sekolah** di **9 daerah**; SK **114**, SMK **15**; memerlukan pemutihan **44**; ada geran **85**, tiada geran **38**, tiada data geran **6**.
- Data asal **tidak memberikan enrolmen/kapasiti murid**, maka dashboard ini **tidak** mereka-reka peratus kepadatan atau mendakwa sekolah telah melebihi kapasiti. Tajuk “sekolah padat” merujuk kepada label senarai sumber.
- Nilai `LUAS TANAH (HEKTAR)` dalam fail sumber mempunyai beberapa nilai yang kelihatan tidak munasabah, maka **tidak dijumlahkan** menjadi KPI sehingga unit data disahkan.
- Sumber mengandungi maklumat geran/no lot/identiti lokasi. Semak dasar perkongsian data sebelum menerbitkan repositori secara **public**. Pertimbangkan menjadikan repositori **private** jika perlu.
- Peta latar dan pustaka JavaScript memerlukan sambungan internet (OpenStreetMap, unpkg, jsDelivr). Tiada kunci API diperlukan.

## Kemas kini rekod

Edit `data/sekolah.json` (kekalkan nama kunci medan), atau jana semula data daripada Excel anda; graf dan peta membaca data JSON secara dinamik.


## Lapisan sempadan daerah dan PBT (kemas kini 2026)

Dua fail sumber pengguna dimasukkan terus di dalam `data/`:

- `data/sempadan-daerah.geojson` — 9 poligon daerah Selangor, nama kawasan dalam `properties.web_name`.
- `data/sempadan-pbt.geojson` — 12 poligon Pihak Berkuasa Tempatan, nama dalam `properties.web_name` / `properties.NAMA_PBT`.

Kedua-duanya menggunakan CRS84 (susunan `[longitude, latitude]`), disokong terus oleh Leaflet. Gunakan kotak pilihan di atas peta untuk menghidupkan atau mematikan sempadan daerah (garisan biru), sempadan PBT (garisan oren putus-putus) dan lokasi sekolah. Klik atau halakan kursor pada poligon untuk nama kawasan. Butang **Papar seluruh Selangor** melaras peta kepada sempadan daerah. Penapis **PBT** memaparkan rekod sekolah mengikut nilai PBT dalam Excel (bukan pengiraan silang ruang automatik).

**Nota:** Data sempadan adalah berdasarkan fail GeoJSON yang dibekalkan; tiada perubahan atau pengesahan undang-undang terhadap geometri dibuat. Paparan memerlukan internet untuk tiles peta dan pustaka CDN.
