# QIE Forge — Review PRD v2.0 dengan ECC

Tanggal review: 19 Oktober 2026. Dokumen: [QIE_Forge_PRD_v2.0.md](QIE_Forge_PRD_v2.0.md), 1.017 baris. Metode: product-lens untuk diagnosis produk, dan product-capability untuk kesiapan kontrak implementasi.

## Verdict dan skor

**76/100 (7,6/10). GO bersyarat untuk discovery dan implementasi core; revisi kontrak sebelum menyebut keseluruhan PRD engineering-ready.** Arah produknya masuk akal dan spesifik terhadap QIE. Kekurangan terbesarnya adalah batas distribusi paket, konsistensi status, definisi bukti keberhasilan, serta gate delivery yang masih longgar.

Skor ini penilaian reviewer dengan rubrik berikut, bukan skor resmi ECC atau prediksi penilaian juri. Yang dinilai adalah kualitas spesifikasi, bukan kualitas implementasi atau product-market fit. Workspace saat review hanya menyediakan PRD sebagai berkas produk; belum ada artefak implementasi untuk diuji.

| Dimensi | Bobot | Nilai /10 | Dasar penilaian |
|---|---:|---:|---|
| Masalah, pengguna utama, validasi kebutuhan | 15% | 7 | Hipotesis jujur dan discovery ada; persona prioritas serta bukti kebutuhan belum ditetapkan |
| Value proposition dan pembeda | 10% | 8 | Task routing + provenance + replayable recipes membentuk pembeda yang masuk akal |
| Scope MVP dan kelayakan delivery | 15% | 6,5 | P0 luas; kapasitas aktual, estimasi, dan urutan pengurangan scope belum ada |
| Functional requirements dan traceability | 15% | 8,5 | FR, journeys, tes, backlog, dan gates saling terhubung; beberapa acceptance masih ambigu |
| Arsitektur dan kontrak data/distribusi | 15% | 7 | Arsitektur sederhana; packaging dan status belum konsisten sampai tingkat implementasi |
| Safety, provenance, dan integritas klaim | 15% | 9 | Sangat kuat membedakan sumber, bukti runtime, signing, dan ketidakpastian |
| Metrik dan evaluasi manfaat | 10% | 8 | Outcome eksternal dan baseline direncanakan; ambang peningkatan manfaat belum ditentukan |
| Release gates dan dependensi kompetisi | 5% | 6,5 | Risiko diakui, tetapi eligibility dan mainnet proof belum ditempatkan cukup tegas/awal |

Rata-rata berbobot: **7,625/10**, dibulatkan menjadi **76/100**. Skor ini tidak menganggap interview, kompatibilitas agent, atau deployment sudah berhasil.

## Diagnosis produk: tujuh pertanyaan Product Lens

| Pertanyaan | Jawaban berdasarkan PRD | Langkah berikutnya |
|---|---|---|
| Untuk siapa? | Tujuh persona dicantumkan (§5), tanpa satu pengguna primer | Usulan: prioritaskan EVM developer yang memakai coding agent dan baru pertama membangun di QIE; validasi pada interview |
| Sakitnya apa? | Salah network/address, info terpecah, compatibility palsu, dan hasil tak terbukti (§3) | Rekam workflow nyata dan biaya kesalahan: waktu, koreksi, bantuan, hasil akhir |
| Mengapa sekarang? | PRD mengaitkan kebutuhan dengan coding agents dan window hackathon | Bedakan urgensi lomba dari bukti permintaan pengguna; cari tiga kejadian konkret yang berulang |
| Versi ideal? | Navigasi operasional seluruh domain QIE, lintas agent (§1, §7) | Pertahankan sebagai visi; ukur coverage berdasarkan capability yang terbukti |
| MVP terkecil? | Install → route → build → wallet → deploy dengan persetujuan → verify → debug | Tetapkan satu golden path, toolchain, wallet, dan reference app untuk release awal |
| Anti-goal? | Registry, token baru, custody, custom MCP/CLI, dan native transaction automation dikecualikan (§6) | Pertahankan batas ini dalam backlog dan review perubahan scope |
| Bagaimana tahu berhasil? | VQDC, tester eksternal, routing fixtures, dan baseline comparison (§18–19) | Tetapkan ambang manfaat sebelum pilot; ukur penyelesaian tugas, bukan hanya aktivasi skill |

