# LoveChain Risk Register — Implementasi, Infrastruktur & Bisnis

Dokumen ini melengkapi [`THREAT_MODEL.md`](THREAT_MODEL.md). Kalau dokumen itu memetakan
ancaman **sosial & ekonomi** pada level desain, dokumen ini memetakan celah pada level
**implementasi kode, infrastruktur, model bisnis, dan paparan etis/hukum** — hal-hal yang
hanya kelihatan setelah membaca `LoveChain.sol` baris per baris dan menelusuri *data layer*
frontend.

> **Metode:** pembacaan statis `LoveChain.sol` pada commit `87fa314` (versi yang saat ini
> ter-*deploy*) dan `packages/web`. **Tidak ada eksploit yang dieksekusi dan tidak ada tes yang
> ditulis untuk membuktikannya.** Semua temuan di bawah adalah kesimpulan dari alur kontrol —
> perlakukan yang bertanda `KRITIS`/`TINGGI` sebagai **hipotesis kuat yang wajib diverifikasi
> dengan tes**, bukan sebagai eksploit yang sudah terbukti.

---

## ⚠️ Temuan nol: dokumen ancaman kita sendiri sudah kedaluwarsa

Sebelum masuk daftar, satu hal yang membatalkan asumsi dokumen lain.

`THREAT_MODEL.md` §1 berbunyi: *"Jika Partner A bersekongkol (atau menyogok) **4 dari 5 saksi**…"*.
Itu tidak lagi benar. Kontrak yang ter-*deploy* di
`0xC98a60eAB476cEb42de0D2BB2070665f217d6d80` memuat:

```solidity
uint256 public constant MIN_WITNESS_COUNT  = 1;  // L37
uint256 public constant WEDDING_THRESHOLD  = 1;  // L41
uint256 public constant BREACH_THRESHOLD   = 1;  // L45
```

Artinya **biaya kolusi bukan 4 saksi, melainkan 1.** Seluruh analisis mitigasi di
`THREAT_MODEL.md` §1 meremehkan risikonya sekitar 4×. Ini bukan sekadar catatan kaki — ini
mengubah kesimpulan.

Diperparah oleh fakta bahwa **saksi dipilih sepenuhnya oleh Partner A** di
`createLoveContract` (L318–358). Partner B hanya boleh menerima atau menolak paket lengkapnya
lewat `acceptContract`. Jadi asumsi *"saksi yang disetujui bersama adalah pihak netral"* pada
`THREAT_MODEL.md` §1 **tidak ditegakkan oleh kode mana pun.** A memilih jurinya sendiri.

**Solusi / Mitigasi:**
*   **[Segera / Pre-Demo]** Sebutkan sendiri di panggung bahwa *threshold* diturunkan ke 1 demi
    durasi demo. Menyebut duluan tidak merugikan; ketahuan juri sangat merugikan.
*   **[Segera / Pre-Demo]** Perbarui `THREAT_MODEL.md` §1 agar mencerminkan *threshold* yang
    sebenarnya ter-*deploy*.
*   **[Mainnet / Future]** Partner B ikut meng-*commit* daftar saksi saat `acceptContract`,
    sehingga netralitas saksi benar-benar dipaksakan oleh kontrak, bukan sekadar diasumsikan.

---

# Bagian A — Celah Implementasi (Smart Contract)

## 1. Perampasan Deposit dengan Modal 1 Wei `KRITIS`

**Problem:**
Tiga kelemahan bergabung menjadi satu serangan yang bisa dieksekusi dalam **satu blok**:

1.  `raiseBreachClaim` hanya menolak `msg.value == 0` (L623). **Tidak ada bond minimum, tidak
    ada proporsi terhadap deposit.** Bond senilai **1 wei** sah.
2.  `raiseBreachClaim` langsung menetapkan `status = DISPUTED` (L640), sedangkan `voteDispute`
    hanya memeriksa `status == DISPUTED` (L669). **Tidak ada jendela wajib bagi tertuduh untuk
    memanggil `challengeBreachClaim` sebelum voting dibuka.**
3.  `BREACH_THRESHOLD = 1`, jadi satu suara setuju langsung memicu `_resolveBreach(valid=true)`
    (L686).

