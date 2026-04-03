# Healthtraco

A secure and responsive health document management backend, utilizing Express, Node.js, and MongoDB GridFS.

## Overview
Healthtraco allows users to securely register, login, and upload large medical documents such as lab results and health records. Because of the use of MongoDB **GridFS**, document storage is unlimited and efficiently split into manageable chunks within the database. The frontend features a highly responsive, modern Medical Digital Security aesthetic using glassmorphism and subtle gradients.

## Features
- **Authentication**: Secure bcrypt password hashing and session-based auth with `connect-mongo`.
- **Document Management**: Upload securely to GridFS.
- **Vault Viewer**: View documents inline securely using streams.
- **Downloads & Deletions**: Securely download your cryptographically safe documents or permanently delete them from the vault block.
- **Medical Vault Aesthetics**: Modern CSS/UI layout that scales reliably across all mobile and desktop devices.
- **Express-validator**: Solid server-side input validation on authentication routes.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB Cluster/Instance

## Setup & Deployment

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "Healthtraco backend backup"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Make a `.env` file in the root with the following:
   ```env
   MONGO_URI=your_mongodb_connection_string
   SESSION_SECRET=your_secure_session_secret
   PORT=3000
   ```

4. **Start the application:**
   You can run the server directly using:
   ```bash
   npm start
   ```

5. **Visit the Dashboard:**
   Open a browser to `http://localhost:3000` to start using your Healthtraco vault.
