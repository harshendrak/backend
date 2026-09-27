# Orbit Minimal Local Backend

This is a minimal in-memory backend for the Orbit Android app, built with Express and TypeScript.

## Prerequisites
- Node.js installed

## How to run

1. Navigate to this directory (`backend`).
2. Copy `.env.example` to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
   (Fill in the `JWT_SECRET` with a secure random string if you wish to override the local fallback).
3. Run the server using `ts-node`:
   ```bash
   npx tsx server.ts
   ```
4. The server will start and listen on `0.0.0.0:4000` (or whatever `PORT` is defined in your environment variable). On Render, the `PORT` is automatically overridden.

## Connecting from an Android device

To test from a physical Android device or an emulator, you cannot use `localhost` or `127.0.0.1` because the device has its own loopback network.

1. **Find your computer's LAN IP address**:
   - On Windows: Run `ipconfig` in PowerShell or Command Prompt and look for the "IPv4 Address" (e.g., `192.168.1.5`).
   - On Mac/Linux: Run `ifconfig` or `ip a`.
2. **Update your Android App**:
   - In your Android app's Retrofit setup (likely in `NetworkModule.kt`), change the base URL to `http://<YOUR_LAN_IP>:4000/`.
   - Make sure your device and computer are on the **same Wi-Fi network**.
   - Note: Because this uses `http://` (cleartext traffic), you must ensure `android:usesCleartextTraffic="true"` is set in your `AndroidManifest.xml` under the `<application>` tag for development.

## Seeded Data
A test user is automatically seeded when the server starts so you can test logging in immediately:
- **Email:** `test@example.com`
- **Password:** `password123`
