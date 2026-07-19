# Bhaashaa - Learn any language using AI 🗣️

Bhaashaa is a comprehensive flashcard and vocabulary learning application tailored for individuals looking to learn any language (especially Indian languages) through a language they already know. Built with a modern tech stack (React, Vite, Tailwind CSS, Firebase), Bhaashaa uses AI-generated context-aware sentences to help users learn languages practically.

## Features

- **Spaced Repetition Flashcards**: Review words through our flashcard interface to master your vocabulary. Mastered words go to a dedicated 'Learned' section.
- **AI Sentence Generator**: Dynamically generate new sentences (with transliteration and translations) on varied everyday topics powered by Google's Gemini API. 
- **AI Translation**: Translate any sentence into your target language to build your customized vocabulary. Provides word-by-word meaning breakdown.
- **Quiz System**: Test your knowledge and track your improvement with comprehensive quizzes generated from your vocabulary.
- **Cloud Syncing**: Seamlessly save your progress, flashcards, and quiz statistics to Firebase Firestore, accessible across all your devices.
- **Zero Duplicate Management**: Ensure your vocabulary stays clean with automated duplicate checks whenever adding new sentences.

## Screenshots

<div style="display: flex; flex-wrap: wrap; gap: 10px;">
  <img src="src/images/Screenshot%202026-06-25%20at%209.38.34%E2%80%AFPM.png" width="400" alt="Dashboard" />
  <img src="src/images/Screenshot%202026-06-25%20at%209.38.42%E2%80%AFPM.png" width="400" alt="Flashcards Front" />
  <img src="src/images/Screenshot%202026-06-25%20at%209.38.56%E2%80%AFPM.png" width="400" alt="Flashcards Back" />
  <img src="src/images/Screenshot%202026-06-25%20at%209.39.14%E2%80%AFPM.png" width="400" alt="Learned Words" />
  <img src="src/images/Screenshot%202026-06-25%20at%209.39.56%E2%80%AFPM.png" width="400" alt="Quiz Module" />
  <img src="src/images/Screenshot%202026-06-25%20at%209.41.52%E2%80%AFPM.png" width="400" alt="Translate Setup" />
  <img src="src/images/Screenshot%202026-06-25%20at%209.43.40%E2%80%AFPM.png" width="400" alt="Sentence Generation" />
  <img src="src/images/Screenshot%202026-06-25%20at%209.44.31%E2%80%AFPM.png" width="400" alt="Authentication" />
</div>

## Architecture

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons
- **Backend/AI Processing**: Express Server configured to interface with `@google/genai` (Gemini 2.5 Flash model)
- **Local Persistence**: Dexie.js (IndexedDB wrapper)
- **Cloud Database & Auth**: Firebase Authentication & Firestore (with offline capabilities & real-time syncing)

## Setup

1. Configure your `.env` with a valid `GEMINI_API_KEY`.
2. Install dependencies using `npm install`.
3. Start the dev server using `npm run dev`.
4. Connect or update the `firebase-applet-config.json` for persistent storage to work correctly.
