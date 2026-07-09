# LoveChain Threat Model & Mitigation Strategy

Dokumen ini memetakan celah keamanan, logika bisnis (sosial dan finansial), serta strategi mitigasinya. Sangat berguna sebagai referensi untuk *Demo Day*, perbaikan *smart contract* menuju Mainnet, dan desain *Tokenomics*.

---

## 1. Kolusi Mayoritas Saksi (Pencurian Deposit)

**Problem:** 
Sistem sangat bergantung pada kejujuran 5 orang Saksi. Jika Partner A bersekongkol (atau menyogok) 4 dari 5 saksi, mereka bisa memanipulasi hasil *voting* untuk memenangkan klaim "Selingkuh" palsu. Hasilnya: Deposit B dirampok secara sah oleh A.

**Solusi / Mitigasi:**
*   **[MVP / Saat Ini] Sosial Trust:** Bergantung penuh pada pemilihan saksi di awal. Asumsinya, saksi yang disetujui bersama adalah pihak netral (misalnya: orang tua, tokoh agama, sahabat bersama).
*   **[Mainnet / Future] Witness Staking:** Saksi tidak bisa sekadar *voting* gratis. Mereka wajib mengunci sejumlah uang (misal 5-10% dari nilai kontrak). Jika *voting* mereka terbukti jahat (misal lewat proses banding ke Kleros Court), uang taruhan saksi akan di-*slash* (hangus).
*   **[Mainnet / Future] Decentralized Jury:** Mengganti saksi "teman" dengan juri acak dari jaringan terdesentralisasi yang tidak memiliki hubungan personal dengan kedua pasangan.

## 2. Griefing & Penyanderaan Dana (Hostage Situation)

**Problem:**
Pasangan sepakat putus (*Peaceful Exit*), namun Partner B sakit hati atau dendam. B sengaja tidak menekan tombol *Approve Peaceful Exit*. Akibatnya, dana Partner A tersandera dan terkunci di *smart contract* sampai durasi penuh kontrak (bisa bertahun-tahun) berakhir. B bisa memeras A di dunia nyata untuk mau menekan tombol tersebut.

**Solusi / Mitigasi:**
*   **[Mainnet / Future] Response Timeout:** Menambahkan batas waktu respon untuk pengajuan *Peaceful Exit*. Jika A mengajukan putus dan B mendiamkan pengajuan tersebut melewati masa *timeout* (misalnya 14 hari), *smart contract* akan menganggap diamnya B sebagai "Setuju" (*Auto-Approve*), dan dana langsung dicairkan 50:50.

## 3. The Oracle Problem (Kebohongan Demi Diskon Fee)

**Problem:**
Platform memiliki *fee* berjenjang (0.25% untuk menikah, 0.5% untuk putus). Ini membuka celah insentif yang salah: Pasangan yang aslinya putus bisa saja bersekongkol dan meminta saksi mengeklik "Menikah", hanya agar potongan *fee*-nya lebih murah.

**Solusi / Mitigasi:**
*   **[Mainnet / Future] Marriage Vesting:** Jika pasangan mengklaim telah menikah, dana tidak dicairkan 100% saat itu juga, melainkan masuk ke fase *vesting* (misalnya dicicil 10% setiap bulan selama setahun). Pasangan yang hanya pura-pura nikah akan enggan menunggu pencairan yang dicicil.
*   **[Mainnet / Future] ZK-Email / Real-World Oracles:** Pembuktian nikah tidak lagi lewat foto/manusia, melainkan pasangan wajib membuktikan secara kriptografi (menggunakan ZK Proofs) bahwa mereka menerima email sertifikat pernikahan resmi dari pemerintah atau institusi terkait.

## 4. Inefisiensi Modal (Opportunity Cost)

**Problem:**
Mengunci uang kripto dalam jumlah besar untuk jangka panjang (misal bertahun-tahun) di dalam *smart contract* yang statis adalah keputusan finansial yang buruk karena terkena dampak inflasi dan hilangnya *yield* (bunga) yang seharusnya bisa didapat di tempat lain (seperti bank atau Aave).

**Solusi / Mitigasi:**
*   **[Mainnet / Future] DeFi Wrapper (Yield-Bearing Escrow):** Saat uang masuk ke LoveChain, *smart contract* otomatis memutarnya di protokol *DeFi* yang aman (seperti Lido untuk *stETH* atau Aave). 
    *   Jika hubungan berujung pada pernikahan, mereka mendapatkan **Modal + Bunga**. (Insentif finansial untuk setia).
    *   Jika mereka putus, bunga disita oleh platform, namun modal awal dikembalikan.

## 5. Sybil Attack & Wash Trading (Farming)

**Problem:**
Seseorang bisa membuat banyak *wallet* fiktif, berpura-pura menjadi Pasangan A, Pasangan B, dan 5 Saksi. Mereka mendanai sendiri *wallet* tersebut dan menyetujui transaksi mereka sendiri.
*(Catatan: Saat ini hal ini tidak menguntungkan karena mereka hanya akan rugi membayar fee platform & gas).*
Namun, jika ke depannya LoveChain merilis **Token Airdrop** atau **Sistem Poin**, ini akan menjadi ladang eksploitasi (*wash trading*).

**Solusi / Mitigasi:**
*   **[Mainnet / Future] Proof of Humanity:** Integrasi dengan Coinbase Verified ID, Gitcoin Passport, atau sistem *KYC* Web3 lainnya. Hanya *wallet* ber-KTP digital yang dihitung poin/skornya.
*   **[Mainnet / Future] Syarat TVL & Durasi:** Algoritma insentif/poin tidak boleh dihitung dari "Jumlah Kontrak", tapi dari **(Total Uang Terkunci × Durasi Kunci)**. Kontrak berdurasi pendek tidak akan mendapat *reward* apa-apa.
