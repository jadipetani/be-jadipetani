require('dotenv').config();
const app = require('./app');
const { env } = require('./config/env');
require('./jobs/scheduledTasks');

const PORT = process.env.PORT || env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🌾 Jadipetani Backend running on http://${HOST}:${PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
});
