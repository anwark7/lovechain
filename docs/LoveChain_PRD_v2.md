# Product Requirements Document (PRD)
# LoveChain — Proof of Commitment, Not Just Proof of Love

**Version:** 2.0  
**Owner:** Wildan & Team  
**Project Type:** Blockchain dApp / Learning Project  
**Status:** Draft for Team Discussion  

> **Changelog v2.0:** Menambahkan Tiered Fee Model (Section 28), Witness Accountability (Section 29), Deadlock & Timeout Handling (Section 30), Unilateral Timeout Withdrawal (Section 31), Cancel Flow (Section 32), dan Known Limitations (Section 33). Menyesuaikan Payout Rules (Section 14), Data Model (Section 13), Smart Contract Functions (Section 12), dan States (Section 11) agar konsisten dengan gap yang teridentifikasi. Tidak ada konten v1.0 yang dihapus — hanya ditambah/diperjelas.

---

## 1. Product Summary

**LoveChain** adalah Web3 relationship commitment escrow, yaitu platform tempat dua orang yang sedang berkomitmen dalam hubungan dapat mengunci dana bersama di smart contract sebagai simbol keseriusan.

Dana tersebut tidak bisa ditarik sepihak. Dana hanya dapat dicairkan melalui beberapa kondisi yang sudah disepakati sejak awal, yaitu:

1. **Wedding Unlock** — hubungan berhasil sampai menikah.
2. **Peaceful Exit** — pasangan sepakat mengakhiri hubungan secara baik-baik.
3. **Breach Resolution** — terjadi pelanggaran komitmen, seperti ghosting, tuduhan perselingkuhan yang divalidasi, atau pelanggaran aturan yang disepakati.

LoveChain tidak bertujuan menjadi aplikasi yang “mendeteksi selingkuh secara otomatis”. Fokus utamanya adalah membuat komitmen hubungan menjadi lebih transparan, terukur, dan memiliki konsekuensi melalui smart contract.

---

## 2. Background & Problem

Dalam hubungan, komitmen sering kali hanya berbasis ucapan dan kepercayaan personal. Ketika terjadi masalah seperti ghosting, putus sepihak, atau pelanggaran komitmen, tidak ada mekanisme netral yang bisa mengatur konsekuensi secara transparan.

Di sisi lain, blockchain cocok untuk kasus yang membutuhkan:

- Dana yang dikunci secara transparan.
- Aturan payout yang tidak bisa dimanipulasi sepihak.
- Riwayat aksi yang tercatat on-chain.
- Mekanisme dispute yang terbuka dan dapat diaudit.

LoveChain mencoba membungkus konsep serius ini dalam bentuk project yang fun, relatable, dan cocok untuk pembelajaran smart contract.

---

## 3. Product Vision

Menjadi eksperimen Web3 yang mengubah komitmen hubungan menjadi kontrak sosial berbasis smart contract, dengan mekanisme escrow, evidence, witness, dan dispute resolution.

---

## 4. Product Goals

### 4.1 Goals

- Membuat dApp sederhana untuk membuat kontrak komitmen antar dua wallet.
- Mengunci dana pasangan di smart contract.
- Menyediakan beberapa mekanisme pencairan dana berdasarkan kondisi hubungan.
- Mengimplementasikan konsep escrow, dispute, voting, evidence hash, dan payout.
- Membuat project yang fun tetapi tetap memiliki konsep blockchain yang masuk akal.

### 4.2 Non-Goals

- Tidak membuat aplikasi legal untuk perjanjian hubungan nyata.
- Tidak memverifikasi pernikahan secara resmi ke database pemerintah.
- Tidak mendeteksi perselingkuhan secara otomatis.
- Tidak menyimpan bukti sensitif secara langsung di blockchain.
- Tidak mengelola dana asli dalam versi MVP; disarankan menggunakan testnet.

---

## 5. Target Users

### 5.1 Primary Users

**Couple / Pasangan**  
Dua orang yang ingin membuat kontrak komitmen dan mengunci dana bersama.

### 5.2 Secondary Users

**Witness / Saksi**  
Orang-orang yang dipilih pasangan untuk membantu validasi jika terjadi klaim atau dispute.

**Verifier / Arbiter**  
Pihak yang membantu memvalidasi bukti tertentu, terutama untuk kondisi seperti pernikahan atau dispute berat.

