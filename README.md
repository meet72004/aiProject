# AI Exam Assistant

A full-stack app to help with exam preparation: upload materials, generate questions, and practice with MCQs.

## Stack

- **Frontend:** React (in `frontend/`)
- **Backend:** Node.js + Express (in `backend/`)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

2. **Backend environment**
   - Copy `backend/.env.example` to `backend/.env`
   - Add your config (e.g. database URL, API keys)

3. **Run**
   - **Dev:** run frontend (`npm start` in `frontend/`) and backend (`npm start` in `backend/`) separately
   - **Single port (build + serve):**
     ```bash
     npm run single
     ```
     This builds the frontend and starts the backend, which serves both the API and the app.

## Scripts (root)

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm run build`| Build the frontend                   |
| `npm run start`| Start the backend server             |
| `npm run single`| Build frontend, then start backend  |
