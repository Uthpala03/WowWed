const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'WowWed API is running!', appUrl: 'http://localhost:3001' });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`WowWed server running on port ${PORT}`);
});
