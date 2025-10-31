const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Chat route
const chatRouter = require('./routes/chat');
app.use('/api/chat', chatRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});


