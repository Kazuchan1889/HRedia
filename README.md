# Absensi Backend

Environment variables: copy `.env.example` to `.env` and adjust if needed.

Install dependencies:

```
cd BE
npm install
```

Run migrations (creates tables and seeds admin):

```
npm run migrate
```

Run server:

```
npm run dev
```

Default accounts created by migrate:
- admin / admin123 (role: admin)
- user1 / user123 (role: user)
