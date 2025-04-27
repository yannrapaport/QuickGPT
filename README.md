QuickGPT

# Introduction
QuickGPT is a minimalist web and mobile PWA that lets you have one-shot, ephemeral conversations with OpenAI’s ChatGPT. It’s designed to be:
* Simple – one question at a time, no history stored
* Fast – instant responses, mobile-first design
* Scalable – with a “Continue in ChatGPT” button to pick up longer chats in the official app
* Helpful – automatic “quick answers” guide the user after each response

# Getting Started
* Clone this repository
* Install dependencies  
  ```bash
  npm install
  ```
* Start the server  
  ```bash
  npm start
  ```
* Open your browser at `http://localhost:5000` (or your Replit URL)

# Features
* One-shot Q&A: ask a single question and get an instant reply
* Automatic follow-up suggestions (“quick answers”) after each response
* Mobile-first PWA: installable on phone, no app store required
* “Continue in ChatGPT” button to resume complex conversations

# Project Structure
* `src/`
  * `server.js` – Express backend & OpenAI API integration
  * `public/` – static assets (HTML, JS, CSS, images)
* `tests/` – placeholder for future unit and integration tests
* `.replit` – Replit configuration for both Run and Deployment
* `package.json` – dependencies and npm scripts

# NPM Scripts
* `npm start` – install deps & launch Express server
* `npm test` – placeholder for tests (currently echoes “No tests yet”)

# Configuration
Set your OpenAI API key in the environment before running:  
```bash
export OPENAI_API_KEY=your_key_here
```

# Deployment
* Configured for Replit Cloud Run via `.replit`
* Exposes port 5000 locally and port 80 externally
* Uses `npm install && npm start` for both dev and production

# Contributing
* Fork the repo and create a feature branch
* Add or update tests in `tests/`
* Run `npm run lint` and `npm test` before submitting a PR
* All contributions are welcome!

# License
© 2025 The Product Guy. All rights reserved.