```text
A: raiseBreachClaim(id, "ipfs://apa-saja")  { value: 1 wei }
W: voteDispute(id, true)                     ← satu saksi kolusi (dipilih A sendiri)
→ RESOLVED / Outcome.BREACH_VALID
→ A mengklaim: deposit A + 100% deposit B + bond, dipotong fee 1%
→ B mendapat NOL, dan tidak pernah punya kesempatan menekan "Challenge"
```

`breachAwardBps` default `10_000` (100%), jadi seluruh deposit tertuduh berpindah.

Yang berbahaya: **mengembalikan *threshold* ke 4-of-5 TIDAK memperbaiki kelemahan #2.** Flag
`challenged` hanya memengaruhi jalur *timeout* (lihat §3); ia tidak pernah menjadi prasyarat
voting. Di jalur cepat, `challengeBreachClaim` praktis dekoratif.

**Solusi / Mitigasi:**
*   **[MVP / Saat Ini]** Tidak ada. Kelemahan ini aktif pada kontrak yang ter-*deploy*.
*   **[Mainnet / Future] Bond Proporsional:** Wajibkan `msg.value >= depositTertuduh * 10%`.
    Menuduh harus mahal, sebab bond adalah satu-satunya biaya menuduh secara palsu.
*   **[Mainnet / Future] Challenge Window Wajib:** Pisahkan fase. `voteDispute` hanya boleh
    dibuka **setelah** `challengeWindow` tertutup, atau setelah tertuduh secara eksplisit
    menantang. Diamnya tertuduh tidak boleh langsung berarti kalah tanpa jeda respons.

---

## 2. Dua Fungsi Resolusi Memberi Vonis Berlawanan `KRITIS`

**Problem:**
`resolveDispute` (L700–708) dan `resolveBreachByTimeout` (L729–738) sama-sama publik, dan
prasyaratnya **identik**: `status == DISPUTED` dan `block.timestamp >= claim.votingEndsAt`.
Tetapi rumusnya berbeda:

```solidity
// resolveDispute (L706)
bool valid = claim.approveVotes >= BREACH_THRESHOLD;

// resolveBreachByTimeout (L736)
bool valid = !claim.challenged || claim.approveVotes >= BREACH_THRESHOLD;
```

Ketika klaim **tidak ditantang** dan suara setuju **di bawah threshold**, keduanya bertolak
belakang:

| Fungsi yang dipanggil | Vonis |
|---|---|
| `resolveDispute` | klaim **DITOLAK** |
| `resolveBreachByTimeout` | klaim **DITERIMA** |

Maka **siapa yang mengirim transaksi lebih dulu, dialah yang menang.** Tertuduh memanggil
`resolveDispute`; penuduh memanggil `resolveBreachByTimeout`. Ini balapan gas dan sasaran MEV,
bukan proses ajudikasi. Sekaligus membatalkan aturan yang kita dokumentasikan sendiri
(*"tidak ditantang → dianggap benar"*), karena tertuduh cukup meresolusi sendiri.

**Solusi / Mitigasi:**
*   **[Segera / Pre-Demo]** Jangan pernah mendemokan jalur `resolveDispute`. Frontend sebaiknya
    hanya memanggil satu di antaranya.
*   **[Mainnet / Future] Satu Sumber Kebenaran:** Gabungkan keduanya menjadi satu fungsi
    resolusi, atau buat `resolveDispute` mendelegasikan ke predikat yang sama persis.

---

## 3. Suara "Tolak" Bisa Diabaikan Sepenuhnya `TINGGI`

**Problem:**
Pada `resolveBreachByTimeout` (L736), `claim.rejectVotes` **tidak pernah dibaca**:

```solidity
bool valid = !claim.challenged || claim.approveVotes >= BREACH_THRESHOLD;
```

Jika tertuduh tidak menekan *Challenge* — mungkin ia tertidur, sinyalnya putus, atau
transaksinya gagal — maka **tiga saksi boleh memilih "tolak", nol memilih "setuju", dan klaim
tetap DITERIMA.** Vonis bulat para saksi dibuang begitu saja.

Diperparah `voteDispute` (L688):

```solidity
} else if (claim.rejectVotes > WITNESS_COUNT - BREACH_THRESHOLD) {
```

