# 🎤 LoveChain — Pitch Deck Narration & Judge Drill

> **Untuk tim.** Dokumen ini membuat siapa pun di tim bisa **membaca, memahami, dan
> menjelaskan** pitch LoveChain dengan percaya diri — slide per slide — plus siap
> menjawab pertanyaan juri. Disusun mengikuti kerangka **Meet 7 (Pitching)** dan
> **rubrik penilaian Meet 8** dari bootcamp (track Optimism).
>
> **Cara pakai:** setiap slide punya (a) **Tujuan** — apa yang harus masuk ke kepala
> juri, (b) **Narasi** — kalimat yang diucapkan, (c) **Catatan** — hal yang tidak ada
> di slide tapi wajib disebut. Total target: **5 menit.** Latih dengan timer.

---

## ⏱️ Anggaran waktu (5 menit, 9 slide)

| Slide | Judul | Waktu | Peran dalam struktur Meet 7 |
|---|---|---|---|
| 1 | LoveChain (Hook) | 0:00–0:20 | **Hook** |
| 2 | The Problem | 0:20–1:00 | **Problem** |
| 3 | The Solution (proof stack) | 1:00–1:35 | **Solution** |
| 4 | How It Works | 1:35–2:05 | Solution (lanjutan) |
| 7 | Demo Scenarios → **LIVE DEMO** | 2:05–3:35 | **Demo (make-or-break)** |
| 5 | Business Model (fee) | 3:35–4:05 | **Tokenomics + GTM** |
| 6 | Why Blockchain | 4:05–4:30 | How it works / "why on-chain" |
| 8 | What's Next | 4:30–4:45 | Roadmap |
| 9 | Closing (Ask) | 4:45–5:00 | **Ask + thanks** |

> **Urutan bicara ≠ urutan file.** Slide 7 (demo) dinaikkan ke tengah karena demo
> adalah bagian paling menentukan. Kalau tidak mau menggeser slide, cukup **lompat
> ke aplikasi live** setelah slide 4, lalu kembali ke slide 5.

---

## Slide 1 — Hook (0:00–0:20)

**Tampil:** logo cincin, "LOVECHAIN", tagline *"Don't just say forever. Stake it on-chain."*

**Tujuan:** hentikan juri dalam 15 detik. Jangan mulai dengan "Halo, kami tim…".

**Narasi:**
> "Setiap pasangan bilang *'aku serius, aku komitmen.'* Tapi komitmen itu cuma
> kata-kata — sampai salah satu pergi, dan yang lain ditinggal tanpa konsekuensi.
> **LoveChain membuat komitmen jadi sesuatu yang bisa kamu pertaruhkan, bukan cuma
> diucapkan.** Perasaan bisa berubah; smart contract tidak."

**Catatan / gap-fix:**
- ⚠️ **Pilih SATU chain.** Slide bilang "Solana / EVM testnet", tapi produk yang
  dibangun **EVM only** dan track bootcamp ini **Optimism (OP Sepolia)**. Ucapkan:
  *"deployed di OP Sepolia."* Jangan sebut Solana — itu akan memicu pertanyaan yang
  tidak bisa kamu backup. **Ganti "Program ID …" → alamat kontrak OP Sepolia.**
- Jangan baca subtitle bulat-bulat; ucapkan hook lalu diam sebentar.

---

## Slide 2 — The Problem (0:20–1:00)

**Tampil:** 3 kartu — Putus sepihak · Ghosting · Tidak ada bukti.

**Tujuan:** buat masalah terasa **nyata dan manusiawi**, bukan abstrak.

**Narasi:**
> "Bayangkan **Dinda**. Dia dan pasangannya LDR dua tahun, sudah bahas nikah, bahkan
> patungan nabung. Suatu hari pasangannya **ghosting** — hilang, uang patungan dibawa,
> tidak ada penjelasan. Dinda tidak punya mekanisme netral apa pun untuk menagih
> kejelasan atau dananya. Ini tiga wujud masalahnya: **putus sepihak tanpa konsekuensi,
> ghosting tanpa jejak, dan komitmen yang tidak pernah tercatat atau bisa diaudit.**"

**Catatan / gap-fix (PENTING — rubrik cek ini):**
- ✅ **Sebut persona bernama** (contoh: "Dinda"), **bukan** "users". Rubrik Originality
  eksplisit: *"names a specific user persona (not 'users')"*.
