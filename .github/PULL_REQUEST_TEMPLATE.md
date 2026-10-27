## Ringkasan Perubahan
<!-- Jelasin singkat apa yg diubah dan kenapa. -->

## Jenis Perubahan
- [ ] Perbaikan bug (fix)
- [ ] Perbaikan keamanan (XSS, SSRF, sandbox, validasi input)
- [ ] Fitur / alat kelas baru
- [ ] Aksesibilitas / kontrol suara (standar Pak Damar)
- [ ] Dokumentasi / workflow CI

## Cek Kualitas Sebelum Merge
- [ ] `npm run check` (`tsc --noEmit`) lulus tanpa error
- [ ] `npx vitest run` lulus semua test
- [ ] `npm run build` berhasil
- [ ] Tetap jalan di mode offline (Ollama lokal / fallback manual)
- [ ] Desain mengikuti palet solid Trido (`#e4e3e0`, `#1550aa`, `#0a1a3a`, `#ffcc00`, tanpa gradient, drag/resize 120 FPS dengan `transition: none`)
- [ ] Key terjemahan baru sudah ditambah ke `id` dan `en` di `utils/translations.ts`

## Tangkapan Layar / Log Test
<!-- Tempel output test atau screenshot kalau ada perubahan UI. -->