`WITNESS_COUNT` adalah konstanta global `5` (L32), **bukan jumlah saksi pada deal tersebut**
(yang kini boleh 1–5). Dengan `BREACH_THRESHOLD = 1`, syaratnya menjadi `rejectVotes > 4` —
praktis mati. Pada deal dengan 2 saksi, keduanya menolak menghasilkan `2 > 4 == false`,
resolusi awal tidak pernah terpicu, lalu jatuh ke jalur *timeout* yang membuang suara mereka.

**Solusi / Mitigasi:**
*   **[Mainnet / Future] Threshold Per-Deal:** Baca `_witnesses[contractId].length`, jangan
    konstanta global. Semua ambang batas harus diturunkan dari jumlah saksi deal itu sendiri.
*   **[Mainnet / Future] Predikat yang Menimbang Penolakan:** Vonis *timeout* harus
    memperhitungkan `rejectVotes`. Diamnya tertuduh tidak boleh mengalahkan suara saksi yang
    aktif menolak.

---

## 4. Owner Dapat Membuat Kontrak Insolven `TINGGI`

**Problem:**
`_entitlement` membaca `breachAwardBps` (L163) **pada saat klaim** (L854), bukan pada saat
resolusi. `setBreachAwardBps` (L285) bisa dipanggil owner kapan saja. Sementara itu
`pendingWithdrawals` (L151) adalah **buku besar global lintas semua deal**.

Kedua partner mengklaim di transaksi terpisah. Jika `breachAwardBps` berubah di antaranya,
kedua pembayaran dihitung dengan aturan berbeda dan tidak lagi berjumlah sama dengan deposit
deal tersebut. Dengan deposit simetris `D` dan bond `B` (kontrak memegang `2D + B`):

```text
bps = 10_000 → penuduh klaim:  gross = D + D + B = 2D + B    (kewajiban: 2D + B)
owner memanggil setBreachAwardBps(0)
bps =      0 → tertuduh klaim: award = 0 → remainder = D     (kewajiban: 3D + B)
```

Kontrak kini berutang `3D + B` tetapi hanya memegang `2D + B`. Karena `withdraw()` menarik dari
satu kolam global, kekurangan `D` **dibayar dari deposit pasangan lain**, siapa cepat dia
dapat. Pengguna terakhir tidak bisa menarik dananya.

Ini **tidak harus berupa niat jahat.** Owner yang secara sah menyetel ulang `breachAwardBps`
sementara ada deal lama yang sudah *resolved* tapi belum diklaim akan memicu lubang akuntansi
yang sama. Tes konservasi nilai yang ada tidak menangkapnya karena selalu memakai `bps` konstan.

Faktor pemberat: owner adalah **satu EOA tunggal**, tanpa *multisig* dan tanpa *timelock*.

**Solusi / Mitigasi:**
*   **[Mainnet / Future] Snapshot Parameter:** Simpan `breachAwardBps` yang berlaku ke dalam
    struct `BreachClaim` saat `raiseBreachClaim`, lalu baca *snapshot* itu di `_entitlement`.
    Parameter ekonomi tidak boleh berubah di tengah siklus hidup sebuah klaim.
*   **[Mainnet / Future] Governance:** Owner di balik *multisig* + *timelock*, dan tambahkan
    `pause`.
*   **[Mainnet / Future] Tes Invarian:** Tambahkan tes properti bahwa total kredit sebuah deal
    tidak pernah melebihi total dana yang masuk ke deal itu, di bawah `bps` yang berubah-ubah.

---

## 5. Bug Laten: Deposit Asimetris Akan Merusak Akuntansi `SEDANG`

**Problem:**
Di `_entitlement` (L853–864), `own`/`other` bersifat relatif terhadap `who`:

```solidity
uint256 award = (other * breachAwardBps) / BPS_DENOMINATOR;
if (who == claim.claimant) {
    uint256 gross = own + award + claim.bondAmount;   // `other` = deposit tertuduh ✅
} else {
    uint256 remainder = other - award;                // `other` = deposit PENUDUH ❌
}
```

Pada cabang tertuduh, `other` justru berarti deposit **penuduh**. Sisa hak tertuduh dihitung
dari setoran orang lain. Seharusnya `own - award(own)`.

