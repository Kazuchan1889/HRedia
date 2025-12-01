# Absensi Frontend

Install dependencies:

```
cd FE
npm install
```

Run dev server:

```
npm run dev
```

The frontend expects backend API at `http://localhost:4000`.

Notes about camera & attendance:
- The "Check In" and "Check Out" actions require taking a photo via your device camera. Allow camera permission in the browser when prompted.
- The UI enforces one check-in, one break, and one check-out per day. Photos are stored as base64 strings in the backend for this demo.

