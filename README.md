# FastAPI WebSocket Chat

A real-time chat application built using **FastAPI**, **WebSockets**, **HTML**, **CSS**, and **Vanilla JavaScript**. This project was created to learn how real-time communication works from the ground up without using frontend frameworks.

## ✨ Features

* 💬 Real-time messaging using WebSockets
* 👤 Unique username registration
* 🚫 Duplicate username validation
* 🟢 Live online user count
* 📢 User joined and left notifications
* ⌨️ Real-time typing indicator with animated dots
* 👥 Supports multiple users typing simultaneously
* 🎨 Clean and responsive chat interface
* 📜 Auto-scrolling chat window
* 🔒 Server-controlled usernames to prevent message spoofing

## 🛠️ Tech Stack

* **Backend:** FastAPI, Uvicorn
* **Frontend:** HTML, CSS, Vanilla JavaScript
* **Communication:** WebSockets

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd FastApi-WebSocket-Chat
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate the virtual environment

**Windows**

```bash
.venv\Scripts\activate
```

**Linux/macOS**

```bash
source .venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Start the FastAPI server

```bash
uvicorn main:app --reload
```

### 6. Open the frontend

Open `frontend/index.html` in your browser.

## 📚 Concepts Practiced

* FastAPI WebSockets
* Asynchronous programming with `async`/`await`
* Connection management
* Real-time event broadcasting
* JSON-based communication
* Client-side state management
* Debouncing using `setTimeout`
* JavaScript `Set` for tracking typing users
* DOM manipulation
* Clean separation of frontend and backend responsibilities

## 🌱 Future Improvements

* Message persistence using SQLite
* Authentication and login
* Private messaging
* Chat rooms
* Message timestamps
* Read receipts
* File sharing
* Emoji support
* Deploy the application online