Hari ini bug ini **tidak terlihat** semata-mata karena `acceptContract` memaksa
`msg.value == c.depositA` (L368), sehingga `own == other` selalu. Namun README mencantumkan
**deposit asimetris sebagai *future work*** — begitu itu dirilis, pembayaran menjadi salah, dan
jika deposit penuduh lebih besar dari deposit tertuduh, kontrak menjadi insolven.

Satu variabel yang membawa dua makna berbeda di dua cabang adalah bau kodenya. Perbaiki
sebelum ia berubah menjadi kerugian.

**Solusi / Mitigasi:**
*   **[Mainnet / Future]** Ubah menjadi `remainder = own - (own * breachAwardBps) / BPS_DENOMINATOR;`
    dan tambahkan tes untuk deposit asimetris **sebelum** fitur itu dibuka.

---

## 6. Jendela Wedding Dibaca Live — Owner Bisa Membatalkan Semua Pernikahan `SEDANG`

**Problem:**
`_requireWeddingWindowOpen` (L540) membaca `weddingWindow` langsung dari *storage*:

```solidity
if (block.timestamp >= c.weddingRequestedAt + weddingWindow) revert WindowClosed();
```

Owner yang memanggil `setWindows(_, _, 0)` seketika menutup jendela pernikahan pada **seluruh
deal yang sedang berjalan**, membuat `confirmWedding` dan `voteWedding` *revert*, dan
`expireWeddingRequest` langsung bisa dipanggil siapa saja.

Bandingkan: `coolingPeriod` dan `challengePeriod` sudah benar — keduanya di-*snapshot* ke
`coolingEndsAt` (L588) dan `votingEndsAt` (L633) saat alurnya dimulai. `weddingWindow` adalah
satu-satunya yang tidak mengikuti pola itu.

**Solusi / Mitigasi:**
*   **[Mainnet / Future]** *Snapshot* `weddingEndsAt` pada `requestWeddingUnlock`, persis seperti
    dua jendela lainnya.

---

## 7. Temuan Ringan `RENDAH`

**Problem:**
*   `withdrawFees(to)` (L815) tidak memvalidasi `to != address(0)` — seluruh fee bisa dibakar
    permanen oleh satu salah ketik.
*   Event `Funded` (L212) dideklarasikan tapi tidak pernah di-*emit* (kode mati).
*   Penuduh membayar fee 1% atas **bond-nya sendiri** yang dikembalikan (L858). Bond adalah
    jaminan, bukan kemenangan.
*   **Tidak ada `pause`, tidak ada jalur *upgrade*.** Kontrak *immutable*. Jika §1 atau §2
    ditemukan setelah *deploy* nyata, tidak ada rem. `claimByTimeout` menyelamatkan sebagian
    besar state yang **macet**, tetapi tidak ada yang menyelamatkan state yang **salah divonis**.
*   Tidak ada `receive()`/`fallback()`, sehingga ETH yang dipaksa masuk (via `selfdestruct`)
    tidak terlacak dan tersangkut permanen — akuntansi tidak pernah direkonsiliasi terhadap
    `address(this).balance`.

**Solusi / Mitigasi:**
*   **[Mainnet / Future]** Validasi alamat nol, hapus kode mati, kecualikan bond dari basis fee,
    dan tambahkan `Pausable` sebelum menyentuh dana bernilai nyata.

---

# Bagian B — Infrastruktur & Operasional

## 8. Dokumentasi Menunjuk Kontrak yang Salah `TINGGI (Reputasi)`

**Problem:**
README menyebut alamat *live* `0x048E3bfC22A44540c3DAE3Eb14082b185eE4a949`. Itu benar pada
commit `b21caaf`, tetapi commit `87fa314` melakukan **redeploy** dan `addresses.ts` — satu-satunya
sumber yang benar-benar dibaca frontend — kini berisi
`0xC98a60eAB476cEb42de0D2BB2070665f217d6d80`. README tidak pernah ikut diperbarui.

Juri yang mengklik tautan explorer di README akan melihat kontrak yang berbeda dari yang
didemokan.

**Solusi / Mitigasi:**
*   **[Segera / Pre-Demo]** Perbarui alamat di README.
*   **[Mainnet / Future]** Jadikan alamat di README *generated* dari `deployments/*.json`, jangan
    ditulis tangan. Pola ini sudah dipakai untuk ABI (`writeAbi.ts`) — cukup diperluas.