---

## 6. Key Concept

LoveChain menggunakan pendekatan **Proof Stack**, yaitu kombinasi beberapa metode validasi:

1. **Mutual Confirmation**  
   Kondisi valid jika kedua pihak menyetujui aksi tertentu.

2. **Cooling Period**  
   Ada jeda waktu sebelum dana benar-benar dicairkan untuk memberi kesempatan challenge.

3. **Evidence Hash**  
   Bukti disimpan off-chain, sedangkan hash atau link IPFS disimpan on-chain.

4. **Challenge Bond**  
   Pihak yang membuat tuduhan harus menyetor bond tambahan agar tidak asal menuduh.

5. **Witness Voting**  
   Saksi yang dipilih sejak awal dapat melakukan voting untuk menentukan valid/tidaknya suatu klaim.

---

## 7. User Flow

### 7.1 Create Love Contract

1. User A connect wallet.
2. User A memasukkan wallet address User B.
3. User A menentukan:
   - Durasi kontrak.
   - Jumlah deposit.
   - Aturan komitmen.
   - Daftar witness.
   - Skema payout.
4. User A membuat kontrak.
5. User B menerima invitation.
6. User B menyetujui kontrak dan deposit dana.
7. Kontrak menjadi aktif.

---

### 7.2 Wedding Unlock

Kondisi ini terjadi ketika pasangan berhasil sampai menikah.

Flow:

1. User A mengajukan Wedding Unlock.
2. User A mengunggah bukti pernikahan secara off-chain.
3. Hash atau link bukti disimpan ke smart contract.
4. User B melakukan konfirmasi.
5. Witness/verifier memberikan approval.
6. Jika threshold approval tercapai, dana dapat dicairkan.
7. Sistem mint NFT atau badge “Wedding Unlock”.

Rule MVP:

- Harus ada konfirmasi dari kedua pasangan.
- Minimal 3 dari 5 witness menyetujui.
- Dana dikembalikan ke masing-masing pihak.
- Reward/yield dapat disimulasikan untuk versi demo.

---

### 7.3 Peaceful Exit

Kondisi ini terjadi ketika pasangan sepakat mengakhiri hubungan secara baik-baik.

Flow:

1. User A request Peaceful Exit.
2. User B approve request.
3. Contract masuk cooling period.
4. Jika tidak ada dispute selama cooling period, dana cair sesuai aturan.

Rule MVP:

- Harus disetujui oleh kedua pihak.
- Cooling period: 3 hari, atau bisa dipercepat untuk demo menjadi 3 menit.
- Jika tidak ada dispute, dana dikembalikan 50:50 atau sesuai deposit masing-masing.

---

### 7.4 Breach Resolution

Kondisi ini terjadi ketika salah satu pihak mengklaim ada pelanggaran komitmen.

Contoh pelanggaran:

- Ghosting lebih dari periode tertentu.
- Putus sepihak sebelum durasi kontrak selesai.
- Tidak melakukan check-in berkala.
- Klaim adanya pelanggaran hubungan berdasarkan bukti.
- Tuduhan palsu terhadap pasangan.

Flow:

1. User A membuat breach claim terhadap User B.
2. User A menyetor challenge bond.
3. User A mengunggah bukti ke storage off-chain.
4. Hash/link bukti disimpan di smart contract.
5. User B memiliki waktu untuk challenge.
6. Jika User B tidak challenge, klaim dianggap valid setelah challenge period.
7. Jika User B challenge, witness melakukan voting.
8. Jika voting menerima klaim, dana pihak yang melanggar diberikan ke pihak yang dirugikan.
9. Jika voting menolak klaim, challenge bond milik penuduh dapat diberikan sebagai kompensasi.

Rule MVP:

- Breach claim wajib menyertakan evidence hash.
- Breach claim wajib menyetor challenge bond.
- User tertuduh memiliki challenge period.
- Minimal 4 dari 5 witness harus menyetujui agar breach dianggap valid.

---

## 8. Relationship SLA

Agar konsep “selingkuh” tidak terlalu ambigu, LoveChain menggunakan pendekatan **Relationship SLA**, yaitu aturan hubungan yang disepakati di awal dan lebih mudah divalidasi.

Contoh Relationship SLA:

| Rule | Description | Validation Method |
|---|---|---|
| Weekly Check-in | Kedua pihak harus check-in berkala | On-chain check-in |
| No Ghosting | Tidak boleh menghilang lebih dari X hari | On-chain activity |
| No Unilateral Exit | Tidak boleh keluar sepihak sebelum kontrak selesai | Contract state |
| Marriage Goal | Hubungan berhasil jika menikah | Mutual confirmation + witness |
| Breach Claim | Klaim pelanggaran hubungan | Evidence + challenge + voting |

---

## 9. MVP Scope

### 9.1 Must Have

- Connect wallet.
- Create Love Contract.
- Accept Love Contract.
- Deposit commitment fund.
- View active contract.
- Weekly check-in.
- Request Wedding Unlock.
- Submit proof hash/link.
- Request Peaceful Exit.
- Raise Breach Claim.
- Submit evidence hash/link.
- Challenge claim.
- Witness voting.
- Automatic payout based on result.

### 9.2 Should Have

- NFT/badge after successful Wedding Unlock.
- Contract timeline/history.
- UI status indicator.
- Countdown for contract duration, cooling period, and challenge period.

### 9.3 Could Have

- Leaderboard of longest commitment.
- Love Score.
- Reputation score for witnesses.
- Simulated yield reward.
- zkTLS/web proof integration.
- Decentralized arbitration integration.

### 9.4 Won’t Have for MVP

- Real Kemenag/database marriage verification.
- Real dating app verification.
- AI cheating detection.
- Automatic screenshot verification.
- Real yield farming integration.
- Real legal enforceability.

---

## 10. Functional Requirements

### 10.1 Wallet Connection

Users must be able to connect their wallet through the frontend.

Acceptance Criteria:

- User can connect wallet.
- System displays wallet address.
- User cannot create contract before wallet is connected.

---

### 10.2 Create Contract

User A can create a Love Contract and invite User B.

Required inputs:

- Partner wallet address.
- Deposit amount.
- Contract duration.
- List of witnesses.
- Selected relationship rules.

Acceptance Criteria:

- Contract is created on-chain.
- Contract status is `PENDING_PARTNER`.
- Partner can see and accept contract.

---

### 10.3 Accept Contract & Deposit

User B can accept the contract and deposit the required amount.

Acceptance Criteria:

- User B must deposit the same agreed amount.
- Contract status changes to `ACTIVE` after both parties deposit.
- Funds are locked in smart contract.

---

### 10.4 Check-in

Each partner can perform periodic check-in.

Acceptance Criteria:

- User can check-in while contract is active.
- System records timestamp of last check-in.
- If a user misses check-in beyond the allowed threshold, partner can raise breach claim.

---

### 10.5 Wedding Unlock

Either partner can request Wedding Unlock.

Acceptance Criteria:

- Request must include proof hash/link.
- Both partners must confirm.
- Witness threshold must be reached.
- Contract status changes to `MARRIAGE_CONFIRMED`.
- Funds become claimable.

---

### 10.6 Peaceful Exit

A partner can request peaceful breakup.

Acceptance Criteria:

- Other partner must approve.
- Contract enters cooling period.
- If no dispute is raised during cooling period, funds become claimable.
- Contract status changes to `PEACEFUL_EXIT`.

---

### 10.7 Breach Claim

A partner can raise breach claim.

Acceptance Criteria:

- Claim must include evidence hash/link.
- Claim creator must deposit challenge bond.
- Contract status changes to `DISPUTED`.
- Accused partner can challenge.
- Witnesses can vote.

---

### 10.8 Witness Voting

Witnesses can vote on disputed claims.

Acceptance Criteria:

- Only registered witnesses can vote.
- Each witness can vote once.
- Vote options: `APPROVE_CLAIM`, `REJECT_CLAIM`.
- If approval threshold is reached, claimant wins.
- If rejection threshold is reached or time expires without enough approval, accused party wins.

---

### 10.9 Payout

Users can claim funds after final resolution.

Acceptance Criteria:

- Payout follows contract state.
- No party can claim twice.
- Smart contract transfers funds according to result.
- Contract status changes to `RESOLVED`.

---

## 11. Smart Contract States

Recommended states:

```solidity
enum ContractStatus {
    PENDING_PARTNER,
    ACTIVE,
    WEDDING_REQUESTED,
    MARRIAGE_CONFIRMED,
    BREAKUP_REQUESTED,
    COOLING_PERIOD,
    DISPUTED,
    RESOLVED,
    CANCELLED,
    EXPIRED  // v2.0: kontrak lewat durasi tanpa outcome, memicu default withdrawal
}
```

> **Catatan v2.0:** State `EXPIRED` ditambahkan untuk menangani skenario deadlock/timeout (lihat Section 30 & 31). `CANCELLED` kini punya flow eksplisit di Section 32.

---

## 12. Suggested Smart Contract Functions

```solidity
function createLoveContract(
    address partner,
    uint256 duration,
    address[] memory witnesses,
    string[] memory rules
) external payable;

function acceptContract(uint256 contractId) external payable;

function checkIn(uint256 contractId) external;

function requestWeddingUnlock(uint256 contractId, string memory proofURI) external;

function confirmWedding(uint256 contractId) external;

function requestPeacefulExit(uint256 contractId) external;

function approvePeacefulExit(uint256 contractId) external;

function raiseBreachClaim(uint256 contractId, string memory evidenceURI) external payable;

function challengeBreachClaim(uint256 contractId) external;

function voteDispute(uint256 contractId, bool approveClaim) external;

function resolveDispute(uint256 contractId) external;

function claimPayout(uint256 contractId) external;

// v2.0 additions — menutup gap deadlock, cancel, dan timeout:

function cancelContract(uint256 contractId) external;
// Hanya bisa dipanggil oleh partnerA saat status PENDING_PARTNER.
// Mengembalikan deposit A dan set status ke CANCELLED.

function claimByTimeout(uint256 contractId) external;
// Bisa dipanggil salah satu partner setelah durasi kontrak lewat
// TANPA outcome apa pun (partner lain menghilang / witness pasif).
// Set status ke EXPIRED, kembalikan deposit masing-masing (potong fee 0,5%).

function resolveDisputeByTimeout(uint256 contractId) external;
// Kalau dispute period lewat tapi witness tidak mencapai threshold vote,
// klaim otomatis DITOLAK (accused menang, sesuai Section 10.8).
```

---

## 13. Data Model

### 13.1 LoveContract

```solidity
struct LoveContract {
    uint256 id;
    address partnerA;
    address partnerB;
    uint256 depositA;
    uint256 depositB;
    uint256 createdAt;
    uint256 duration;
    uint256 lastCheckInA;
    uint256 lastCheckInB;
    ContractStatus status;
    address[] witnesses;
    string[] rules;
    bool partnerAConfirmedWedding;
    bool partnerBConfirmedWedding;
    bool partnerAClaimed;
    bool partnerBClaimed;
}
```

### 13.2 BreachClaim

```solidity
struct BreachClaim {
    uint256 contractId;
    address claimant;
    address accused;
    string evidenceURI;
    uint256 bondAmount;
    uint256 createdAt;
    uint256 approveVotes;
    uint256 rejectVotes;
    bool challenged;
    bool resolved;
}
```

---

## 14. Payout Rules

> **Catatan v2.0:** Semua payout di bawah dipotong **tiered platform fee** (lihat Section 28). Fee dipotong dari total dana yang cair saat `claimPayout`, sebelum dana ditransfer ke pihak yang berhak. Aturan pengembalian deposit di bawah tetap berlaku, hanya ditambah pemotongan fee sesuai kondisi payout.

### 14.1 Wedding Unlock

- Deposit A returned to A.
- Deposit B returned to B.
- Simulated yield/reward distributed proportionally.
- Wedding NFT minted.
- **Platform fee: 0% – 0,25%** (outcome terbaik, fee paling ringan).

### 14.2 Peaceful Exit

- Deposit A returned to A.
- Deposit B returned to B.
- No penalty.
- No reward.
- **Platform fee: 0,5%** (netral, mutual, tanpa drama).

### 14.3 Valid Breach Claim

If A claims B breached and claim is approved:

- A receives deposit A.
- A receives full or partial deposit B, depending on contract rule.
- A receives challenge bond back.
- Contract resolved.
- **Platform fee: 1%** (outcome yang ingin dihindari sistem, fee tertinggi). Dipotong dari total dana yang cair ke A.

