require('dotenv').config();
const app = require('./app');
const { env } = require('./config/env');
require('./jobs/scheduledTasks');

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🌾 Jadipetani Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
});