---

## 9. UI Menyatakan Aturan yang Tidak Ditegakkan Rantai `TINGGI (Reputasi)`

**Problem:**
Tiga permukaan menyimpan angka yang sama, dan ketiganya boleh melenceng sendiri-sendiri tanpa
ada yang menguji hubungannya:

| | Niat produksi (README & UI) | Yang benar-benar ter-*deploy* |
|---|---|---|
| Jumlah saksi | tepat 5 | 1–5 |
| Wedding threshold | 3 dari 5 | **1** |
| Breach threshold | 4 dari 5 | **1** |

`packages/web/src/constants/contract.ts` masih meng-*export* `WEDDING_THRESHOLD = 3` dan
`BREACH_THRESHOLD = 4` untuk keperluan tampilan. **Artinya UI memberi tahu pengguna sebuah aturan
yang tidak ditegakkan oleh rantai.**

**Solusi / Mitigasi:**
*   **[Segera / Pre-Demo]** Umumkan sendiri di awal presentasi.
*   **[Mainnet / Future]** Baca *threshold* dari kontrak (`WEDDING_THRESHOLD()` dan
    `BREACH_THRESHOLD()` sudah `public constant`, jadi ada *getter*-nya), jangan hardcode di
    frontend. Tambahkan tes yang menegaskan ketiga permukaan sepakat.

---

## 10. Postur RPC Rapuh & Pengambilan Data O(n) `SEDANG`

**Problem:**
`hardhat.config.ts` jatuh ke *endpoint* publik `https://sepolia.optimism.io` bila
`OP_SEPOLIA_RPC_URL` kosong, dan frontend tidak punya *provider* berkunci secara default.
*Endpoint* publik OP Sepolia melakukan *rate-limit* dengan agresif.

Lebih buruk, `DealsList` mengambil **seluruh deal di rantai**, lalu menyaringnya di sisi klien:

```ts
const ids = Array.from({ length: total }, (_, i) => BigInt(total - 1 - i));
// …satu <DealCard id={id} mineOnly /> per id; tiap kartu membaca deal-nya sendiri
```

`total` adalah `nextContractId` — jumlah **global**, bukan jumlah milik pengguna. Setiap
`DealCard` melakukan pembacaannya sendiri, dan `useDeal` melakukan *polling* **empat panggilan
`view` setiap 8 detik** (`getContract`, `getWitnesses`, `getClaim`, `getRules`).

Akibatnya:
*   **Biayanya O(total deal), bukan O(deal saya).** Pada 50 deal di rantai, peramban setiap
    pengunjung menahan ~50 *round-trip* per 8 detik, selamanya, bahkan jika ia tidak memiliki
    satu deal pun.
*   **Filter "deal saya" hanyalah kosmetik.** Semua deal tetap diambil sebelum disembunyikan.
*   **Tidak ada *backoff*, tidak ada penanganan galat *rate-limit*.** RPC yang di-*throttle*
    berubah menjadi kartu yang basi secara diam-diam.

**Solusi / Mitigasi:**
*   **[Segera / Pre-Demo]** Pakai RPC berkunci (Alchemy/Infura). Pra-buat deal dan pra-danai
    semua *wallet* sebelum naik panggung. Siapkan `hardhat node` lokal sebagai cadangan dan
    rekaman video sebagai jaring pengaman terakhir.
*   **[Mainnet / Future] Indexer:** Bangun *subgraph* atas event `ContractCreated` yang diindeks
    berdasarkan `partnerA`/`partnerB`. Kontrak sudah meng-*emit* event yang kaya, tapi tidak ada
    yang mengonsumsinya — seluruh riwayat direkonstruksi dari panggilan `view` yang mahal.
*   **[Mainnet / Future]** Atau tambahkan indeks on-chain `getContractsByPartner(address)`.

---

## 11. Cakupan Dompet Bersyarat `RENDAH`

**Problem:**
`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` bersifat opsional. Tanpanya, hanya dompet *injected*
(MetaMask desktop) yang bisa terhubung — dompet mobile gagal secara diam-diam.

**Solusi / Mitigasi:**
*   **[Segera / Pre-Demo]** Setel variabel itu bila ada dompet mobile dalam skenario demo.

---

# Bagian C — Model Bisnis & Ekonomi