- ✅ **Sebut satu angka stakes** biar terasa berbobot. Contoh yang jujur untuk demo:
  *"arisan & patungan pasangan di Indonesia nilainya jutaan rupiah, tanpa satu pun
  escrow netral yang melindunginya."* (Gunakan angka yang bisa kamu bela — jangan ngarang presisi.)

---

## Slide 3 — The Solution / Proof Stack (1:00–1:35)

**Tampil:** 5 kartu — Mutual Confirmation · Cooling Period · Evidence Hash · Challenge Bond · Witness Voting.

**Tujuan:** satu kalimat solusi + insight kenapa ini pintar.

**Narasi:**
> "LoveChain adalah **escrow komitmen hubungan**. Dua orang mengunci dana di satu smart
> contract sebagai bukti keseriusan. Kuncinya: kami **tidak berpura-pura blockchain bisa
> mendeteksi selingkuh otomatis.** Sebagai gantinya kami pakai **proof stack** lima lapis —
> kedua pihak harus setuju, ada jeda pendinginan, bukti disimpan sebagai hash, penuduh
> harus setor jaminan biar tidak asal nuduh, dan saksi terpilih yang memvoting. Gabungan
> lima lapis inilah yang membuat validasi adil tanpa oracle ajaib."

**Catatan:**
- Insight yang di-highlight juri: *"kami tidak klaim deteksi otomatis"* — ini justru
  membuat proyek terlihat **matang**, bukan naif. Tekankan.

---

## Slide 4 — How It Works (1:35–2:05)

**Tampil:** 5 langkah — Create · Accept · Lock · Prove · Release + banner "Jaring pengaman".

**Tujuan:** tunjukkan alur dana yang jelas + fakta "dana tidak pernah stuck".

**Narasi:**
> "Alurnya lima langkah: **A** menyusun kontrak — durasi, deposit, 5 saksi, aturan.
> **B** menyetujui dan menyetor jumlah yang sama; kontrak jadi aktif. Dana kedua pihak
> **terkunci**. Untuk mencairkan, salah satu mengajukan outcome plus bukti, lalu
> dikonfirmasi. Begitu **threshold** tercapai, **payout otomatis** sesuai hasil. Dan yang
> paling penting — kalau pasangan menghilang atau saksi pasif, **dana tetap bisa ditarik
> lewat timeout. Tidak pernah nyangkut.**"

**Catatan:**
- Banner "jaring pengaman" adalah jawaban untuk pertanyaan juri klasik *"kalau satu
  pihak hilang, dana ngendon selamanya?"* — sebut proaktif di sini.

---

## Slide 7 (naik ke sini) — LIVE DEMO (2:05–3:35) ⭐ **PALING MENENTUKAN**

**Tampil:** JANGAN pakai slide teks. **Buka aplikasi live di browser full-screen.**

**Tujuan:** buktikan itu benar-benar jalan. Rubrik: Technical 35% + UI/UX 20% sangat
bergantung pada demo live yang berhasil.

**Script demo 90 detik (pilih Wedding Unlock — paling "wow"):**

| Waktu | Aksi | Ucapan |
|---|---|---|
| 0:00–0:15 | Tampilkan app, wallet A sudah connect | "Ini Dinda. Dia connect wallet lewat RainbowKit. Ini kontrak yang sudah aktif." |
| 0:15–0:35 | Klik **Request Wedding Unlock**, isi proof URI, sign | "Dia ajukan bukti nikah. Cuma hash yang masuk on-chain — privasi terjaga." |
| 0:35–0:50 | Ganti ke wallet B → **Confirm wedding** | "Pasangannya konfirmasi dari wallet-nya." |
| 0:50–1:10 | 3 wallet saksi → **Approve wedding**, progress bar naik ke 3/5 | "Tiga dari lima saksi approve. Lihat — statusnya berubah jadi *Married*." |
| 1:10–1:25 | Buka **Claim page** → Claim → Withdraw | "Deposit kembali ke masing-masing, dipotong fee 0.25% — outcome terbaik, fee teringan." |
| 1:25–1:30 | Buka OP Sepolia Etherscan → tab Read Contract | "Semua yang barusan kalian lihat — terverifikasi, transparan, on-chain." |

**Pre-flight (WAJIB sebelum naik panggung):**
- [ ] App sudah ter-deploy ke **OP Sepolia** dan alamatnya sudah di-set (bukan localhost).
- [ ] Semua wallet (A, B, 3 saksi) sudah connect & ter-fund OP Sepolia ETH.
- [ ] Browser zoom 125–150%, notif Slack/WA mati, satu tab saja.
- [ ] **Punya video rekaman demo (MP4) sebagai cadangan** kalau WiFi/tx gagal.

