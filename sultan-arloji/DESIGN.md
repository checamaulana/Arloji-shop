# DESIGN.md — Sultan Arloji

Spesifikasi redesign UI/UX storefront dan panel admin. Arah desainnya adalah butik jam tangan dengan permukaan putih, blok maroon, aksen kuning, teks hitam, dan efek kaca ringan. Katalog tetap mudah dipindai di layar kecil. Panel admin memakai bahasa visual yang sama dengan penekanan pada data dan tindakan operasional.

**Dasar spesifikasi** — Dua gambar diperiksa langsung dari lampiran percakapan. Struktur dan perilaku aplikasi dicek pada cabang utama Arloji-shop di commit b949752. Aplikasi ada di folder sultan-arloji dan menggunakan Next.js App Router, Tailwind CSS, Firebase Authentication, Cloud Firestore, serta Firebase Storage. [Sumber proyek](https://github.com/checamaulana/Arloji-shop/tree/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji)

## 1. Analisis kedua referensi

| Lampiran | Yang terlihat | Keputusan untuk Sultan Arloji |
| --- | --- | --- |
| image(5).png · Customer | Storefront tampil sebagai kolom sekitar 460 px di tengah kanvas krem. Header hijau tua menampilkan avatar bulat dan nama toko. Tiga produk disusun sebagai baris dengan foto persegi di kiri, nama yang membungkus dan harga tebal di kanan, tombol hijau **Tambah**, pemisah tipis, dan badge **4 foto** di atas foto. Kontrol **Semua barang** terlihat di bawah daftar. | Gunakan bentuk kolom, header ringkas, baris foto–informasi–aksi, dan penanda galeri. Ubah hijau menjadi maroon pada identitas dan kuning pada aksi. Harga tetap gelap agar mudah dipindai. Tempatkan pencarian dan filter merek yang sudah ada di atas katalog. Tombol **Pesan** membuka checkout produk yang dipilih. |
| image(4).png · Admin | Dashboard selebar sekitar 470 px menampilkan topbar putih, pita tautan toko hijau tua dengan aksi ikon, kartu metrik 2 × 2 dengan angka besar dan tint lembut, panel referral hijau, pesan aktivitas, serta navigasi bawah **Beranda**, **Pesanan**, **Barang**, dan **Toko**. | Gunakan topbar putih, panel tautan maroon, grid metrik dua kolom, angka tabular, dan navigasi bawah berlabel. Tampilkan tiga metrik yang tersedia di aplikasi. Pakai label pada tindakan salin dan bagikan. |

Kedua referensi mengutamakan hierarki yang ringkas di ruang sempit. Pertahankan komposisi kolom tengah saat layar melebar. Ganti identitas Superstore dengan logo dan data toko yang sudah tersedia. Gunakan hanya produk, metrik, klaim, dan tindakan yang memiliki sumber di Sultan Arloji. Blok referral, tombol bahasa **EN**, kredit Superstore, dan metrik pembeli berulang berada di luar cakupan.

## 2. Arah visual dan design tokens

Putih mendominasi katalog, daftar, dan formulir. Maroon membingkai header toko, panel tautan, dan area identitas login. Kuning mengarahkan mata ke aksi utama dan pilihan aktif. Hitam hangat memberi kontras pada harga, angka, judul, dan tombol kuning. Gunakan foto produk yang tersimpan sebagai fokus visual dengan pencahayaan dan latar netral jika foto baru disiapkan kemudian.

### Warna

| Token | Nilai | Penggunaan |
| --- | --- | --- |
| --surface | #FFFFFF | Kartu, daftar, formulir, isi dialog |
| --canvas | #FAF7F7 | Latar halaman dan area luar kolom |
| --brand | #641F36 | Header toko, kartu tautan, ikon aktif, fokus di permukaan terang |
| --brand-strong | #481326 | Bagian gelap header dan variasi maroon |
| --brand-tint | #F6E8EE | Chip terpilih, tile ikon, latar foto netral |
| --accent | #F7CD4A | CTA utama dan detail aksen pada maroon |
| --accent-hover | #EAB92C | Hover CTA utama |
| --accent-pressed | #DCA51D | Pressed CTA utama |
| --ink | #171217 | Judul, isi, harga, ikon, teks pada kuning |
| --ink-muted | #5F5157 | Deskripsi, label sekunder, placeholder |
| --ink-on-brand | #FFFFFF | Teks utama di atas maroon |
| --border-subtle | #E6DCE0 | Pemisah daftar dan batas kartu dekoratif |
| --border-control | #8B747E | Batas input dan kontrol yang perlu terlihat |
| --success-text / --success-surface | #145B43 / #E7F6EF | Tersedia, selesai |
| --warning-text / --warning-surface | #714300 / #FFF3CC | Pesanan aktif dan perhatian sesuai konteks |
| --danger-text / --danger-surface | #A21B2E / #FDECEF | Habis, kesalahan, konfirmasi hapus |
| --info-text / --info-surface | #224F75 / #EAF3FB | Informasi dan petunjuk status |
| --focus-light / --focus-dark | #641F36 / #F7CD4A | Cincin fokus di atas permukaan terang / maroon |
| --disabled-surface / --disabled-text | #F1E9ED / #5F5157 | Kontrol tidak tersedia |

Pasangan warna solid yang dihitung dengan rumus luminans relatif. Hitam pada putih **18,50:1**, teks sekunder pada putih **7,50:1**, putih pada maroon **11,72:1**, hitam pada kuning **12,14:1**, batas kontrol pada kanvas **4,03:1**, dan fokus kuning pada maroon **7,70:1**. Kuning pada putih **1,52:1**. Pakai teks hitam dan batas maroon pada tombol kuning di permukaan terang agar bentuk dan labelnya terbaca. Evaluasi ulang kontras pada hasil komposit transparansi, foto, dan seluruh keadaan interaktif. [WCAG 2.2, W3C](https://www.w3.org/TR/WCAG22/)

### Tipografi, ukuran, dan permukaan

| Peran | Ukuran dan tinggi baris | Bobot dan pemakaian |
| --- | --- | --- |
| Judul toko | 26/32 px | 700, tinggi header mengikuti jumlah baris |
| Judul halaman admin | 24/30 px | 700 |
| Judul bagian | 18/24 px | 650–700 |
| Nama produk | 16/22 px | 600, dapat membungkus |
| Isi dan field | 16/24 px | 400, termasuk nilai input di perangkat mobile |
| Keterangan dan label | 14/20 px | 400–600 |
| Badge dan info ringkas | 12/16 px | 600, dengan label yang tetap terbaca |
| Harga dan angka metrik | 18/24 px dan 28/32 px | 700, gunakan angka tabular |

Gunakan Geist yang sudah dimuat proyek dengan fallback system sans. Hindari all caps untuk label panjang. Pakai skala jarak **4, 8, 12, 16, 20, 24, 32, 40 px**. Radius **12 px** untuk field dan tombol, **16 px** untuk kartu, **24 px** untuk sudut panel dan dialog, serta radius penuh untuk chip. Ikon Lucide **18–20 px** di dalam target interaksi minimum **44 × 44 px**. Gunakan pemisah 1 px dan bayangan kartu ringan seperti 0 4px 16px rgba(23, 18, 23, 0.06).

Efek kaca dipakai pada bilah filter, navigasi bawah admin, dan panel identitas login. Gunakan putih **94%**, blur latar **12 px**, pemisah halus, dan fallback putih solid. Lapisan dekoratif boleh memakai gradasi maroon ke maroon gelap. Isi input, kartu produk, dan isi dialog tetap solid. Panel modal memakai scrim hitam hangat sekitar **48%**. Transisi warna atau kemunculan panel berlangsung **120–200 ms** dan dipangkas saat preferensi pengurangan gerak aktif.

## 3. Layout dan responsive behavior

| Lebar viewport | Customer | Admin |
| --- | --- | --- |
| ≤359 px | Gutter 12 px. Baris produk memakai foto 80 px. Harga dan tombol bertumpuk jika ruang sisa sempit. Chip bisa bergulir horizontal. | Gutter 12 px. Dua kartu metrik jika setiap kartu mendapat setidaknya 132 px. Turun ke satu kolom saat ruang atau ukuran teks tidak cukup. |
| 360–479 px | Gutter 16 px. Foto 92–104 px sesuai ruang. Baris foto di kiri dan informasi di kanan. Sheet checkout dan chat mengikuti lebar viewport. | Gutter 16 px. Grid metrik dua kolom dengan jarak 12 px. Daftar, kartu pesanan, dan form satu kolom. Navigasi bawah empat item dengan bobot ruang setara. |
| ≥480 px | Kolom maksimum 448 px, rata tengah, dengan gutter internal 20 px. Foto katalog hingga 112 px. Sheet mengikuti lebar kolom. | Kolom maksimum 448 px, rata tengah, dengan gutter 20 px. Navigasi bawah mengikuti lebar kolom. Dialog konfirmasi memakai jeda minimum 16 px dari tepi. |

- Gunakan tinggi viewport dinamis pada sheet. Isi dapat digulir sampai tombol terakhir ketika keyboard terbuka. Beri batas tinggi yang menyisakan ruang untuk tombol tutup pada layar pendek, lalu izinkan area gulir terpadu bila footer tetap menyisakan ruang terlalu sedikit.
- Reservasi ruang bawah sebesar tinggi bilah aktual, ditambah safe area dan jarak 16 px. Terapkan juga pada posisi fokus dan akhir daftar. Baris produk atau pesanan bertambah tinggi saat teks membungkus.
- Urutan lapisan dari bawah ke atas adalah konten, bilah filter sticky, navigasi bawah admin atau tombol Asisten AI, scrim dan panel modal, lalu pengumuman status jika tidak berada dalam panel. Saat checkout atau chat terbuka, panel mengambil alih interaksi. Sembunyikan tombol AI di balik checkout dan cegah overlay saling menutup.
- Pertahankan susunan yang sama untuk desktop, dengan kanvas terang mengelilingi kolom. Lebar ini mengikuti wadah mobile-first proyek dan mendekati proporsi kedua referensi. [Layout aplikasi saat ini](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/app/layout.tsx)

## 4. Customer storefront

### 4.1 Beranda dan katalog /

Urutan layar adalah **profil toko → pencarian dan filter → judul katalog dan jumlah hasil → daftar produk**. Launcher **Asisten AI** berada di sudut bawah kolom dengan jarak 16 px dan ruang cadangan agar kartu terakhir dapat dibaca dan dioperasikan.

| Komponen | Spesifikasi |
| --- | --- |
| Header toko | Bidang maroon dengan padding 16–20 px. Logo atau inisial dalam lingkaran 48–56 px, nama toko sebagai h1 putih, dan bio bila tersedia. Gunakan data profil yang ada. Bungkus nama panjang dan pertahankan akses ke tindakan kontak yang sudah tersedia. |
| Pencarian | Bilah sticky putih dengan lapisan kaca ringan. Label **Cari jam tangan**, ikon kaca pembesar, tombol **Hapus pencarian** saat ada teks. Tinggi 44–48 px. Pencarian tetap memakai nama dan deskripsi yang sudah dipakai aplikasi. |
| Filter merek | Chip **Semua**, **Rolex**, **Patek**, **Audemars**, dan **Hublot**. Gunakan pilihan tunggal dengan aria-pressed, teks dan tanda pilihan yang terlihat. Geser deret dalam wadah pada layar sempit. Fokus keyboard harus membawa chip ke area terlihat. |
| Kartu produk | Gambar 1:1 di kiri, nama, deskripsi ringkas bila tersedia, badge stok, harga Rupiah, dan **Pesan** di kanan. Gunakan permukaan putih, pemisah tipis, dan gap 12 px. Pertahankan nama utuh secara visual dengan membungkusnya. Biarkan harga dan CTA pindah baris untuk menjaga keterbacaan. |
| Galeri produk | Gunakan object-fit contain dan wadah netral agar badan, dial, dan strap tetap terlihat. Tampilkan foto pertama, indikator **1/4 foto** sesuai panjang data, dan kontrol sebelumnya/berikutnya saat ada beberapa foto. Pastikan kedua kontrol dapat diakses di ponsel dan dengan keyboard. Wadah gambar tetap memiliki rasio yang sama ketika foto rusak atau tidak tersedia. Tampilkan **Foto belum tersedia** pada placeholder lokal. |
| Harga dan stok | Gunakan pemformat Rupiah yang ada. Harga Rp 0 tetap ditampilkan sebagai nilai sah bila data menyatakannya. **Tersedia** mengizinkan **Pesan**. **Habis** punya label dan CTA disabled sesuai stock_status. |
| Hasil pencarian | Gunakan judul **Koleksi jam tangan** dan hitungan dari hasil filter. Tampilkan **Jam tangan tidak ditemukan** serta **Reset pencarian** untuk pencarian tanpa hasil. Reset mengembalikan kata kunci kosong dan pilihan **Semua**. |

Pencarian, filter merek, pencatatan kunjungan, dan fallback data katalog tetap memakai alur yang ada. Hanya tampilkan keadaan kosong atau gagal sesuai sinyal yang tersedia di antarmuka. Jika fallback yang sudah ada berhasil tampil, katalog tetap dapat digunakan. [Storefront](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/app/page.tsx)

### 4.2 Checkout WhatsApp

1. **Pesan** membuka sheet **Konfirmasi pesanan** untuk satu produk. Header berisi judul dan tombol **Tutup**. Ringkasan memuat thumbnail 64 px, nama, harga per unit, dan stepper jumlah dengan label **Kurangi jumlah** dan **Tambah jumlah**. Jumlah minimum tetap satu.
2. Tampilkan field **Nama**, **Nomor WhatsApp**, dan **Alamat atau area pengiriman** dengan label permanen dan pesan validasi dekat field. Pertahankan syarat dan normalisasi yang berlaku pada handler. Gunakan keyboard telepon untuk nomor, pertahankan format awalan yang sudah dipakai, dan izinkan tempel.
3. Tampilkan **Pratinjau pesan WhatsApp** dengan isi yang berasal dari pesan yang sama yang dibuka di WhatsApp. Izinkan teks membungkus. Tampilkan **Total** dan CTA kuning **Lanjut ke WhatsApp** di footer. Microcopy yang disarankan adalah “Tinjau dan kirim pesan di WhatsApp.”
4. Saat permintaan berjalan, ubah label menjadi **Memproses pesanan…** dan cegah penekanan ganda. Urutan pencatatan pesanan, isi payload, nomor tujuan dari profil toko, format pesan, dan pembukaan WhatsApp memakai handler yang ada. Fallback ke WhatsApp tetap berjalan saat pencatatan gagal. Gunakan keterangan **Mengarahkan ke WhatsApp…** saat pengalihan berlangsung. Konfirmasi transaksi bergantung pada pesan yang pengguna kirim dan tindak lanjut toko.
5. Saat sheet ditutup, fokus kembali ke tombol pemicu yang masih tersedia. Uji panel dengan keyboard virtual terbuka, alamat panjang, jumlah lebih dari satu, dan keadaan pencatatan gagal. Pertahankan perilaku pengisian form yang berlaku ketika sheet ditutup dan dibuka kembali.

[Sumber alur checkout](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/components/customer/checkout-drawer.tsx)

### 4.3 Asisten AI

- Launcher **Asisten AI** memakai permukaan maroon dengan ikon atau label putih dan target minimal 44 px. Panel percakapan memakai header maroon, area pesan putih, gelembung asisten dengan tint lembut, dan gelembung pengguna dengan warna yang dibedakan oleh label pengirim.
- Pertahankan sapaan, saran pertanyaan yang sudah tersedia, urutan pesan, reset, tutup, dan pengiriman. Komposer tetap terlihat dekat keyboard. Pakai placeholder **Tanya tentang koleksi jam tangan…** dan tombol **Kirim**. Chip saran tetap berupa tombol.
- Pada streaming, tampilkan **Asisten sedang menjawab…** dan pembaruan visual pesan. Umumkan satu kali saat jawaban selesai kepada pembaca layar. Tampilkan pesan gangguan dalam percakapan dan aktifkan kembali komposer agar pengguna dapat bertanya lagi lewat pengiriman yang sudah ada.
- Dialog mengunci fokus dan interaksi latar selama terbuka. Saat ditutup, fokus kembali ke launcher. Riwayat dalam sesi, format pesan, dan streaming tetap mengikuti implementasi yang ada. [Sumber Asisten AI](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/components/customer/ai-chat-floating.tsx)

## 5. Panel admin

### 5.1 Shell admin

Topbar putih menampilkan identitas Sultan Arloji dan tindakan **Keluar**. Navigasi bawah memakai ikon dan label **Beranda**, **Pesanan**, **Barang**, dan **Toko**. Tandai item aktif dengan warna maroon, latar tint, bobot teks, dan aria-current. Rute tambah dan edit tetap menandai **Barang**. Pertahankan posisi navigasi saat daftar panjang. Halaman login berdiri sendiri di luar navigasi operasional. [Sumber navigasi admin](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/components/admin/admin-nav.tsx)

### 5.2 Login · /admin/login

Gunakan kanvas putih dan panel login solid dengan aksen maroon pada identitas. Letakkan judul **Masuk ke panel admin**, field **Email** dan **Kata sandi**, serta tombol kuning **Masuk** dalam satu kolom. Pertahankan autocomplete, dukungan pengelola kata sandi, dan perilaku submit dengan Enter. Saat submit, gunakan teks **Memeriksa…**. Tampilkan kegagalan autentikasi atau sesi dalam pesan ringkas dekat formulir dan arahkan fokus ke pesan bila dibutuhkan. Pertahankan Firebase Authentication, pembuatan sesi server, redirect yang benar, dan guard admin. [Sumber login](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/app/admin/login/page.tsx)

### 5.3 Beranda · /admin

- **Link toko online** tampil pada kartu maroon dengan URL yang membungkus, tombol **Salin link** kuning, dan **Bagikan** berbingkai putih. Tampilkan hasil salin sebagai status yang dapat dibaca pembaca layar. Pertahankan fallback salin ketika fitur berbagi perangkat tidak tersedia dan perilaku ketika pengguna membatalkannya.
- **Ringkasan** di bawahnya memiliki tiga kartu. Kartu **Pesanan masuk** dan **Produk tersedia** menempati baris pertama. Kartu **Pengunjung** dapat merentang dua kolom agar pilihan **Hari ini**, **7 hari**, **30 hari**, **Semua** mudah dipahami. Tampilkan label rentang hanya pada metrik Pengunjung.
- Gunakan angka tabular, ikon dengan tile maroon muda, dan label 14 px. Tampilkan **0** untuk hasil nol yang valid, skeleton ketika memuat, dan **—** beserta keterangan saat nilai tidak tersedia. Pertahankan definisi asal untuk hitungan pesanan aktif, barang in_stock, dan pageviews dalam rentang yang dipilih. [Sumber dashboard](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/components/admin/admin-dashboard.tsx)

### 5.4 Daftar barang · /admin/barang

- Judul **Barang**, CTA kuning **Tambah barang**, dan daftar dalam kartu putih. Tiap baris memuat thumbnail 56–64 px, nama, harga, badge **Tersedia** atau **Habis**, serta aksi **Edit** dan **Hapus**. Jika lebar terbatas, letakkan aksi di bawah info. Tombol ikon memuat nama produk pada label aksesibel.
- Tambah menuju /admin/barang/tambah, sedangkan edit menuju /admin/barang/[id]. Konfirmasi hapus menampilkan nama barang, dengan **Batal** sebagai fokus awal dan **Hapus barang** sebagai aksi destruktif. Pertahankan konfirmasi yang sudah ada bila dialog belum diganti. Saat penghapusan berlangsung, kunci aksi yang sama dan beri indikator pada baris terkait. Hapus baris setelah hasil sukses yang ada. Saat gagal, baris tetap terlihat dan pesan muncul dekat daftar.
- Gunakan skeleton yang menyerupai baris. Untuk daftar yang berhasil dimuat tanpa barang, tampilkan **Belum ada barang** dan CTA **Tambah barang**. Gangguan pemuatan memakai pesan yang berbeda dari keadaan kosong. [Sumber daftar barang](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/components/admin/admin-product-list.tsx)

### 5.5 Form barang · /admin/barang/tambah dan /admin/barang/[id]

| Bagian | Spesifikasi |
| --- | --- |
| Identitas barang | Tautan **Kembali ke barang** dan judul **Tambah barang** atau **Edit barang**. Isi dari data produk ketika edit. Beri skeleton selama data dimuat. Bila edit gagal memuat atau ID tidak ditemukan, tampilkan keadaan itu secara eksplisit dengan jalan kembali yang tersedia. |
| Informasi | **Nama barang** wajib, sampai 160 karakter. **Harga (Rupiah)** wajib, angka bulat mulai dari 0. **Keterangan** opsional, sampai 2.000 karakter. **Status stok** memakai nilai yang ada, dilabeli **Tersedia** atau **Habis**. Tampilkan pesan di dekat field yang terkait. |
| Foto produk | Grid dua kolom yang turun ke satu jika ruang kurang. Beri counter **n/5 foto**, pencantuman tipe JPG, PNG, WebP dan batas **10 MB per foto**. Tampilkan thumbnail, tombol hapus berlabel, dan ubin **Unggah foto** selama ada slot. Sediakan akses keyboard ke pemilih file. Selama unggah, tampilkan label **Mengunggah foto…**. |
| Aksi simpan | Tombol kuning **Simpan barang** atau **Simpan perubahan**. Saat simpan gunakan label **Menyimpan…**. Pertahankan penguncian saat unggah, enhancement, atau simpan berlangsung. Nilai input dan foto tetap terlihat jika terjadi kesalahan. Pada sukses, pertahankan pengalihan ke daftar barang. |

**AI image enhancement.** Tampilkan tombol sekunder **Sempurnakan dengan AI** pada foto yang dapat diproses dan beri label aksesibel yang menyebut nomor foto. Saat berjalan, gunakan label **Menyempurnakan foto…** pada foto yang diproses. Pertahankan hasil yang ditambahkan sebagai foto baru dalam galeri. Foto sumber tetap tampil. Beri keterangan **Hasil AI** selama sesi form bila antarmuka mengetahui asal hasil dari operasi ini. Saat slot penuh, tampilkan **Hapus satu foto untuk menambahkan hasil AI**. Jika gagal, tampilkan pesan di dekat galeri dan biarkan tombol tersedia kembali setelah proses selesai. Gunakan status proses sesuai respons nyata, tanpa persentase rekaan. Hasil tetap mengikuti alur penyimpanan produk yang ada. [Sumber form dan enhancement](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/components/admin/admin-product-form.tsx)

### 5.6 Pesanan · /admin/pesanan

- Urutan layar adalah judul **Pesanan**, tombol **Muat ulang pesanan**, tab **Pesanan masuk** dan **Riwayat**, lalu daftar kartu. Tab mengacu pada active dan completed. Gunakan pola tab dengan navigasi panah dan fokus terlihat.
- Kartu menampilkan nama pelanggan, tanggal, badge **Aktif** atau **Selesai**, kontak WhatsApp yang tersedia, alamat, item, kuantitas, harga satuan, dan total. Pakai angka tabular serta baris berlapis pada ruang sempit. Jangan mengganti nomor tujuan, format tanggal yang berlaku, ataupun status penyimpanan.
- **Tandai selesai** tampil pada pesanan aktif. Saat proses berjalan satu pesanan, gunakan **Memperbarui…** pada kartu itu dan kunci klik ulang. Pada sukses, pindahkan tampilan sesuai hasil yang sudah ditetapkan handler. Pada gagal, pertahankan kartu pada daftar aktif dan tampilkan pesan. Arahkan fokus ke kartu berikutnya atau judul bagian bila kartu hilang.
- Keadaan kosong dibedakan menjadi **Belum ada pesanan masuk** dan **Belum ada riwayat pesanan**. Saat gagal memuat, gunakan status gagal dan tombol muat ulang yang sudah ada. [Sumber manajemen pesanan](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/components/admin/admin-orders.tsx)

### 5.7 Pengaturan toko · /admin/toko

Route dan item navigasi **Toko** sudah tersedia pada cabang utama yang ditinjau. Terapkan shell, token, dan gaya form yang sama pada bagian **Informasi toko** dan **Akun admin**. Pertahankan pengisian nama, bio, logo, WhatsApp tujuan checkout, email, dan kata sandi. Pisahkan keadaan visual unggah logo, simpan pengaturan, dan kesalahan akun pada lokasi yang relevan. Pertahankan validasi, autentikasi ulang, urutan penyimpanan, serta penyegaran sesi yang ada. Pesan hasil mengikuti bagian operasi yang benar-benar berhasil atau gagal. [Sumber pengaturan toko](https://github.com/checamaulana/Arloji-shop/blob/b94975211c7758921c4c613c7428cdbd423cea6c/sultan-arloji/app/admin/toko/page.tsx)

## 6. Komponen bersama, states, dan aksesibilitas

| Komponen atau state | Aturan |
| --- | --- |
| Tombol primer | Kuning dengan teks hitam. Gunakan token hover dan pressed, cincin fokus 2 px dengan offset 2 px, dan label aksi yang tetap terbaca. |
| Tombol sekunder | Putih dengan teks dan batas maroon. Di permukaan maroon, pakai varian putih transparan dengan garis dan teks putih. Ghost dipakai untuk tindakan pendamping. |
| Aksi destruktif | Teks dan batas danger untuk pemicu. Tombol konfirmasi dapat memakai danger solid dengan teks putih. Dialog menyebut nama objek dan memiliki aksi batal. |
| Input, select, textarea | Label permanen, border-control, tinggi minimal 44 px, dan petunjuk di bawah label bila diperlukan. Gunakan aria-invalid serta aria-describedby untuk error yang terkait field. Fokus ke field invalid pertama saat submit. |
| Badge, chip, tab, navigasi | Status selalu ditulis sebagai teks. Tanda pilihan ikut terlihat lewat bobot, garis, atau indikator. Warna mendukung pembedaan. |
| Pemuatan | Skeleton meniru susunan konten aktual. Gunakan aria-busy pada bagian terkait dan satu label status yang dapat diumumkan. Hindari kedipan berulang dan pergeseran layout besar. |
| Kosong | Gunakan judul spesifik serta satu aksi yang relevan bila tersedia. Keadaan hasil nol muncul setelah pemuatan berhasil. |
| Gagal dan coba lagi | Tampilkan pesan dekat sumber masalah. Gunakan aksi muat ulang, pengiriman ulang, atau submit yang sudah ada sesuai konteks. Pertahankan input yang dapat diperbaiki dan tampilkan umpan balik persisten selama pengguna membutuhkannya. |
| Sukses dan dalam proses | Gunakan role status atau live region yang sopan untuk hasil singkat. Jika toast dan pesan inline menyampaikan hasil yang sama, umumkan sekali. Tombol proses tetap berlabel dan mencegah duplikasi tindakan. |

Targetkan **WCAG 2.2 AA**. Ukur kontras teks minimum **4,5:1**, atau **3:1** untuk teks besar menurut WCAG. Pastikan batas dan ikon yang diperlukan untuk mengenali kontrol memiliki kontras setidaknya **3:1**. Gunakan target desain **44 × 44 px** untuk tombol, chip interaktif, ikon, dan kontrol galeri. [WCAG 2.2, W3C](https://www.w3.org/TR/WCAG22/)

### Perilaku aksesibel

- Gunakan bahasa halaman id, satu h1 per layar, landmark main dan nav yang tepat, heading berurutan, dan tautan **Lewati ke konten**. Gunakan tautan untuk navigasi dan tombol untuk tindakan.
- Setiap kontrol berikon memiliki nama aksesibel, terutama tutup, hapus, edit, muat ulang, salin, galeri, dan kirim. Ikon dekoratif diabaikan oleh pembaca layar. Gunakan teks alternatif untuk foto produk yang memberi informasi. Logo yang bersebelahan dengan nama toko boleh memakai teks alternatif kosong.
- Pada modal dan sheet, sediakan nama dialog, fokus awal yang jelas, siklus Tab di dalam panel, Escape untuk menutup bila operasi memungkinkan, serta pemulihan fokus ke pemicu. Drawer yang mendukung gestur tetap menyediakan tombol **Tutup**.
- Jaga fokus terlihat ketika pindah lewat keyboard, termasuk di bawah filter sticky, navigasi, footer checkout, dan keyboard virtual. Pastikan tampilan dapat mengalir ulang pada **320 CSS px** dan tetap terbaca ketika teks diperbesar **200%**.
- Hormati prefers-reduced-motion pada animasi panel, skeleton, dan gulir chat otomatis. Beri padanan yang dapat dioperasikan untuk aksi gestur atau hover. Gunakan posisi, teks, dan ikon bersama warna untuk menyampaikan keadaan.

## 7. Batas perubahan dan peta implementasi

Ruang lingkup implementasi mencakup token tema, markup presentasi, tata letak, tipografi, komponen antarmuka, dan representasi aksesibel dari state yang sudah tersedia atau yang diturunkan dari hasil operasi yang sama. State lokal seperti fokus, keterbukaan dialog, dan feedback visual dapat ditata ulang sepanjang interaksi dan handler tetap setara.

| Area | Titik kerja di folder sultan-arloji | Kontrak yang dipertahankan |
| --- | --- | --- |
| Fondasi UI | app/globals.css, app/layout.tsx, components/ui/ | Wadah mobile-first dan font yang sudah tersedia. Tema terang menjadi default. Sesuaikan kelas gelap yang sekarang dipasang global, gunakan token bersama, dan pertahankan provider, metadata, dan Toaster. |
| Storefront | app/page.tsx, components/customer/header-store.tsx, product-card.tsx | Sumber profil dan katalog, data fallback, pencarian, filter, status stok, dan tracking kunjungan. |
| Checkout | components/customer/checkout-drawer.tsx | POST /api/orders, payload dan kalkulasi total, validasi, nomor toko dari profil, format pesan, dan pembukaan WhatsApp termasuk fallback. |
| Asisten AI | components/customer/ai-chat-floating.tsx | POST /api/chat, bentuk pesan, pembacaan stream, dan perilaku reset. |
| Admin shell, dashboard, login | app/admin/layout.tsx, app/admin/login/page.tsx, components/admin/admin-nav.tsx, admin-auth-guard.tsx, admin-dashboard.tsx | Guard, cookie/sesi, login/logout Firebase, redirect, sumber perhitungan metrik, serta rentang pengunjung. |
| Barang dan gambar | app/admin/barang/, components/admin/admin-product-list.tsx, admin-product-form.tsx | GET/POST/PUT/DELETE dan payload produk, batas foto, pengunggahan ke Storage, serta POST /api/ai/enhance-image dengan hasil tambahan di galeri. |
| Pesanan dan Toko | components/admin/admin-orders.tsx, app/admin/toko/page.tsx | Filter active/completed, metode pembaruan status, tautan kontak, pengaturan profil, unggah logo, autentikasi ulang, dan sinkronisasi nomor WhatsApp. |

Pertahankan rute dan URL yang ada, koleksi dan skema Firestore, tipe data, aturan akses, API dan payload, provider/model AI, kredensial, pencatatan analytics, serta formula bisnis. Ruang lingkup ini tidak mencakup migrasi data, perubahan server, checkout multi-item, pembayaran daring, akun customer, referral, atau metrik baru. Gunakan komponen antarmuka dan paket yang sudah dipasang. Untuk penyesuaian UI yang memerlukan state gagal, manfaatkan hasil handler yang sama dan jangan menambahkan operasi tulis sebagai bagian dari pemberian feedback.

## 8. Kriteria penerimaan implementasi

- [ ] Seluruh halaman yang dicakup dapat dibuka melalui rute yang sama. Login, sesi terlindungi, logout, dan akses ke Toko memiliki perilaku yang setara dengan build awal.
- [ ] Tampilan pada 320, 375, 390, 448, 768, dan 1440 CSS px mengikuti aturan kolom, gutter, dan safe area. Produk dengan nama, deskripsi, atau harga panjang tetap dapat dibaca. Navigasi dan tombol apung tidak menutupi aksi daftar terakhir.
- [x] Cek katalog normal, foto kosong atau rusak, beberapa foto, harga nol, stok habis, hasil filter kosong, loading, dan fallback data. Pencarian dan pilihan merek memberi hasil yang sama pada data yang sama.
- [ ] Konfirmasi checkout memakai produk, kuantitas, total, kontak tujuan, dan pesan yang sama dengan implementasi awal. Uji field kosong, submit berulang, jalur pencatatan sukses dan gagal, serta pembukaan WhatsApp. Checkout tetap dapat dipakai ketika keyboard mobile muncul.
- [x] Asisten AI membuka dan menutup dengan benar, menerima kedua cara input yang ada, menampilkan stream, dapat direset, dan pulih dari kegagalan jaringan.
- [x] Dashboard membedakan nol, memuat, dan metrik tidak tersedia. Salin link, bagikan, dan pemilihan rentang pengunjung bekerja pada data yang sama.
- [ ] Uji tambah, edit, dan hapus barang. Periksa ID yang tidak ditemukan, data lama tanpa foto, foto yang ditolak, unggah berhasil, enhancement berhasil dan gagal, galeri penuh, dan penguncian simpan selama operasi yang sedang berlangsung.
- [ ] Uji tab pesanan, muat ulang, kontak WhatsApp, penyelesaian pesanan, dan keadaan gagal. Uji pembaruan profil toko serta akun, termasuk nomor tujuan checkout setelah perubahan.
- [ ] Lakukan satu putaran dengan keyboard dan pembaca layar. Periksa fokus, label, pemberitahuan tunggal untuk aksi, reflow, kontras hasil render, dan mode pengurangan gerak.
- [ ] Jalankan lint dan build yang tersedia di proyek setelah implementasi UI. Bandingkan request dan hasil operasi sebelum serta sesudah redesign pada lingkungan uji, terutama checkout, autentikasi, perubahan stok, unggah foto, dan perubahan status pesanan.

Centang menunjukkan kriteria yang lolos di lingkungan verifikasi di bawah. Kriteria gabungan tetap terbuka selama masih ada bagian yang belum diuji.

## 9. Status implementasi

Redesign storefront dan panel admin sudah diterapkan pada seluruh rute di bagian 7. UI menggunakan token maroon, kuning, dan putih, dengan kolom maksimum 448 px. Form, galeri, navigasi, dan pesan status mengikuti gaya bersama. Rute, kontrak API, dan skrip data yang ada tetap dipakai.

Checkout dan Asisten AI menggunakan dialog modal berbentuk panel bawah. Ringkasan total dan tombol WhatsApp tetap terlihat saat panel cukup tinggi. Pada layar pendek, formulir dan footer bergulir bersama. Jika browser memblokir jendela WhatsApp, panel menampilkan tautan ke pesan yang sama agar pengguna dapat melanjutkan tanpa mencatat pesanan dua kali.

### Hasil verifikasi

- Build produksi, pemeriksaan TypeScript, dan lint untuk `app` serta `components` lulus. Lint seluruh proyek masih melaporkan enam penggunaan `any` di file tipe dan satu peringatan impor di `lib/firebase/admin.ts` yang sudah ada.
- Chrome dengan API simulasi memeriksa katalog dan shell admin pada 320, 375, 390, 448, 768, dan 1440 CSS px. Pengujian mencakup aksi terakhir katalog, teks 200% pada 320 px, fokus keyboard, siklus Tab pada checkout, Escape, nama aksesibel pada dialog, dan preferensi pengurangan gerak.
- Checkout diuji dengan field kosong, alamat panjang, jumlah lebih dari satu, layar pendek, submit ganda, kegagalan pencatatan, dan jendela yang diblokir. Payload, total, nomor tujuan, dan teks yang diteruskan ke WhatsApp diperiksa.
- Alur admin diuji dengan sesi simulasi untuk pengalihan ke login dan logout. Pengujian mencakup rentang pengunjung dan status metrik, salin dan fallback bagikan, tambah/edit/hapus barang, ID yang hilang, data lama tanpa foto, hasil AI berhasil dan gagal, batas galeri, tab dan penyelesaian pesanan, penolakan file logo, serta pembaruan nomor tujuan checkout. Pesan pengaturan toko dan akun diuji saat profil berhasil disimpan sementara sesi Firebase client tidak tersedia.

### Verifikasi yang masih terbuka

- Login dengan akun Firebase uji, perubahan email atau kata sandi dengan autentikasi ulang, pengunggahan foto dan logo yang berhasil ke Firebase Storage, serta respons layanan AI langsung.
- Pembukaan dan pengiriman pesan di WhatsApp pada perangkat fisik, keyboard virtual dan safe area pada perangkat berponi, serta pengujian pembaca layar dan kontras seluruh keadaan interaktif.