## 12. Sinyalnya Tidak Mahal, Jadi Ia Tidak Menyinyalkan Apa-apa `FUNDAMENTAL`

**Problem:**
Teori *costly signalling* hanya bekerja bila sinyalnya **menyakitkan**. Di sini deposit
dikembalikan dikurangi ≤1%. Biaya sesungguhnya hanyalah *opportunity cost* dari modal yang
menganggur — dan itu mendekati nol bagi orang yang punya likuiditas berlebih, yaitu justru orang
yang paling sanggup menyetor deposit besar.

Untuk memperkuat sinyalnya, dana harus benar-benar hangus. Tapi itu produk yang lebih buruk.
**Mekanismenya bertentangan dengan premisnya sendiri.**

Catatan: mitigasi *DeFi Wrapper* pada `THREAT_MODEL.md` §4 sebenarnya **memperburuk** hal ini —
menambahkan *yield* membuat biaya mengunci dana menjadi negatif, sehingga sinyal komitmennya
semakin lemah. Yang menarik, §4 juga mengusulkan menyita bunga saat putus; **itulah** sinyal yang
sesungguhnya, bukan pokoknya.

**Solusi / Mitigasi:**
*   **[Mainnet / Future]** Terima bahwa yang bernilai adalah **selisih hasil antar-outcome**, bukan
    besarnya deposit. Rancang agar putus benar-benar terasa mahal secara relatif (bunga disita,
    fee berjenjang tajam), bukan sekadar mengunci nominal besar.

---

## 13. Unit Economics Tidak Tertutup `FUNDAMENTAL`

**Problem:**
Deal senilai $1.000 yang terkunci dua tahun menghasilkan **$2,50–$10** fee, **sekali**, di akhir
hubungan. Sementara:

*   CAC produk *consumer fintech* berkisar puluhan hingga ratusan dolar.
*   Satu audit profesional — wajib sebelum menyentuh uang nyata — berharga $30k–$100k.

Tidak ada volume yang masuk akal di mana 25–100 bps atas TVL yang jarang berputar bisa menutupi
keduanya.

Lebih jauh, **churn adalah fitur bawaan desain**: jalur bahagia (*Wedding Unlock*) **mengakhiri
kontrak**. Keberhasilan produk menghapus penggunanya. Tidak ada *retention loop*, tidak ada
*expansion revenue*, dan kohort paling aktif adalah yang sedang menuju sengketa.

**Solusi / Mitigasi:**
*   **[Mainnet / Future]** *Marriage Vesting* (`THREAT_MODEL.md` §3) kebetulan juga memperbaiki
    ini: dana yang ter-*vesting* memperpanjang TVL dan menciptakan alasan untuk kembali.
*   **[Mainnet / Future]** Model pendapatan berbasis *yield* (ambil sebagian bunga), bukan berbasis
    *fee* atas peristiwa yang terjadi sekali seumur hubungan.

---

## 14. Friksi Onboarding Bersifat Perkalian `TINGGI (Adopsi)`

**Problem:**
Satu deal membutuhkan dua partner **ditambah satu hingga lima saksi**, masing-masing harus punya
dompet, punya gas, dan bersedia menandatangani transaksi tentang hubungan orang lain. **Saksi
tidak dibayar apa pun.**

Ini bukan *viral loop* — ini pajak sosial yang ditagihkan kepada teman-teman pengguna. Tingkat
konversinya mendekati nol.

Pasar yang dapat dijangkau adalah irisan dari dua himpunan yang sama-sama kecil: orang yang mau
menitipkan uang sebagai ungkapan cinta, dan orang yang nyaman dengan *seed phrase*. Irisan itu
tipis, dan condong ke demografi yang hubungannya bukan hubungan yang produk ini klaim lindungi.

Setiap alternatif non-kripto mengungguli produk ini: rekening bersama, aplikasi tabungan tujuan,
atau perjanjian pranikah sungguhan — lebih murah, tanpa gas, tidak menuntut siapa pun memasang
perangkat lunak, dan **bisa ditegakkan secara hukum**.

**Solusi / Mitigasi:**
*   **[Mainnet / Future]** Beri insentif kepada saksi (bagian kecil dari fee), atau hapus peran
    saksi dari jalur bahagia sepenuhnya — hanya libatkan mereka saat sengketa benar-benar terjadi.