### 14.4 False Breach Claim

If A claims B breached and claim is rejected:

- B receives compensation from A’s challenge bond.
- Contract can either continue or move to peaceful exit, depending on product decision.

Recommended MVP decision:

- False claim causes contract to move to `RESOLVED`.
- Deposits returned to original owners.
- Challenge bond goes to falsely accused party.

---

## 15. Validation Design

### 15.1 Why Not Automatic Cheating Detection?

Smart contract cannot directly know events in the real world. It cannot know whether someone is actually cheating, married, or lying without off-chain input.

Therefore, LoveChain does not claim to automatically detect cheating. Instead, it validates claims through:

- Evidence submission.
- Challenge period.
- Witness voting.
- Economic penalty for false claims.

### 15.2 Validation by Case

| Case | Validation | Trust Level |
|---|---|---|
| Wedding Unlock | Mutual confirmation + proof + witness approval | Medium-High |
| Peaceful Exit | Mutual confirmation + cooling period | High |
| Ghosting | Missed on-chain check-in | High |
| Breach Claim | Evidence + bond + witness voting | Medium |
| False Claim | Rejected by witness voting | Medium |

---

## 16. UX Pages

### 16.1 Landing Page

Content:

- Product tagline.
- Explanation of LoveChain.
- CTA: Create Love Contract.
- CTA: View My Contract.

### 16.2 Create Contract Page

Fields:

- Partner address.
- Deposit amount.
- Duration.
- Witness addresses.
- Relationship rules.

### 16.3 Contract Detail Page

Displays:

- Partner addresses.
- Deposit amount.
- Contract status.
- Time remaining.
- Last check-in status.
- Available actions.

### 16.4 Dispute Page

Displays:

- Claimant.
- Accused.
- Evidence link/hash.
- Challenge deadline.
- Vote count.
- Voting buttons for witnesses.

### 16.5 Claim Payout Page

Displays:

- Final result.
- Claimable amount.
- Claim button.

---

## 17. Technical Recommendation

### 17.1 Blockchain

Recommended for MVP:

- Ethereum testnet / Sepolia.
- Polygon Amoy.
- Base Sepolia.

### 17.2 Smart Contract

Recommended stack:

- Solidity.
- Hardhat or Foundry.
- OpenZeppelin.

### 17.3 Frontend

Recommended stack:

- Next.js.
- Tailwind CSS.
- Wagmi.
- Viem.
- RainbowKit.

### 17.4 Storage

For proof/evidence:

- IPFS.
- Pinata.
- Web3.Storage.
- For demo, a simple mock URI is acceptable.

---

## 18. Security Considerations

- Use pull payment pattern for withdrawals.
- Prevent reentrancy on payout.
- Validate caller permissions.
- Ensure only partners can perform partner actions.
- Ensure only witnesses can vote.
- Ensure double voting is impossible.
- Ensure double claim is impossible.
- Avoid storing sensitive evidence directly on-chain.
- Use testnet for demo.

---

## 19. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Fake evidence | Wrong payout | Witness voting + challenge bond |
| Witness bias | Unfair result | Use 5 witnesses from both sides + neutral witness |
| One party disappears | Funds stuck | Check-in breach + timeout rules |
| Privacy issue | Sensitive data exposed | Store only hash/link, not raw evidence on-chain |
| Overcomplex scope | Project tidak selesai | Focus on MVP only |
| Legal misunderstanding | Misuse in real life | Position as learning/demo project |

---

## 20. Success Metrics

For project/demo context:

- Users can create and activate a Love Contract.
- Funds can be locked and unlocked based on contract state.
- At least 3 flows work end-to-end:
  - Wedding Unlock.
  - Peaceful Exit.
  - Breach Resolution.
- Witness voting works correctly.
- Payout works automatically according to final result.
- Demo can clearly explain why blockchain is useful in this product.

---

## 21. Suggested Development Timeline

### Day 1 — Planning & Contract Design

- Finalize feature scope.
- Define contract states.
- Define payout rules.
- Create basic wireframe.

### Day 2 — Smart Contract MVP

- Implement create contract.
- Implement deposit.
- Implement status management.
- Implement payout logic.

### Day 3 — Dispute & Witness Voting

- Implement breach claim.
- Implement challenge bond.
- Implement witness voting.
- Implement dispute resolution.