**Bukti PMF belum tersedia.** Rencana interview dan target adoption merupakan desain validasi yang baik, tetapi belum membuktikan orang membutuhkan atau akan memakai produk berulang kali. Jangan memberi skor retention/revenue aktual dari dokumen ini.

## Temuan yang harus ditutup

Prioritas di bawah adalah prioritas perbaikan PRD: **R0** menutup kontrak inti sebelum implementasi terkait; **R1** menutup keputusan sebelum pilot/release. Ini terpisah dari label P0/P1 fitur dalam PRD.

### F-01 · R0 · Paket terpasang belum punya kontrak akses knowledge dan helpers

**Bukti PRD:** [FR-001, baris 329](QIE_Forge_PRD_v2.0.md), [layout, baris 533](QIE_Forge_PRD_v2.0.md), [ownership, baris 592](QIE_Forge_PRD_v2.0.md), dan [offline readability, baris 750](QIE_Forge_PRD_v2.0.md).

Canonical knowledge, verifier scripts, dan reference app ditempatkan di root repository, sedangkan unit install adalah direktori skill. Pada implementasi installer resmi yang diperiksa, jalur copy dan symlink standar menyalin isi `skill.path` ke lokasi install. Root sibling seperti `knowledge/` tidak otomatis ikut hanya karena berada dalam repo yang sama. [Sumber: Skills CLI installer, fungsi installSkillForAgent](https://github.com/vercel-labs/skills/blob/main/src/installer.ts).

**Dampak:** metadata bisa lolos discovery, tetapi skill terpasang berpotensi kehilangan sumber klaim, helper, atau template. Ini celah spesifikasi, belum merupakan bug yang direproduksi pada QIE Forge.

**Perbaikan:** definisikan isi artefak distribusi. Rekomendasi: hasilkan snapshot referensi dan helper yang diperlukan ke dalam direktori skill saat release, dari satu canonical source. Salinan hasil build tidak boleh diedit sebagai sumber kedua. Tetapkan juga apakah semua sembilan skills wajib terpasang, bagaimana router mendeteksi skill hilang, serta cara memperoleh reference app.

**Acceptance tambahan:** install ke workspace kosong dari artefak release; hilangkan akses ke checkout sumber/cache installer; semua referensi lokal dan read-only helpers yang dijanjikan tetap tersedia. Uji mode copy dan symlink. Saat offline, bacaan lokal tetap tersedia dan live checks mengembalikan ketidakpastian secara eksplisit. Jika dipilih desain remote-only, janji offline harus diperbarui.

### F-02 · R0 · Status capability memiliki dua kontrak yang bertabrakan

**Bukti:** [baris 208](QIE_Forge_PRD_v2.0.md) serta [FR-004, baris 350](QIE_Forge_PRD_v2.0.md) memakai `CONFIRMED_TESTED`, `OFFICIALLY_DOCUMENTED`, dan `THIRD_PARTY_CLAIM`. Namun [contoh capability, baris 598](QIE_Forge_PRD_v2.0.md) diikuti aturan `status: VERIFIED_LIVE` pada baris 614. Taxonomy §9.3 menggunakan himpunan status berbeda.

**Dampak:** validator yang mengikuti FR-004 dapat menolak record yang dinyatakan sah oleh §14, atau website dan skill memberi arti berbeda pada status yang sama.

**Perbaikan:** pilih enum canonical untuk setiap entity. Jika claim dan capability sengaja memiliki enum berbeda, tulis mapping eksplisit beserta kondisi promosinya; perbaiki contoh §14 agar sesuai. Definisikan precedence untuk evidence yang masih tersimpan tetapi freshness kedaluwarsa atau authoritative sources berkonflik.

**Acceptance tambahan:** satu record capability yang lulus validator harus mempunyai arti yang sama pada website, skill output, dan release report. Tambahkan contoh tested-but-expired, conflicting sources, documented-only, serta missing evidence. Setiap enum yang dipakai FR/contoh wajib ada dalam schema atau mapping yang bernama.

### F-03 · R0 · Bukti transaksi belum terikat pada aksi dan kontrak yang diharapkan

**Bukti:** [FR-009, baris 377](QIE_Forge_PRD_v2.0.md), [UJ-03, baris 449](QIE_Forge_PRD_v2.0.md), dan [output deployment, baris 649](QIE_Forge_PRD_v2.0.md).

Receipt sukses dan bytecode ada merupakan observasi berguna. Akan tetapi, kontrak acceptance belum mewajibkan hubungan antara tx hash, expected action, expected contract, serta hasil aplikasi. Misalnya, transaksi sukses yang tidak terkait reference app dan sebuah address lain yang memiliki bytecode belum membuktikan deployment/mint yang sedang diklaim.

**Perbaikan:** bedakan hasil inclusion/execution, identity linkage, dan application effect. Untuk direct deployment yang dipakai golden path, cocokkan receipt creation address dengan expected contract. Untuk mint reference app, cocokkan target kontrak serta event/state yang relevan. Tetapkan kebijakan finality dan pemeriksaan block canonical berdasarkan sumber QIE yang diverifikasi; nilai yang belum diketahui tetap eksplisit.

**Acceptance tambahan:** tx sukses yang tidak terkait, address berbeda yang memiliki code, hasil mint yang tidak cocok, serta receipt yang berubah/hilang saat pemeriksaan ulang tidak boleh menjadi bukti completion aplikasi. Generic helper tetap boleh melaporkan fakta receipt secara terbatas, dengan batas klaim yang jelas. Jangan memperluas ini menjadi indexer umum atau produk registry.

### F-04 · R1 · Scope P0 belum dipasangkan dengan kapasitas aktual

**Bukti:** [scope, baris 153](QIE_Forge_PRD_v2.0.md), [skills, baris 218](QIE_Forge_PRD_v2.0.md), [website, baris 683](QIE_Forge_PRD_v2.0.md), [backlog, baris 840](QIE_Forge_PRD_v2.0.md), dan [timeline, baris 869](QIE_Forge_PRD_v2.0.md).

P0 mencakup sembilan skills, navigasi 15 domain, 11 rute website, knowledge schemas, helper, reference contract/frontend, empat agent, dan pilot eksternal dalam sekitar enam minggu. Label acceptance owner masih berupa peran; jumlah orang, jam tersedia, estimasi, akses agent, serta budget belum ditentukan. Luasnya scope bukan bukti otomatis bahwa jadwal mustahil, tetapi feasibility belum dapat dipertanggungjawabkan.

**Perbaikan:** tambahkan nama DRI, kapasitas, estimasi, dan cut order. Batasi depth pada lima task di bagian MVP berikut. Jadikan 15 domain sebagai index berbatas, hindari target jumlah provider tak terbatas, dan gunakan satu template docs untuk menghasilkan halaman. Mainnet proof awal sebaiknya sesudah testnet gate pada S3, dengan human approval, agar S5 menyisakan waktu perbaikan.

**Acceptance tambahan:** setiap deliverable release mempunyai owner dan kapasitas teralokasi; keterlambatan golden path otomatis menunda recipe tambahan dan polish sebelum menurunkan correctness/safety requirements.

### F-05 · R1 · Discovery belum memiliki keputusan ketika manfaat tidak terbukti

**Bukti:** [discovery, baris 94](QIE_Forge_PRD_v2.0.md), [benchmark, baris 805](QIE_Forge_PRD_v2.0.md), dan [targets, baris 817](QIE_Forge_PRD_v2.0.md).

Discovery sudah baik karena meminta observasi nyata. Tetapi ketika kurang dari tiga developer menemui masalah, respons hanya mengubah task selection. Belum ada keputusan bila agent dengan official docs memberi hasil setara, atau tim tidak melihat manfaat yang cukup untuk maintenance jangka panjang.

**Perbaikan:** tambahkan hasil discovery `continue / narrow / stop expansion` di dalam arah Agent Skills yang sudah disepakati. Tetapkan success threshold sebelum pilot, dengan task sebanding dan model/environment dicatat.

**Usulan threshold untuk disepakati:** dari sedikitnya lima tester eksternal, minimal tiga menyelesaikan golden path tanpa intervensi maintainer; median waktu ke hasil yang terverifikasi turun ≥25% terhadap baseline sebanding; tidak ada critical wrong-chain/address recommendation. Laporkan kegagalan, assistance, serta hasil setiap pasangan task. Sampel kecil hanya memberi sinyal arah. Jika memakai persentase waktu, definisikan perlakuan terhadap task yang gagal/disensor agar kegagalan tidak menghilang dari perhitungan.

NFR ≤10 menit sampai aktivasi skill mengukur onboarding, bukan keberhasilan membangun. Tambahkan follow-up opt-in tujuh hari untuk reuse bila waktu memungkinkan; jangan menjadikannya klaim retention sebelum data ada.

### F-06 · R1 · Acceptance cross-agent dapat lolos dengan bukti yang terlalu lemah

**Bukti:** [FR-002, baris 335](QIE_Forge_PRD_v2.0.md), [FR-013, baris 401](QIE_Forge_PRD_v2.0.md), dan [T6, baris 773](QIE_Forge_PRD_v2.0.md).

Target empat install/discovery checks sudah konkret. Namun kalimat dua full workflow demos masih bersyarat “if available” dan tidak memastikan dua host berbeda. Routing ≥90% belum menjelaskan denominator per host/model, pengulangan, atau cara menilai correct path.

**Perbaikan:** pertahankan empat target installation/discovery; wajibkan golden path pada sedikitnya dua host berbeda yang disebutkan. Gunakan frozen fixtures, accepted route sets, versi host/model, dan rubric penilaian. Laporkan hasil per environment agar rata-rata gabungan tidak menutupi host yang gagal. Jumlah pengulangan ditentukan sebelum run; usulan minimum tiga per fixture untuk pilot. Lima high-risk fixtures wajib benar pada seluruh run yang dilaporkan.

**Acceptance tambahan:** `NOT_RUN` tetap informasi yang jujur, tetapi tidak dihitung sebagai PASS untuk capability yang menjadi syarat release. Pisahkan label install-compatible, routing-tested, dan workflow-tested.

### F-07 · R1 · Eligibility diketahui berisiko, tetapi gate belum memaksa penyelesaiannya

**Bukti:** [D-01, baris 29](QIE_Forge_PRD_v2.0.md), [§2.2, baris 61](QIE_Forge_PRD_v2.0.md), [G0, baris 883](QIE_Forge_PRD_v2.0.md), dan [DoD item 12, baris 908](QIE_Forge_PRD_v2.0.md).

PRD benar mengakui belum ada kepastian skills-led tooling diterima. G0 hanya meminta pertanyaan dikirim, dan DoD mengizinkan outstanding decision dicatat. Ini belum memastikan keputusan eligibility terselesaikan sebelum tim bergantung pada format submission tersebut.

**Perbaikan:** pisahkan development gate dari submission gate. Discovery/core boleh lanjut sebagai keputusan berisiko yang dicatat. Sebelum submission freeze, owner harus menutup D-01 dengan panduan tertulis tentang skills-led tooling, reference-contract address, dan bukti adoption yang diterima. Jika belum ada jawaban, tandai contest-readiness belum resolved; jangan mengklaim memenuhi syarat berdasarkan interpretasi internal.

Halaman resmi menampilkan track Developer Infrastructure & Tooling, submission 30 November 2026, kebutuhan repo/demo/contract address, dan penekanan mainnet. Ini mendukung pilihan arah, tetapi bukan konfirmasi eksplisit penerimaan format produk QIE Forge. [Sumber: homepage resmi](https://hackathon.qie.digital/). Terms juga menuntut integrasi QIE, karya original, demo, source, dan dokumentasi. [Sumber: terms resmi](https://hackathon.qie.digital/terms).

### F-08 · R1 · Freshness publik belum menjelaskan perilaku install lama

**Bukti:** [freshness, baris 297](QIE_Forge_PRD_v2.0.md), [FR-012, baris 395](QIE_Forge_PRD_v2.0.md), [maintainer journey, baris 465](QIE_Forge_PRD_v2.0.md), dan [FR-018, baris 431](QIE_Forge_PRD_v2.0.md).

Update website/repository tidak langsung memperbaiki copy skill yang sudah terpasang. Snapshot lama dapat masih menulis VERIFIED meskipun review window sudah lewat. PRD belum memilih runtime expiry evaluation, version reporting, update/rollback procedure yang lengkap, atau perilaku saat pembaruan tidak dapat diambil.

**Perbaikan:** setiap artefak install membawa release version, schema version, dan checked/expiry timestamps. Tentukan cara menghitung stale pada penggunaan, cara menampilkan versi, dan jalur update/rollback yang diuji. Revalidasi klaim berisiko sebelum write-bound flow; jika tak dapat diverifikasi, tampilkan UNKNOWN/STALE sesuai kebijakan yang dipilih. Otomasi issue-bot tetap dapat P1.

**Acceptance tambahan:** snapshot yang semula valid kemudian melewati expiry tidak boleh tetap menghasilkan rekomendasi berlabel fresh. Uji penggunaan offline serta perbedaan schema antara snapshot dan tool versi baru.

## Kekuatan yang perlu dipertahankan

- **Posisi produk jelas:** Agent Skills-first, satu canonical authoring source, tanpa registry/token/MCP tambahan yang belum dibutuhkan (§0, §6, §12).
- **Janji A–Z dibatasi dengan sehat:** coverage map dibedakan dari executable support; unverified integrations tidak dipromosikan (§1, §6–7).
- **Evidence discipline kuat:** status dokumentasi dibedakan dari observasi on-chain, `eth_getCode` tidak dianggap bukti identity, dan unknown tidak diisi tebakan (§8–9).
- **Trust boundary realistis:** read-only helpers, developer-controlled signing, dan pengakuan bahwa instruksi teks bukan enforcement permissions (§4, §10, §16).
- **Struktur delivery bisa dilacak:** FR → journeys → tests → backlog → gates sudah ada, termasuk negative paths dan consent-based adoption (§10–25).

## MVP yang direkomendasikan untuk dikunci

Ini usulan pembatasan depth, bukan perubahan atas keputusan universal skills atau penghapusan navigasi A–Z.

| Area | Batas release awal yang diusulkan |
|---|---|
| Pengguna primer | EVM developer dengan coding agent yang baru membangun di QIE |
| Lima task inti | Verify network; scaffold/build/test; connect wallet/read; deploy dan verify dengan human signing; diagnose satu deployment/mint failure |
| Recipe dan app | Satu golden path ERC-721 jika disetujui owner; Foundry + satu frontend stack/version + satu external wallet yang benar-benar diuji |
| Sembilan P0 skills | Pertahankan taxonomy; arahkan prosedur bersama ke recipe canonical yang terpaket agar depth tidak mengganda |
| Lima belas domain | Navigation entries dengan sumber/status/gap; tidak wajib menyediakan executable recipe untuk seluruh domain |
| Ecosystem directory | Batasi daftar awal secara eksplisit; status faktual tetap berguna tanpa memaksakan integrasi |
| Agent support | Empat install/discovery; sedikitnya dua host berbeda menyelesaikan golden path |
| Docs | Satu static docs system dengan halaman dari canonical content; polish tambahan mengikuti golden path |
| Ditunda sampai core lolos | Recipe provider tambahan, Hardhat executable path tambahan, native deep guidance, source issue-bot, advanced indexing/DeFi, terjemahan |

## Handoff Product Capability

**CAPABILITY.** Developer memasang portable skills dan menyelesaikan satu workflow QIE EVM yang dapat diperiksa pihak lain, sambil menemukan batas kemampuan ecosystem secara akurat.

**CONSTRAINTS.** Arah skills-first, original authorship, mainnet/testnet separation, canonical structured claims, dan read-only bundled helpers merupakan aturan tetap PRD. Pilihan toolchain/frontend/reference app, isi paket, enum/mapping, serta batas rollout masih memerlukan keputusan eksplisit. Verifier tidak boleh memperluas fakta receipt menjadi bukti outcome aplikasi tanpa pemeriksaan yang relevan.

**IMPLEMENTATION CONTRACT.** Aktor: developer/signing wallet, host agent, maintainer, independent reviewer. Surface: installed files, optional public reference app/docs, dan read-only RPC. Alur utama: installed → task routed → inputs/network checked → locally tested → awaiting developer signing → receipt observed → expected identity/effect checked → completion reported. `AWAITING_APPROVAL`, `PENDING`, `UNKNOWN`, dan `FAIL` tidak boleh diperlakukan sebagai completion. Ini usulan kontrak; enum final perlu disahkan lewat F-02, bukan ditambahkan diam-diam sebagai taxonomy baru.

**NON-GOALS.** Review ini menilai PRD dan memberi acceptance tambahan; tidak menetapkan dukungan provider yang belum terbukti, tidak memberi persetujuan mainnet, dan tidak mengubah source PRD.

**OPEN QUESTIONS.** Owner perlu memutuskan packaging/dependencies (F-01), state mapping (F-02), exact outcome/finality policy (F-03), kapasitas/budget/cut order (F-04), threshold manfaat (F-05), dua workflow hosts (F-06), D-01 (F-07), serta version/expiry policy (F-08). Repo owner, license, signer workflow, dan gas budget yang sudah disebut §24 juga tetap perlu ditutup.

**HANDOFF.** Kerjakan revisi kontrak F-01–03 terlebih dahulu melalui `ecc:product-capability`; lanjutkan discovery dan core yang independen. Tetapkan F-04–08 sebelum pilot/release terkait. Status yang lebih akurat sekarang: **“Approved product direction; implementation contract pending.”** Setelah keputusan tercatat dan acceptance konsisten, scope siap diserahkan ke implementasi.

## Verifikasi dan batas review

Seluruh PRD dibaca, lalu requirement, contoh schema, backlog, gates, dan DoD diperiksa silang. Sumber primer untuk aturan hackathon, network baseline, Agent Skills format, dan installer ditinjau pada sesi ini.

Chain ID `1990`/`1983` dalam Appendix A sesuai nilai yang dipublikasikan dokumentasi resmi. Tidak dilakukan live RPC check; ketersediaan endpoint dan identitas jaringan runtime belum dibuktikan dalam review ini. [Sumber: dokumentasi network QIE](https://docs.qie.digital/getting-started-with-qie-blockchain/4.-access-mainnet-or-testnet).

Kontrak frontmatter `name`/`description` dan supporting directories mengikuti arah format resmi. Kepatuhan format sendiri belum membuktikan routing atau execution berhasil di keempat host. [Sumber: Agent Skills specification](https://agentskills.io/specification).

Tidak ada aplikasi, agent compatibility run, atau deployment QIE Forge yang diuji. Semua acceptance dan target baru di atas adalah rekomendasi untuk keputusan produk/engineering berikutnya, bukan hasil pengujian yang sudah dicapai.