*   **[Mainnet / Future]** *Account abstraction* + *gas sponsorship* agar saksi tidak perlu punya
    ETH sama sekali.

---

# Bagian D — Etika, Privasi & Hukum

## 15. Produk Ini Adalah Instrumen Kekerasan Finansial yang Kredibel `KRITIS (Etis)`

**Problem:**
Ini bukan *bug*. Sifat ini mengalir langsung dari desain, dan tidak ada tambalan yang
menghilangkannya. `THREAT_MODEL.md` §2 sudah menyentuh *"penyanderaan dana"*, tetapi berhenti
pada kerugian finansial. Masalahnya lebih dalam.

Baca ulang seluruh fitur dari sudut pandang pasangan yang manipulatif:

*   Ia mengunci uang pasangannya.
*   **Keluar secara sepihak tidak mungkin.** `requestPeacefulExit` membutuhkan persetujuan pihak
    lain. Satu-satunya jalan keluar sendirian adalah `claimByTimeout` (L748), yang dijaga oleh
    `block.timestamp >= c.activatedAt + c.duration` — **seluruh masa kontrak**, yang bisa berarti
    bertahun-tahun.
*   **Ia memilih seluruh saksi** (L318–358).
*   Ia dapat menuduh dengan bond **1 wei** dan, dengan satu saksi kolusi, mengambil **100%**
    deposit korban (§1) sebelum korban sempat menantang.

Invarian *"dana tidak pernah tersangkut permanen"* itu nyata dan berharga, tetapi ia **bukan**
klaim yang sama dengan *"korban bisa pergi hari ini."* Sistem ini menyerahkan kepada pembuat
kontrak sebuah mekanisme untuk menyandera uang pasangannya lalu menyitanya — dibungkus legitimasi
*"kan kita berdua sudah sepakat di blockchain."*

**Solusi / Mitigasi:**
*   **[Segera / Pre-Demo]** Jangan pernah mengucapkan *"trustless"*, *"aman"*, atau *"mengikat
    secara hukum."* Katakan: *"escrow yang diarbitrase saksi, proyek pembelajaran di testnet."*
    Ketiga kata itu bisa dipatahkan di tempat.
*   **[Mainnet / Future] Unilateral Exit with Penalty:** **Perubahan paling penting untuk keselamatan
    pengguna.** Salah satu pihak harus bisa keluar kapan saja secara sepihak dengan menanggung
    penalti, bukan menunggu habisnya masa kontrak. Bandingkan dengan usulan *Auto-Approve* di
    `THREAT_MODEL.md` §2 — itu langkah ke arah yang benar, tetapi masih menuntut korban menunggu
    *timeout*.
*   **[Mainnet / Future]** Batasi `breachAwardBps` jauh di bawah 100%. Menjadikan seluruh deposit
    pasangan sebagai hadiah menjadikan tuduhan sebagai senjata.

---

## 16. Privasi Bersifat Permanen dan Tidak Dapat Dicabut `TINGGI (Etis/Hukum)`

**Problem:**
Perpisahan, tuduhan perselingkuhan, dan penunjuk `evidenceURI` ditulis ke buku besar publik yang
*immutable*, terikat pada alamat yang rutin di-*deanonimisasi* oleh analitik rantai. Hak untuk
dilupakan (GDPR) mustahil diimplementasikan secara konstruksi.

Dan bila `evidenceURI` suatu saat menunjuk bukti sungguhan — tangkapan layar, pesan, gambar — yang
di-*pin* di IPFS, maka kita baru saja membangun infrastruktur tahan-sensor untuk *revenge porn*.
Menyimpan hanya URI/hash di rantai **tidak menolong** begitu targetnya sudah di-*pin* dan
penunjuknya permanen.

**Solusi / Mitigasi:**
*   **[Mainnet / Future]** Simpan hanya *commitment* terenkripsi yang hanya bisa dibuka oleh juri
    saat sengketa aktif, bukan URI publik. Pertimbangkan bukti ZK atas properti bukti, alih-alih
    buktinya itu sendiri.

---

## 17. Paparan Hukum `TINGGI (Hukum)`