### Day 4 — Frontend Integration

- Wallet connection.
- Create contract page.
- Contract detail page.
- Action buttons.

### Day 5 — Polish & Demo

- Add UI status indicators.
- Add mock evidence URI.
- Add NFT/badge if time permits.
- Prepare pitch/demo script.

---

## 22. Demo Scenario

### Scenario 1: Wedding Unlock

1. A and B create contract.
2. Both deposit funds.
3. A submits wedding proof URI.
4. B confirms.
5. Witnesses approve.
6. Funds are returned.
7. Wedding badge/NFT minted.

### Scenario 2: Peaceful Exit

1. A requests breakup.
2. B approves.
3. Cooling period passes.
4. Funds returned to both parties.

### Scenario 3: Breach Claim

1. A claims B violated commitment.
2. A submits evidence URI and challenge bond.
3. B challenges the claim.
4. Witnesses vote.
5. Claim is approved or rejected.
6. Funds are distributed automatically.

---

## 23. Pitch Summary

LoveChain is a Web3 commitment escrow for relationships. Two partners lock funds into a smart contract as proof of commitment. The funds can only be unlocked through Wedding Unlock, Peaceful Exit, or Breach Resolution. Instead of pretending that blockchain can automatically detect cheating, LoveChain uses a proof stack: mutual confirmation, evidence hash, challenge bond, cooling period, and witness voting. This makes the project fun, relatable, and technically meaningful as a blockchain learning project.

---

## 24. Tagline Options

- **Proof of Commitment, Not Just Proof of Love.**
- **Kalau cinta butuh bukti, bikin komitmennya on-chain.**
- **Stake your love, prove your commitment.**
- **Love is temporary, smart contracts are immutable.**
- **Till block do us part.**

---

## 25. Open Questions for Team

1. Apakah MVP akan menggunakan ETH testnet atau token ERC-20 dummy?
2. Apakah evidence cukup berupa URI mock, atau benar-benar upload ke IPFS?
3. Apakah witness dipilih oleh pasangan atau ditentukan oleh sistem?
4. Apakah breach valid butuh 3/5 atau 4/5 vote?
5. Apakah yield benar-benar diimplementasikan atau hanya disimulasikan?
6. Apakah NFT masuk MVP atau jadi bonus feature?
7. Apakah cooling period dibuat real-time 3 hari atau dipercepat untuk demo?

---

## 26. Recommended MVP Decision

Untuk project cepat, disarankan MVP menggunakan keputusan berikut:

- Network: Sepolia / Base Sepolia.
- Asset: native testnet ETH.
- Evidence: mock IPFS URI.
- Witness: 5 wallet address yang dipilih saat contract creation.
- Breach threshold: 4/5 approval.
- Wedding threshold: 3/5 approval.
- Cooling period: 3 menit untuk demo.
- Challenge period: 3 menit untuk demo.
- Yield: simulated reward, bukan real DeFi yield.
- NFT: optional bonus jika waktu cukup.

---

## 27. Final Product Positioning

LoveChain adalah project blockchain yang fun tetapi tetap memiliki fondasi teknis yang jelas. Produk ini menunjukkan bagaimana smart contract dapat digunakan untuk escrow, dispute resolution, witness voting, evidence hash, dan automated payout.

Fokus utama LoveChain bukan membuktikan cinta atau mendeteksi selingkuh secara otomatis, tetapi membangun sistem commitment escrow yang transparan, auditable, dan punya konsekuensi.

---

## 28. Tiered Fee Model (Revenue Stream)

### 28.1 Ringkasan

LoveChain menerapkan model **tiered platform fee** — biaya platform yang besarnya menyesuaikan hasil akhir hubungan. Semakin baik outcome-nya, semakin kecil fee yang diambil. Dengan begitu, kepentingan platform, pasangan, dan semangat "menjaga komitmen" sama-sama searah.

### 28.2 Struktur Fee

| Kondisi Payout | Fee | Alasan |
|---|---|---|
| 💍 Wedding Unlock | 0% – 0,25% | Outcome terbaik → fee paling ringan / gratis |
| 🕊️ Peaceful Exit | 0,5% | Netral, disepakati kedua pihak, tanpa drama |
| ⚠️ Breach / Breakup | 1% | Outcome yang ingin dihindari → fee tertinggi |
| ⏳ Expired / Timeout | 0,5% | Default withdrawal, diperlakukan seperti peaceful exit |

