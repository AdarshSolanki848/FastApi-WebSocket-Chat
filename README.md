# 💬 ChatSphere

A modern real-time chat application built with **FastAPI**, **WebSockets**, **SQLAlchemy**, and **JWT Authentication**.

ChatSphere is designed to be a scalable messaging platform with secure authentication, real-time messaging, and modern architecture. The project is being developed step-by-step to include features found in production-grade chat applications.

---

## ✨ Features

### Authentication
- User Registration
- User Login
- JWT Authentication
- Argon2 Password Hashing
- Protected Routes
- Client-side Validation

### Real-Time Chat
- WebSocket-based communication
- Multiple users chatting simultaneously
- Online user count
- Join/Leave notifications
- Typing indicator
- Duplicate username prevention (legacy implementation)

### Frontend
- Responsive Login & Register pages
- Modern Dark UI
- SVG Password Visibility Toggle
- Reusable API Layer
- Clean Project Structure

### Backend
- FastAPI
- SQLAlchemy ORM
- SQLite Database
- JWT Token Generation
- Password Hashing
- Modular Architecture

---

# 🛠 Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript (ES6)

## Backend

- FastAPI
- WebSockets
- SQLAlchemy
- SQLite
- JWT Authentication
- Argon2 Password Hashing

---

# 📂 Project Structure

```
ChatSphere/
│
├── backend/
│   ├── models.py
│   ├── database.py
│   ├── schemas.py
│   ├── auth.py
│   ├── main.py
│   │
│   ├── route/
│   │   └── auth.py
│   │
│   └── websocket/
│       ├── chat.py
│       └── manager.py
│
├── frontend/
│   ├── login.html
│   ├── register.html
│   ├── chat.html
│   │
│   ├── css/
│   │   ├── auth.css
│   │   └── chat.css
│   │
│   ├── js/
│   │   ├── api.js
│   │   ├── login.js
│   │   ├── register.js
│   │   └── chat.js
│   │
│   └── assets/
│       └── icons/
│
├── requirements.txt
└── README.md
```

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/yourusername/ChatSphere.git

cd ChatSphere
```

---

## Create Virtual Environment

### Windows

```bash
python -m venv .venv

.venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv .venv

source .venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Start Backend

```bash
cd backend

uvicorn main:app --reload
```

Backend runs on

```
http://127.0.0.1:8000
```

---

## Start Frontend

Open the frontend using **Live Server** (VS Code extension) or any static server.

---

# Authentication Flow

```
Register
      │
      ▼
Password Hashing (Argon2)
      │
      ▼
Store User in Database
      │
      ▼
Login
      │
      ▼
Verify Password
      │
      ▼
Generate JWT
      │
      ▼
Store JWT in Local Storage
      │
      ▼
Access Chat
```

---

# Database

Current database contains

## Users

| Field | Type |
|--------|------|
| id | Integer |
| username | String |
| hashed_password | String |
| created_at | DateTime |

---

# Current Features

- ✅ User Registration
- ✅ User Login
- ✅ JWT Authentication
- ✅ Password Hashing
- ✅ SQLAlchemy Integration
- ✅ SQLite Database
- ✅ Real-time Chat
- ✅ WebSockets
- ✅ Typing Indicator
- ✅ Online Users Counter
- ✅ Responsive Authentication UI

---

# Upcoming Features

- JWT Authentication for WebSocket
- Persistent Chat History
- Personal Chats
- Group Chats
- File Uploads
- Image Sharing
- Profile Pictures
- Read Receipts
- Message Search
- Emoji Picker
- Notifications
- User Settings
- Docker Support
- PostgreSQL
- Redis
- Background Task Queue (Celery)
- Deployment

---

# Screenshots

Coming Soon

---

# Contributing

Contributions, issues, and feature requests are welcome.

Feel free to fork the repository and submit a pull request.

---

# License

This project is licensed under the MIT License.

---

# Author

**Adarsh Singh Solanki**

GitHub: https://github.com/AdarshSolanki848

LinkedIn: https://www.linkedin.com/in/adarsh-singh-solanki/