**Problem:**
*   Menahan dana pihak ketiga sambil menunggu suatu kondisi umumnya tergolong **escrow atau
    *money transmission***, dan diatur dengan lisensi di sebagian besar yurisdiksi.
*   Perjanjian sejenis pranikah menuntut formalitas — tertulis, notaris, penasihat hukum
    independen — yang tidak dapat dipenuhi produk ini. **Ia tidak memiliki kekuatan hukum apa pun.**
*   Menempelkan imbalan finansial pada hasil suatu peristiwa pribadi dapat ditafsirkan sebagai
    **perjudian** di beberapa yurisdiksi.

**Solusi / Mitigasi:**
*   **[MVP / Saat Ini]** Pertahankan status *testnet-only* dan pernyataan penyangkalan yang sudah ada
    di README. Itu sudah tepat — jangan dilonggarkan.
*   **[Mainnet / Future]** **Jangan pernah** memegang dana non-testnet tanpa penasihat hukum.

---

# Lampiran — Apa yang Justru Sudah Dibangun dengan Baik

Perlu dinyatakan terang-terangan, sebab ini nyata:

*   ***Pull-payment* yang benar.** `claimPayout` hanya mengkredit buku besar; `withdraw()` menolkan
    saldo **sebelum** panggilan eksternal, di bawah `nonReentrant`. Ini *checks-effects-interactions*
    sesuai buku teks.
*   **`Outcome` disimpan berdampingan dengan `ContractStatus`.** Menyadari bahwa beberapa *outcome*
    runtuh menjadi `RESOLVED` namun menuntut matematika pembayaran yang berbeda — lalu memodelkannya
    secara eksplisit alih-alih menyimpulkan pembayaran dari status — adalah keputusan matang yang
    sering salah bahkan di basis kode yang jauh lebih berpengalaman.
*   ***Fallback* berbasis waktu di setiap gerbang.** `expireWeddingRequest`, `finalizePeacefulExit`,
    `resolveBreachByTimeout`, `claimByTimeout`. Invariannya dinyatakan, dirancang, dan dipegang.
*   **ABI tidak mungkin *drift*.** `writeAbi.ts` meregenerasi `loveChainAbi.ts` dari artefak setiap
    kali *deploy*, sehingga frontend **dihasilkan dari** kontrak, bukan disinkronkan manual. Ini
    menghapus satu kelas bug sepenuhnya.
*   ***Custom errors*** di seluruh kontrak, dan suite tes 63 kasus dengan cakupan ~97%, tersusun satu
    berkas per konsep.

Kegagalan di atas adalah kegagalan **imajinasi adversarial**, bukan kegagalan keterampilan. Kodenya
dibuat dengan rapi; ia hanya dirancang untuk pengguna yang kooperatif.

---

# Lampiran — Urutan Perbaikan

**Sebelum ini disebut apa pun selain proyek pembelajaran:**

1.  Gabungkan `resolveDispute` dan `resolveBreachByTimeout` menjadi satu predikat (§2).
2.  Buka voting hanya setelah *challenge window* wajib tertutup, dan wajibkan bond proporsional (§1).
3.  Turunkan *threshold* dari jumlah saksi deal itu sendiri (§3); timbang `rejectVotes` (§3).
4.  *Snapshot* `breachAwardBps` saat klaim dibuat (§4) dan `weddingEndsAt` saat wedding diminta (§6).
5.  Perbaiki `remainder` tertuduh agar diturunkan dari depositnya sendiri (§5), **sebelum** deposit
    asimetris dirilis.
6.  Ketatkan kembali *threshold*, lalu perbarui kontrak, konstanta tampilan, dan README dalam satu
    commit. Tambahkan tes yang menegaskan ketiganya sepakat (§9).

**Sebelum menyentuh nilai yang berarti:**

7.  Partner B ikut meng-*commit* daftar saksi pada `acceptContract` (Temuan nol).
8.  *Stake* para saksi, atau hentikan klaim bahwa voting bersifat *trust-minimised*.
9.  *Unilateral exit with penalty*, tersedia kapan saja — **perubahan tunggal terpenting untuk
    keselamatan pengguna** (§15).
10. Owner di balik *multisig* dan *timelock*; tambahkan `pause` (§4, §7).
11. Audit independen.

**Jangan pernah, tanpa penasihat hukum:** memegang dana non-testnet (§17).