**Kalau demo gagal:** jangan minta maaf berlebihan. "Ada delay di jaringan, sambil nunggu
saya jelaskan apa yang terjadi…" — lalu kalau perlu, putar video cadangan. **Juri lebih
menghargai tim yang recover dengan tenang daripada demo sempurna.**

**Catatan / gap-fix:**
- ⚠️ Slide 7 versi teks tetap boleh ditampilkan **sebentar** sebagai peta ("tiga jalur"),
  tapi inti nilainya ada di **menjalankan app**, bukan membaca bullet.

---

## Slide 5 — Business Model / Fee (3:35–4:05)

**Tampil:** 3 tier fee — Wedding 0.25% · Peaceful 0.5% · Breach 1%.

**Tujuan:** buktikan ini bukan "science project" — ada model pendapatan yang selaras insentif.

**Narasi:**
> "Revenue-nya dari **tiered fee**: makin baik outcome hubungannya, makin kecil fee.
> Menikah cuma 0.25%. Putus baik-baik 0.5%. Pelanggaran yang tervalidasi 1% — outcome
> yang memang ingin dicegah. Jadi fee di sini adalah **konsekuensi dari outcome buruk,
> bukan pajak atas cinta.** Insentif platform dan pasangan searah: jaga komitmen, simpan
> lebih banyak dana."

**Catatan / gap-fix (GTM — rubrik Business 25% cek ini):**
- Slide tidak punya **go-to-market**. Tambahkan secara lisan:
  > "First-100 user kami bukan iklan — tapi channel spesifik: **komunitas pasangan LDR
  > dan couple-content di TikTok/IG lokal**, plus kolaborasi dengan **event/vendor
  > pernikahan** untuk 'wedding badge' sebagai gimmick. Aktivasi = 100 kontrak dibuat
  > dalam 30 hari pertama."
- Jujur soal deterrence: *"1% terlalu kecil untuk benar-benar menahan orang putus —
  fungsinya simbolik & signaling, dan itu memang design choice, bukan jebakan finansial."*
  (Ini persis antisipasi pertanyaan juri di PRD §28.4.)

---

## Slide 6 — Why Blockchain (4:05–4:30)

**Tampil:** 3 angka — 100% transparan · 0 pihak bisa manipulasi · ∞ jejak on-chain.

**Tujuan:** jawab "kenapa tidak bikin aplikasi web biasa saja?".

**Narasi:**
> "Kenapa harus on-chain? Tiga alasan yang tidak bisa ditiru aplikasi web biasa: dana
> **100% terkunci dan terlihat**, tidak bisa ditarik sepihak. **Nol** pihak yang bisa
> memanipulasi payout — yang mengeksekusi adalah kode, bukan admin. Dan setiap aksi
> punya **jejak permanen** yang bisa diaudit siapa pun. Escrow netral tanpa perantara
> yang bisa kabur — itu justru inti masalah Dinda tadi."

**Catatan:**
- Ini jawaban langsung untuk pertanyaan juri *"kenapa blockchain?"* — hubungkan balik
  ke persona (Dinda) biar nyambung, bukan sekadar fitur.

---

## Slide 8 — What's Next (4:30–4:45)

**Tampil:** timeline MVP → Next → Later → Future.

**Tujuan:** tunjukkan visi tanpa over-promise; posisikan MVP jujur.

**Narasi:**
> "Yang kalian lihat hari ini sudah jalan: **MVP di testnet** — tiga flow inti, witness
> voting, payout otomatis, tiered fee, dan jaring pengaman timeout. Berikutnya: **witness
> reputation & staking** untuk akuntabilitas saksi. Lalu **mainnet + wrapper Web2** biar
> pasangan non-crypto bisa pakai. Kami tahu batasannya dan menyebutnya terang-terangan."

**Catatan:**
- Menyebut limitation sendiri (honor-system wedding proof, saksi belum di-stake) membuat
  tim terlihat **matang**. Rubrik menghargai kejujuran ini.

---

## Slide 9 — Closing / Ask (4:45–5:00)

**Tampil:** logo, tagline, links.

**Tujuan:** satu ask yang jelas dan mudah diingat. **Jangan** akhiri dengan "connect with us!".

