// Configures the Express application with middleware, routes, and error handling

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json({ limit: '5mb' }));

// Configure CORS to allow requests from the frontend application
app.use(cors({
  origin: [process.env.WEB_UI_ORIGIN, "http://localhost:8081"],
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// test - verify that the web server is running
app.get('/', (req, res) => {
  res.send('Web server is running');
});

const currentUser = require('./middleware/currentUser')
app.use(currentUser);

const filesRoutes = require('./routes/files');
const requireAuth = require('./middleware/requireAuth');
app.use('/api/files', requireAuth, filesRoutes);

const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);

app.use('/static', express.static(path.join(__dirname, '..', 'public')));
const tokensRoutes = require('./routes/tokens');
app.use('/api/tokens', tokensRoutes);

const searchRoutes = require('./routes/search');
app.use('/api/search', requireAuth, searchRoutes);

// handle unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// handle unexpected errors (TCP errors, runtime exceptions)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export the Express app
module.exports = app;
