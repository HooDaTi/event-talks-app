# 📋 BigQuery Release Notes Web App

Estetyczna aplikacja webowa napisana w języku Python z użyciem frameworka **Flask** oraz czystego **HTML, JavaScript i CSS (Vanilla)**. Aplikacja pobiera oficjalny kanał informacji o wydaniach (Atom Feed) Google BigQuery, przetwarza go i wyświetla notatki w nowoczesnym, ciemnym interfejsie graficznym. Dodatkowo umożliwia zaznaczenie dowolnego wpisu i szybkie udostępnienie go w serwisie Twitter/X.

## 🚀 Funkcje aplikacji

*   **Automatyczne pobieranie**: Pobiera dane na bieżąco z oficjalnego kanału XML Google Cloud.
*   **Ręczne odświeżanie**: Przycisk "Refresh" z animowanym spinnerem i szkieletem ładowania (skeleton loader).
*   **Kolorowanie kategorii**: Nagłówki takie jak `Feature` (zielony), `Issue` (czerwony) czy `Announcement` (fioletowy) są automatycznie wykrywane i odpowiednio stylizowane.
*   **Integracja z Twitter/X**: Możliwość zaznaczenia konkretnej notatki (efektowna ramka z poświatą i znacznikiem wyboru) i wygenerowania gotowego do publikacji posta (wraz z linkiem deweloperskim i hashtagami) za pomocą jednego kliknięcia.
*   **Responsywność i Design**: Dopracowany interfejs w stylu *glassmorphism* (rozmyte tła kart), płynne animacje i pełne wsparcie dla urządzeń mobilnych.

## 📂 Struktura katalogów

```text
bq-releases-notes/
├── app.py                  # Backend w Flasku (pobieranie feedu, endpoint API)
├── requirements.txt        # Zależności Pythona
├── .gitignore              # Ignorowane pliki gita
├── templates/
│   └── index.html          # Struktura strony (szablon HTML)
└── static/
    ├── css/
    │   └── style.css       # Style (szablony kolorów, animacje, układ)
    └── js/
        └── app.js          # Logika frontendowa (fetch, interakcja z UI, Twitter API)
```

## ⚙️ Wymagania i uruchomienie

Aplikacja została przygotowana do pracy w wirtualnym środowisku Pythona za pomocą menedżera `uv`.

### 1. Klonowanie i wejście do projektu
Jeśli pobrałeś repozytorium z GitHuba:
```bash
git clone https://github.com/HooDaTi/event-talks-app.git
cd event-talks-app
```

### 2. Utworzenie wirtualnego środowiska i instalacja zależności
Zalecane jest użycie narzędzia `uv`:
```bash
# Utworzenie wirtualnego środowiska (.venv)
uv venv .venv

# Aktywacja środowiska (macOS/Linux)
source .venv/bin/activate

# Instalacja pakietów z pliku requirements.txt
uv pip install -r requirements.txt
```

### 3. Uruchomienie serwera deweloperskiego
```bash
.venv/bin/python app.py
```

Serwer domyślnie uruchomi się na porcie **5001**. Otwórz przeglądarkę i przejdź pod adres:
👉 **[http://127.0.0.1:5001](http://127.0.0.1:5001)**

## 🛰️ Architektura i Przepływ Danych

1.  **Backend** ([app.py](file:///Users/jarekkulikowski/agy-cli-projects/bq-releases-notes/app.py)) działa jako proxy: pobiera plik XML z serwerów Google, parsuje go za pomocą `xml.etree.ElementTree` i wystawia czysty JSON pod adresem `/api/notes`. Dzięki temu rozwiązano problem CORS i skrócono czas przetwarzania po stronie przeglądarki.
2.  **Frontend** ([app.js](file:///Users/jarekkulikowski/agy-cli-projects/bq-releases-notes/static/js/app.js)) wykonuje asynchroniczne zapytanie `fetch()` do endpointu `/api/notes`. Na czas ładowania wyświetla animację pulsowania. Po otrzymaniu danych dynamicznie generuje drzewo DOM z kartami wpisów.
3.  **Udostępnianie**: Zaznaczenie wpisu pobiera jego treść, oczyszcza ją z tagów HTML, przycina tekst do bezpiecznej długości Tweeta i otwiera oficjalne okno dialogowe Twitter Web Intent pod adresem `https://twitter.com/intent/tweet`.