**Narasi:**
> "LoveChain: **jangan cuma bilang selamanya — pertaruhkan on-chain.** Satu permintaan
> kami hari ini: **coba app-nya di [URL OP Sepolia] dan beri tahu kami di bagian mana
> yang membingungkan** — feedback UX dari kalian langsung memandu iterasi minggu depan.
> Kode-nya open-source di GitHub. Terima kasih."
> *(Diam. Berhenti bicara. Duduk.)*

**Catatan / gap-fix:**
- ⚠️ Update link: ganti `github.com/team/lovechain` → **`github.com/anwark7/lovechain`**,
  dan pastikan URL app menunjuk deployment OP Sepolia yang live saat demo.
- **Satu ask saja.** Contoh alternatif: *"kalau ada mentor ekosistem Optimism di ruangan,
  10 menit setelah sesi ini sangat berarti untuk kami."*

---

# 🧑‍⚖️ Judge Question Drill

> Latih berpasangan. Target: **setiap jawaban < 30 detik.** Enam pertanyaan pertama
> adalah daftar resmi dari materi Meet 7; sisanya spesifik LoveChain (paling sering
> ditanya untuk proyek escrow/voting).

## A. Enam pertanyaan wajib (dari materi bootcamp)

**1. "What's your CAC (biaya akuisisi user)?"**
> "Channel kami organik-dulu: couple-content lokal & komunitas LDR, plus kolaborasi
> vendor nikah. Untuk fase testnet CAC efektif mendekati nol karena distribusinya
> konten + word-of-mouth; asumsi berbayar kami cap di bawah Rp50k/user aktif saat scale."

**2. "What's your runway / model pendapatannya berkelanjutan?"**
> "Revenue = tiered fee (0.25–1%) yang terpotong otomatis saat payout, masuk ke owner
> dan ditarik lewat `withdrawFees`. Tidak ada token inflationary yang harus disubsidi —
> jadi 'runway'-nya tidak bergantung pada emisi; biaya utama kami cuma hosting + gas,
> yang di L2 sangat murah."

**3. "What stops a fork? (apa moat-nya?)"**
> "Moat-nya bukan kode — kode memang open-source. Moat-nya **jaringan saksi tepercaya
> dan reputasi** (roadmap witness-reputation): kontrak boleh di-fork, tapi kumpulan
> saksi yang kredibel dan histori dispute yang bersih tidak bisa di-copy-paste. Plus
> brand di niche 'commitment' yang spesifik."

**4. "Kenapa ini belum ada sebelumnya?"**
> "Escrow relationship pernah dicoba sebagai fitur web2, tapi selalu butuh perantara
> tepercaya yang justru bisa kabur — persis masalah yang mau dipecahkan. Baru dengan
> smart contract + L2 fee sub-sen, escrow netral tanpa perantara jadi ekonomis dan
> kredibel."

**5. "Siapa timnya?"**
> *(Sebut nama + peran + hal relevan yang pernah kalian kirim/bangun.)* "Saya [nama],
> [peran — misal smart contract]. [Nama], frontend. [Nama], produk/pitch. Kami baru saja
> mengirim MVP end-to-end ini: 63 test passing, contract + dApp jalan."

**6. "Kalau chain-nya down seminggu, dana user gimana?"**
> "Kontrak kami **non-custodial** dan pull-payment. Kalau frontend mati, user tetap bisa
> panggil `claimPayout` dan `withdraw` langsung lewat Etherscan. Dan kalaupun tidak ada
> yang bertindak, ada `claimByTimeout` — dana selalu punya jalan keluar berbasis waktu."

## B. Pertanyaan spesifik LoveChain (siapkan!)

**7. "Apa yang mencegah pasangan + saksi mereka kolusi mengklaim 'menikah' palsu untuk narik dana?"**
> "Jujur: di MVP, wedding proof adalah **honor system** — dua pihak + saksi pilihan mereka
> bisa secara teknis mengklaim. Kami menyebut ini eksplisit sebagai limitation. Mitigasi
> sekarang: saksi dipilih dari **kedua sisi** (2-2-1) sehingga tidak satu pihak memborong,
> dan semua vote tercatat publik. Mitigasi masa depan: witness **staking + slashing**."

**8. "Kalau semua saksi diam, apakah dana terkunci selamanya?"**
> "Tidak. Setiap threshold punya timeout. Breach yang tidak di-challenge otomatis valid
> setelah window; yang di-challenge tanpa 4/5 otomatis ditolak. Dan `claimByTimeout`
> membiarkan satu partner menarik depositnya setelah durasi habis — tanpa butuh siapa pun."

