const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const db = require('./models');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ensure uploads directory exists and serve static files
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api', routes);

app.get('/', (req, res) => res.json({ message: 'Absensi API' }));

const PORT = process.env.PORT || 4000;

db.sequelize.authenticate().then(() => {
  console.log('DB connected');
  app.listen(PORT, () => console.log('Server running on', PORT));
}).catch(err => {
  console.error('DB connection error', err);
  app.listen(PORT, () => console.log('Server running without DB on', PORT));
});
