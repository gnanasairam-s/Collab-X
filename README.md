# 🎥 CollabX - Real-Time Video Conferencing Platform

A full-stack video conferencing web application built with the MERN stack, enabling real-time communication with HD video calls, screen sharing, instant chat, and more.

## 🚀 Live Demo

**[Try it now →](https://collab-x-lac.vercel.app)**

## ✨ Features

- 🎥 **HD Video Calls** - Real-time peer-to-peer video communication using WebRTC
- 💬 **Real-time Chat** - Instant messaging during meetings via Socket.io
- 🖥️ **Screen Sharing** - Share your screen with meeting participants
- 👥 **Multi-Participant** - Support for multiple users in a single meeting
- 😊 **Reactions** - Send emoji reactions during calls
- ✋ **Raise Hand** - Notify the host when you want to speak
- 🔐 **Authentication** - Secure login/register with JWT tokens
- 👤 **Guest Access** - Join meetings without creating an account
- 📋 **Meeting History** - Track your past meetings
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean, professional interface built with Material UI

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **Material UI (MUI)** - Component library
- **Socket.io-client** - Real-time communication
- **WebRTC** - Peer-to-peer video/audio
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - WebSocket server
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **bcrypt** - Password hashing
- **JWT** - Authentication tokens

### DevOps
- **Render** - Backend deployment
- **Vercel** - Frontend deployment
- **MongoDB Atlas** - Cloud database
- **Git/GitHub** - Version control

## 🏗️ Project Structure

```
CollabX/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── socketManager.js
│   │   │   └── user.controller.js
│   │   ├── models/
│   │   │   ├── meeting.model.js
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   └── users.routes.js
│   │   └── app.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── environment.js
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gnanasairam-s/Collab-X.git
   cd Collab-X
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in `backend/`:
   ```
   PORT=8000
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

5. **Run the app**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## 📡 API Endpoints

| Method | Endpoint                          | Description                |
|--------|------------------------------------|-----------------------------|
| POST   | `/api/v1/users/register`           | Register new user           |
| POST   | `/api/v1/users/login`              | Login user                   |
| GET    | `/api/v1/users/get_all_activity`   | Get meeting history          |
| POST   | `/api/v1/users/add_to_activity`    | Add meeting to history       |
| DELETE | `/api/v1/users/delete_meeting`     | Delete meeting from history  |

## 🔒 Environment Variables

| Variable               | Description                          |
|-------------------------|---------------------------------------|
| `PORT`                  | Server port (default: 8000)           |
| `MONGODB_URI`           | MongoDB connection string             |
| `REACT_APP_BACKEND_URL` | Backend API URL (frontend)            |

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Gnanasai Ram S**
GitHub: [@gnanasairam-s](https://github.com/gnanasairam-s)