**9. "Kenapa deposit harus simetris? Bagaimana kalau kontribusi tidak sama?"**
> "Simetris hanya penyederhanaan MVP biar payout jelas. Data model sudah mendukung
> `depositA` ≠ `depositB`; payout asimetris ada di roadmap. Untuk demo, simetris menjaga
> cerita tetap gampang dicerna."

**10. "Ini pakai OP Sepolia atau chain lain? Kok slide sebut Solana?"**
> "EVM, deployed di **OP Sepolia**. Sebutan 'Solana' di draft slide adalah sisa brainstorm
> dan sudah kami koreksi — implementasinya murni EVM/Solidity." *(→ perbaiki slide sebelum demo.)*

**11. "Bukankah 1% terlalu kecil untuk mencegah orang putus?"**
> "Benar, dan itu disengaja. Fungsinya **simbolik & signaling**, bukan deterrence ekonomi —
> tidak ada yang mempertahankan hubungan demi hemat 1%. Yang memberi bobot nyata ada di
> **deposit split** saat breach tervalidasi, dan itu roadmap, bukan MVP."

**12. "Contract-nya aman? Sudah dites?"**
> "Ya. OpenZeppelin `ReentrancyGuard` + `Ownable`, pola **pull-payment** untuk semua
> penarikan, custom errors, dan validasi permission ketat. **63 test passing, ~97%
> statement coverage**, menutup setiap flow dan setiap revert path — termasuk konservasi
> nilai (total keluar + fee = total masuk)."

---

# ✅ Rubrik Meet 8 — Self-check (isi sebelum Demo Day)

Rubrik menilai 4 dimensi. Centang yang sudah bisa kamu buktikan; yang belum = kerjaan prioritas.

**1. Technical Execution (35%)**
- [ ] Contract **deployed** ke OP Sepolia (bukan localhost) — *saat ini masih kosong; ini prioritas #1*
- [ ] Contract **verified** di OP Sepolia Etherscan (tab Read jalan)
- [x] Test suite hijau (`63 passing`, ~97% coverage)
- [x] Pakai OpenZeppelin (`ReentrancyGuard`, `Ownable`) dengan benar
- [x] Custom errors (bukan cuma `require` string)
- [x] Tidak ada alamat kontrak hardcoded di frontend (di-resolve dari `lib/contracts`)

**2. Originality & Insight (20%)**
- [ ] Problem menyebut **persona bernama** (pakai "Dinda" di narasi)
- [x] Insight "tidak klaim deteksi otomatis" diartikulasikan
- [x] Solusi tidak mudah dibuat sebagai SaaS Web2 biasa (butuh escrow non-custodial)

**3. UI / UX (20%)**
- [x] Connect wallet pakai RainbowKit (bukan raw `window.ethereum`)
- [x] Status tx terlihat (sign / pending / confirming / success / error) via `TxFeedback`
- [ ] User bisa buka contract di Etherscan dari UI dalam ≤ 2 klik *(tambahkan link explorer di UI — quick win)*
- [ ] Sudah dicek mobile/Safari

**4. Business Viability (25%)**
- [x] Model revenue jelas (tiered fee, ter-wire ke contract)
- [ ] Channel **first-100 user** disebut (tambahkan di narasi slide 5)
- [ ] Aktivasi didefinisikan numerik ("100 kontrak dalam 30 hari")
- [x] Moat bisa dipertahankan saat ditanya (jaringan saksi + reputasi)

---

# 🔧 Daftar perbaikan cepat sebelum Demo Day (prioritas)

1. **Deploy ke OP Sepolia + verify** — ini yang paling menaikkan skor (Technical 35%).
   Tanpa ini, anchor tertinggi rubrik tidak tercapai. *(Set RPC OP Sepolia di `.env`,
   jalankan deploy script, commit alamatnya.)*
2. **Perbaiki slide 1 & 9:** hapus "Solana", ganti "Program ID" → alamat OP Sepolia,
   update link GitHub ke `github.com/anwark7/lovechain`, set URL app ke deployment live.
3. **Latih demo live 90 detik** minimal 5×, siapkan **video MP4 cadangan**.
4. **Hafalkan hook (slide 1) + ask (slide 9)** kata per kata.
5. Tambah **link explorer di UI** (≤ 2 klik ke Etherscan) — quick win untuk UI/UX.
6. Latih **12 jawaban juri** berpasangan sampai < 30 detik each.

---

*Disusun mengikuti kerangka Meet 7 (Pitching) & rubrik Meet 8 (Optimism track,
Bandung Builders). Testnet learning project — bukan nasihat finansial atau hukum.*