Fee dihitung dari total dana yang dikunci dan dipotong saat pencairan (`claimPayout`), sebelum transfer ke pihak yang berhak.

### 28.3 Rasionalisasi Bisnis

Model ini memberi platform sumber pendapatan yang jelas tanpa menambah kompleksitas aplikasi — cukup satu logika potongan saat payout. Revenue platform di-framing sebagai *konsekuensi dari outcome buruk*, bukan "pajak atas cinta". Pasangan otomatis menyimpan lebih banyak dana jika menjaga komitmennya.

### 28.4 Catatan Penting (antisipasi pertanyaan juri)

Fee 1% terlalu kecil untuk benar-benar menahan orang agar tidak putus — tidak ada yang mempertahankan hubungan demi menghemat 1%. Jadi fungsi utamanya bersifat **simbolik dan signaling**, bukan deterrence ekonomi. Fee ini membuat komitmen terasa lebih berbobot sekaligus memberi platform cerita *incentive alignment* yang rapi. Posisikan sebagai design choice yang disengaja, bukan mekanisme jebakan finansial.

### 28.5 Future Work

Jika ingin efek lebih nyata tanpa menambah kompleksitas fee, leverage-nya ada di **deposit split** — misalnya saat breach tervalidasi, pihak yang melanggar kehilangan sebagian depositnya ke pihak lain. Ini menambah pertanyaan soal keadilan dan potensi griefing, jadi cukup dicatat sebagai future work, bukan untuk MVP.

Sumber sekunder (opsional/future): premium features seperti jumlah witness lebih banyak, layanan arbitrase, atau custom rule.

---

## 29. Witness Accountability (Gap Fix)

**Masalah:** Di v1.0, witness bisa menentukan ke mana dana besar pergi tanpa stake apa pun dan tanpa konsekuensi kalau vote asal-asalan atau kolusi. Ini celah desain klasik yang pasti ditanya juri: "apa yang mencegah witness disuap?"

**Keputusan MVP (sederhana, cukup untuk demo):**

- Witness dipilih dari **kedua pihak** — misalnya 2 dari sisi A, 2 dari sisi B, 1 netral yang disepakati bersama. Ini mengurangi risiko satu pihak memborong witness.
- Setiap vote tercatat on-chain (transparan & auditable) — witness tahu suaranya bisa dilihat siapa pun.
- **Witness reputation score** (Section 9.3) dinaikkan dari *could have* menjadi target **should have** kalau waktu cukup: skor sederhana berbasis "berapa kali vote witness sejalan dengan hasil akhir".

**Future Work (di luar MVP):**

- Witness staking: witness setor bond kecil; kalau terbukti kolusi (vote menyimpang dari mayoritas jujur), bond bisa di-slash.
- Ini disebut sebagai limitation eksplisit di Section 33, bukan disembunyikan.

---

## 30. Deadlock & Timeout Handling (Gap Fix)

**Masalah:** Setiap kondisi yang butuh threshold vote bisa deadlock kalau witness pasif. Contoh: breach butuh 4/5 approval tapi cuma 2 witness yang vote → dana ngambang selamanya. Sama untuk Wedding Unlock (3/5).

**Aturan v2.0 — setiap threshold WAJIB punya timeout + default outcome:**

| Aksi | Threshold | Timeout | Default Outcome kalau timeout |
|---|---|---|---|
| Wedding Unlock | 3/5 witness approve | Wedding approval window (mis. 3 menit demo) | Request gagal, kontrak kembali ke `ACTIVE` |
| Breach Claim | 4/5 witness approve | Challenge + voting period (mis. 3 menit demo) | Klaim **DITOLAK**, accused menang (`resolveDisputeByTimeout`) |
| Peaceful Exit | Mutual approve | Cooling period | Kalau tidak ada dispute → dana cair |

Prinsipnya: **dana tidak boleh pernah stuck karena pihak lain / witness diam.** Selalu ada jalur keluar berbasis waktu.

---

## 31. Unilateral Timeout Withdrawal (Gap Fix)

