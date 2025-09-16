const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const documentationRoutes = require('./routes/documentationRoutes');
const { handleError } = require('./utils/errorHandler');
const config = require('./config/config');

const app = express();

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: config.maxFileSize }));
app.use(bodyParser.urlencoded({ limit: config.maxFileSize, extended: true }));

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Routes
app.use('/api', documentationRoutes);

// 404 handler
app.use((req, res, next) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({ 
        error: 'Not Found',
        path: req.url,
        method: req.method
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    handleError(err, res);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = app; 