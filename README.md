# Ai ChatHub

Ein Self-Hosted Chat-Interface für verschiedene KI-Modelle mit Benutzerlogin und Datei-Upload.

## Übersicht

Dieses Projekt ist ein Web-basierter "KI-Hub", der es Benutzern ermöglicht, sich anzumelden und mit einer Vielzahl von Large Language Models (LLMs) verschiedener Anbieter zu interagieren. Die Chats werden lokal im Browser gespeichert. Die Anwendung verfügt über eine Server-Komponente, die API-Anfragen an die KI-Provider weiterleitet und Datei-Uploads verwaltet.

Die Oberfläche ist mit HTML, CSS und JavaScript erstellt. Das Backend läuft auf Node.js.

## Features

-   **Benutzer-Login:** Einfacher Login über `server/users.json`.
-   **Multi-KI-Unterstützung:** Zugriff auf Modelle von Google (Gemini), Anthropic (Claude), OpenRouter, Perplexity, DeepSeek und OpenAI.
-   **Modellauswahl:** Dropdown zur Auswahl des gewünschten KI-Modells.
-   **Chat-Speicherung:** Konversationen werden im `localStorage` des Browsers gesichert.
-   **Datei-Upload:** Ermöglicht das Hochladen von Dateien (Bilder, Text, etc.), die im Chat-Kontext genutzt werden können (Vision-Support für Gemini & Claude).
-   **Markdown-Anzeige:** Chatnachrichten unterstützen Markdown-Formatierung.
-   **Code-Highlighting:** Codeblöcke werden mit `highlight.js` formatiert.
-   **Server-Side API-Key Management:** API-Schlüssel werden sicher serverseitig in einer `.env`-Datei verwaltet.

## Voraussetzungen

-   Node.js (v18+ empfohlen)
-   npm (kommt mit Node.js)
-   API-Schlüssel für die gewünschten KI-Provider.


## API-Schlüssel (`server/.env`)

Erstelle eine Datei `server/.env` mit deinen Schlüsseln:

```env
GOOGLE_API_KEY=DEIN_GOOGLE_SCHLUESSEL
ANTHROPIC_API_KEY=DEIN_ANTHROPIC_SCHLUESSEL
OPENROUTER_API_KEY=DEIN_OPENROUTER_SCHLUESSEL
PERPLEXITY_API_KEY=DEIN_PERPLEXITY_SCHLUESSEL
DEEPSEEK_API_KEY=DEIN_DEEPSEEK_SCHLUESSEL
OPENAI_API_KEY=DEIN_OPENAI_SCHLUESSEL
# PORT=3000 (optional)
```
**Wichtig:** Füge `.env` zu deiner `.gitignore` hinzu!

## Verwendete Technologien

-   **Frontend:** HTML, CSS, JavaScript, Marked.js, Highlight.js
-   **Backend:** Node.js, Express.js, Multer, Dotenv, Cookie-Parser
-   **KI SDKs:** `@google/generative-ai`, `@anthropic-ai/sdk`, `openai`

## Wichtige Hinweise

-   Die Benutzerauthentifizierung in `users.json` ist sehr einfach gehalten und nicht für Produktionsumgebungen mit hohen Sicherheitsanforderungen gedacht.
-   Stelle sicher, dass deine API-Schlüssel korrekt in `server/.env` eingetragen und die Datei vor unbefugtem Zugriff geschützt ist.

## Autor

Mathieu (aus `server/package.json`)