**Masalah:** Kalau salah satu partner menghilang total (ghosting ekstrem), flow breach jadi sirkular — breach butuh witness voting, kalau witness juga pasif → deadlock lagi. Partner yang tersisa tidak boleh kehilangan dananya hanya karena pihak lain (dan witness) menghilang.

**Solusi v2.0 — `claimByTimeout`:**

1. Setelah **durasi kontrak lewat** tanpa outcome apa pun (bukan wedding, bukan peaceful exit, bukan breach terselesaikan), salah satu partner bisa memanggil `claimByTimeout`.
2. Kontrak masuk status `EXPIRED`.
3. Deposit dikembalikan ke masing-masing pemilik (deposit A → A, deposit B → B), dipotong fee 0,5%.
4. Tidak butuh partisipasi partner lain atau witness — murni berbasis waktu.

Ini jaring pengaman terakhir agar dana selalu bisa keluar.

---

## 32. Cancel Flow (Gap Fix)

**Masalah:** State `CANCELLED` ada di enum v1.0 tapi tidak ada flow/function yang memicunya. Kalau User A bikin kontrak (dan deposit lewat `createLoveContract` yang `payable`) lalu User B tidak pernah accept, dana User A stuck.

**Solusi v2.0 — `cancelContract`:**

- Hanya bisa dipanggil oleh **partnerA** saat status masih `PENDING_PARTNER`.
- Mengembalikan deposit A sepenuhnya (tanpa fee, karena kontrak belum pernah aktif).
- Set status ke `CANCELLED`.
- Setelah User B accept (status `ACTIVE`), cancel sepihak tidak lagi diizinkan — harus lewat Peaceful Exit atau Breach.

---

## 33. Known Limitations (Transparansi untuk Pitch)

Menyebut kelemahan sendiri secara eksplisit membuat project terlihat matang, bukan naif. Berikut limitation yang sengaja diterima untuk scope MVP:

1. **Wedding proof = honor system.** Wedding Unlock hanya butuh mutual confirmation + witness pilihan pasangan sendiri. Pasangan yang kolusi (plus witness mereka) secara teknis bisa mengklaim "menikah" tanpa benar-benar menikah untuk menarik dana + reward + NFT. Tidak ada verifikasi ke database resmi (memang Non-Goal, Section 4.2).
2. **Relationship SLA sebagian besar deklaratif.** `rules` disimpan sebagai `string[]` — hanya teks bebas. Satu-satunya rule yang benar-benar enforceable on-chain adalah **weekly check-in** (berbasis timestamp). Sisanya bergantung pada penilaian witness, bukan otomatisasi kontrak.
3. **Witness tanpa stake di MVP.** Lihat Section 29. Akuntabilitas witness di MVP hanya berupa transparansi vote on-chain; staking/slashing masuk future work.
4. **Deposit asimetris tidak didukung penuh di MVP.** Data model mendukung `depositA` dan `depositB` berbeda, tetapi untuk kesederhanaan MVP **deposit dibuat simetris** (jumlah sama, sesuai Section 10.3). Payout asimetris masuk future work.
5. **Challenge bond flat.** Besaran challenge bond ditetapkan flat/proporsional sederhana untuk MVP. Sizing yang lebih matang (proporsional terhadap deposit, agar korban asli tidak takut klaim tapi penuduh palsu tetap jera) masuk future work.
6. **Gas cost.** Menyimpan `address[] witnesses` dan `string[] rules` on-chain relatif mahal. Untuk testnet demo tidak masalah, tapi worth disebut untuk versi produksi (bisa dipindah ke event log / off-chain + hash).
7. **Testnet only, bukan financial/legal advice.** Dana yang dipakai adalah testnet ETH. Ini learning/demo project, bukan produk finansial atau perjanjian legal yang mengikat.

---

## 34. Open Questions Tambahan (v2.0)

Melengkapi Section 25:

8. Berapa besaran fee final yang dipakai — apakah Wedding 0% (gratis, lebih dramatis) atau 0,25% (tetap ada revenue)?
9. Witness split: apakah 2-2-1 (A-B-netral) atau bebas dipilih User A saja seperti v1.0?
10. Apakah `claimByTimeout` dan `cancelContract` masuk MVP wajib, atau salah satu jadi should-have?
11. Apakah witness reputation score dikejar di demo, atau cukup disebut sebagai limitation?
