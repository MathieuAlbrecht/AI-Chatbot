# Ai ChatHub

## Inhaltsverzeichnis
- [Beschreibung](#beschreibung)
- [Funktionen](#funktionen)
- [Unterstützte AI-Provider](#unterstützte-ai-provider)
- [Verwendete Technologien](#verwendete-technologien)
- [Voraussetzungen](#voraussetzungen)
- [Installation](#installation)
- [Verwendung](#verwendung)
- [Serverkonfiguration (API-Schlüssel)](#serverkonfiguration-api-schlüssel)
- [Dateien und Ordnerstruktur](#dateien-und-ordnerstruktur)
- [Lizenz](#lizenz)

## Beschreibung

Ai ChatHub ist eine Webanwendung, die als zentrale Schnittstelle für die Interaktion mit verschiedenen Large Language Models (LLMs) von unterschiedlichen Anbietern dient. Die Anwendung bietet eine benutzerfreundliche Chat-Oberfläche, ermöglicht das Speichern und Verwalten von Chatverläufen und unterstützt Datei-Uploads, um den Kontext für die KI-Modelle zu erweitern. Benutzer müssen sich anmelden, um die Chat-Funktionalität nutzen zu können.

## Funktionen

-   **Benutzerauthentifizierung:** Sichere Anmeldung über Benutzernamen und Passwort (gespeichert in `server/users.json`).
-   **Multi-Provider-KI-Chat:** Interaktion mit Modellen von Gemini, OpenRouter, Anthropic, Perplexity, DeepSeek und OpenAI.
-   **Modellauswahl:** Benutzer können aus einer Liste verfügbarer Modelle verschiedener Provider wählen.
-   **Chat-Verwaltung:**
    -   Erstellen neuer Chats.
    -   Speichern von Chatverläufen im `localStorage` des Browsers.
    -   Laden und Fortsetzen vorheriger Chats.
    -   Löschen einzelner Chats oder aller Chats.
    -   Automatische Titelgenerierung für neue Chats basierend auf der ersten Benutzereingabe.
-   **Datei-Uploads:**
    -   Hochladen von Dateien (Bilder, Textdateien, PDFs, etc., bis zu 10MB).
    -   Verwendung von Datei-Inhalten (Text-Extraktion, Bild-Einbettung für unterstützte Modelle) im Chat-Kontext.
    -   Vorschau und Verwaltung hochgeladener Dateien.
-   **Markdown & Syntax Highlighting:** Anzeige von Chatnachrichten mit Markdown-Formatierung und Syntax-Hervorhebung für Codeblöcke.
-   **Responsives Design (Annahme):** Die Oberfläche sollte auf verschiedenen Bildschirmgrößen nutzbar sein.
-   **Willkommensbildschirm:** Zeigt eine Übersicht und unterstützte Provider an, wenn kein Chat aktiv ist.
-   **API-Schlüssel-Management:** Sichere Verwaltung der API-Schlüssel serverseitig über Umgebungsvariablen.

## Unterstützte AI-Provider

Ai ChatHub unterstützt eine Vielzahl von AI-Providern und deren Modelle:

-   **Google Gemini:** (z.B. Gemini 1.5 Pro, Gemini 1.5 Flash) - Vision-fähig
-   **OpenRouter:** (z.B. DeepSeek R1, DeepSeek V3, Llama 3.3 8B) - Diverse Modelle über OpenRouter API
-   **Anthropic:** (z.B. Claude Opus 4) - Vision-fähig
-   **Perplexity AI:** (z.B. Sonar, Sonar Pro)
-   **DeepSeek:** (z.B. DeepSeek Chat, DeepSeek Coder - direkte API)
-   **OpenAI:** (z.B. GPT-4o, GPT-4 Turbo - direkte API)

Die Verfügbarkeit der Modelle hängt von den konfigurierten API-Schlüsseln auf dem Server ab.

## Verwendete Technologien

**Frontend:**

-   HTML5
-   CSS3
-   JavaScript (ES6+)
-   [Marked.js](https://marked.js.org/): Für das Parsen und Rendern von Markdown.
-   [Highlight.js](https://highlightjs.org/): Für Syntax-Hervorhebung in Codeblöcken.
-   FontAwesome: Für Icons.

**Backend:**

-   Node.js
-   Express.js: Web-Framework für Node.js.
-   [Multer](https://github.com/expressjs/multer#readme): Middleware für das Handling von `multipart/form-data` (Datei-Uploads).
-   [Dotenv](https://github.com/motdotla/dotenv#readme): Lädt Umgebungsvariablen aus einer `.env`-Datei.
-   [Cookie-Parser](https://github.com/expressjs/cookie-parser#readme): Middleware zum Parsen von Cookies.
-   **AI Provider SDKs/APIs:**
    -   `@google/generative-ai`
    -   `@anthropic-ai/sdk`
    -   `openai`
    -   Direkte API-Aufrufe für Perplexity und OpenRouter.

**Datenhaltung:**

-   `localStorage` (Browser): Speicherung von Chatverläufen und Benutzereinstellungen.
-   Dateisystem (Server):
    -   `server/users.json`: Speicherung von Benutzeranmeldeinformationen (für Demo-Zwecke).
    -   `uploads/`: Speicherung hochgeladener Dateien.

## Voraussetzungen

-   Node.js (Version 18.x oder höher empfohlen)
-   npm (Node Package Manager, wird mit Node.js installiert)
-   Ein moderner Webbrowser (z.B. Chrome, Firefox, Edge)
-   API-Schlüssel für die gewünschten AI-Provider (siehe [Serverkonfiguration](#serverkonfiguration-api-schlüssel)).

## Installation

1.  **Repository klonen:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Server-Abhängigkeiten installieren:**
    Navigiere in das `server`-Verzeichnis und installiere die Node.js-Abhängigkeiten.
    ```bash
    cd server
    npm install
    ```

3.  **Benutzer erstellen (optional):**
    Bearbeite die Datei `server/users.json`, um Benutzer für den Login hinzuzufügen. Das Format ist ein Array von Objekten:
    ```json
    [
      {
        "username": "testuser",
        "password": "testpassword"
      }
    ]
    ```
    **Hinweis:** Für eine Produktionsumgebung sollte ein sichereres Verfahren zur Benutzerverwaltung implementiert werden.

4.  **API-Schlüssel konfigurieren:**
    Erstelle eine `.env`-Datei im `server`-Verzeichnis (`server/.env`) und füge deine API-Schlüssel hinzu. Siehe Abschnitt [Serverkonfiguration (API-Schlüssel)](#serverkonfiguration-api-schlüssel) für Details.

5.  **Server starten:**
    Vom `server`-Verzeichnis aus:
    ```bash
    npm start
    ```
    Oder für die Entwicklung mit automatischer Neuladung bei Änderungen:
    ```bash
    npm run dev
    ```
    Der Server läuft standardmäßig auf `http://localhost:3000`.

## Verwendung

1.  **Anmelden:**
    Öffne `http://localhost:3000` in deinem Webbrowser. Du wirst zur Login-Seite weitergeleitet. Gib die Anmeldeinformationen ein, die du in `server/users.json` konfiguriert hast.

2.  **Chat-Oberfläche:**
    Nach erfolgreicher Anmeldung gelangst du zum Ai ChatHub.
    -   **Neuen Chat starten:** Klicke auf "Neuer Chat ✏️" in der Seitenleiste.
    -   **Modell auswählen:** Wähle das gewünschte KI-Modell und den Provider aus dem Dropdown-Menü oben im Chatbereich.
    -   **Nachricht senden:** Gib deine Nachricht in das Textfeld ein und drücke Enter oder klicke auf den Senden-Button.
    -   **Dateien anhängen:** Klicke auf den Büroklammer-Button (📎), um Dateien hochzuladen. Diese können dann im Kontext der Nachricht verwendet werden.
    -   **Chatverlauf:** Deine Chats werden in der Seitenleiste aufgelistet. Klicke auf einen Chat, um ihn zu öffnen und fortzusetzen.
    -   **Chats löschen:** Einzelne Chats können über das Mülleimer-Symbol neben dem Chat-Titel gelöscht werden. Alle Chats können über das Mülleimer-Symbol im Header der Seitenleiste gelöscht werden.

## Serverkonfiguration (API-Schlüssel)

Um die verschiedenen KI-Modelle nutzen zu können, müssen die entsprechenden API-Schlüssel in einer `.env`-Datei im `server`-Verzeichnis (`server/.env`) hinterlegt werden.

Erstelle die Datei `server/.env` mit folgendem Inhalt und ersetze die Platzhalter durch deine tatsächlichen Schlüssel:

```env
# Server Port (optional, Standard ist 3000)
# PORT=3000

# Google Gemini API Key
GOOGLE_API_KEY=DEIN_GOOGLE_API_SCHLUESSEL

# Anthropic API Key
ANTHROPIC_API_KEY=DEIN_ANTHROPIC_API_SCHLUESSEL

# OpenRouter API Key
OPENROUTER_API_KEY=DEIN_OPENROUTER_API_SCHLUESSEL

# Perplexity API Key
PERPLEXITY_API_KEY=DEIN_PERPLEXITY_API_SCHLUESSEL

# DeepSeek API Key (für direkte API-Nutzung)
DEEPSEEK_API_KEY=DEIN_DEEPSEEK_API_SCHLUESSEL

# OpenAI API Key (für direkte API-Nutzung)
OPENAI_API_KEY=DEIN_OPENAI_API_SCHLUESSEL
```

Stelle sicher, dass die `.env`-Datei **nicht** in dein Git-Repository eingecheckt wird, indem du sie zur `.gitignore`-Datei hinzufügst (falls noch nicht geschehen).
