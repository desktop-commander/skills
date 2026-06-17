---
name: konkurencja-panel-sync
description: Synchronizuje listę wydarzeń konkurencji z panelu PWE, porównuje z poprzednim importem, pobiera wszystkie CSV kontaktów i generuje raport zmian. Używać, gdy użytkownik prosi o aktualizację listy konkurencji, pobranie CSV z panelu, lub sprawdzenie co się zmieniło od ostatniego importu.
version: 1.0.0
---

# Synchronizacja Panelu Konkurencji

Ten skill automatyzuje:
1. Eksport aktualnej listy wydarzeń z panelu konkurencji
2. Porównanie z poprzednim importem
3. Pobranie wszystkich CSV kontaktów
4. Wygenerowanie raportu zmian

## Kiedy używać

- "zaktualizuj listę konkurencji"
- "pobierz CSV z panelu konkurencji"
- "co się zmieniło od ostatniego importu"
- "zrób eksport wydarzeń konkurencji"

## Wymagania

- Dostęp do panelu: `http://72.62.47.150:3002/dashboard/konkurencja`
- Dane logowania (zapisane w `~/.agents/secrets/pwe_panel.txt` lub podane przez użytkownika)
- Skrypt Python: `konkurencja_sync.py` w folderze `chatgpt skrypty`

## Workflow

### Krok 1: Eksport z panelu

```javascript
// W przeglądarce zalogowanej do panelu
const pageSize = 200;
const firstRes = await fetch(`/api/konkurencja?page=1&page_size=${pageSize}`, { credentials: 'include' });
const first = await firstRes.json();
const total = first.total;
const pages = Math.ceil(total / first.pageSize);

// Pobierz wszystkie strony równolegle (20 naraz)
const rows = [...first.rows];
for (let start = 2; start <= pages; start += 20) {
  const batch = [];
  for (let p = start; p <= Math.min(pages, start + 19); p++) {
    batch.push(fetch(`/api/konkurencja?page=${p}&page_size=${first.pageSize}`, { credentials: 'include' }).then(r => r.json()));
  }
  const results = await Promise.all(batch);
  results.forEach(data => rows.push(...data.rows));
}

// Zapisz jako JSON i CSV
```

### Krok 2: Porównanie z poprzednim importem

```bash
python konkurencja_sync.py \
  poprzedni.json \
  aktualny.json \
  --cookie "next-auth.session-token=..." \
  --download-dir csv_kontakty_YYYY-MM-DD_HHMM
```

To generuje:
- `dodane_wydarzenia.csv` - nowe wydarzenia
- `usuniete_wydarzenia.csv` - usunięte wydarzenia
- `zmienione_wydarzenia.csv` - zmodyfikowane wydarzenia
- `zmiany_konkurencja.txt` - czytelny raport

### Krok 3: Pobranie CSV kontaktów

Skrypt automatycznie pobiera wszystkie CSV kontaktów dla wydarzeń, które mają `liczba_kontaktow > 0`.

Pliki są zapisywane jako:
```
{id}__{slugified_nazwa}.csv
```

Manifest pobrania: `csv_kontakty_YYYY-MM-DD_HHMM_manifest.csv`

## Parametry

- `previous_json`: Ścieżka do poprzedniego eksportu JSON
- `current_json`: Ścieżka do aktualnego eksportu JSON
- `--download-dir`: Folder na pobrane CSV (opcjonalne)
- `--cookie`: Nagłówek Cookie z sesją panelu
- `--workers`: Liczba równoległych pobrań (domyślnie 12)
- `--timeout`: Timeout w sekundach (domyślnie 60)

## Pliki wyjściowe

W folderze `Moje źrodla danych`:

1. **Eksport główny**:
   - `wydarzenia_konkurencja_aktualne_YYYY-MM-DD_HHMM.json`
   - `wydarzenia_konkurencja_aktualne_YYYY-MM-DD_HHMM.csv`
   - `wydarzenia_konkurencja_aktualne_YYYY-MM-DD_HHMM_podsumowanie.txt`

2. **Raport zmian**:
   - `dodane_wydarzenia.csv`
   - `usuniete_wydarzenia.csv`
   - `zmienione_wydarzenia.csv`
   - `zmiany_konkurencja.txt`

3. **CSV kontaktów** (folder):
   - `csv_kontakty_konkurencja_YYYY-MM-DD_HHMM/`
   - `csv_kontakty_konkurencja_YYYY-MM-DD_HHMM_manifest.csv`
   - `csv_kontakty_konkurencja_YYYY-MM-DD_HHMM_podsumowanie.txt`

## Przykład użycia

```
Użytkownik: Zaktualizuj listę konkurencji

AI:
1. Loguję się do panelu
2. Pobieram aktualną listę 30,000+ wydarzeń
3. Porównuję z poprzednim importem z 2026-06-13 15:18
4. Generuję raport zmian

Wynik:
- Dodane: 17 wydarzeń
- Usunięte: 39 wydarzeń
- Zmienione: 2 wydarzenia

Pełny raport: zmiany_konkurencja.txt
```

## Uwagi

- Pobieranie 1200+ CSV może trwać 10-20 minut
- Jeśli panel nie odpowiada, spróbuj ponownie za chwilę
- Zachowuj poprzednie importy do porównań
- CSV są pobierane tylko dla wydarzeń z kontaktami

## Skrypty

- [konkurencja_sync.py](../chatgpt skrypty/konkurencja_sync.py) - Główny skrypt synchronizacji
