const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

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

app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

const PORT = process.env.PORT || 5004;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
console.log("🔑 OpenRouter API Key:", OPENROUTER_API_KEY);

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// ✅ Generate PDF using Puppeteer
async function generatePDF(content) {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const pdfPath = path.join(outputDir, 'documentation.pdf');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(`
        <html>
            <head>
                <title>Colab Documentation</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        line-height: 1.6;
                        color: #333;
                    }
                    h1, h2, h3, h4 {
                        color: rgb(106, 0, 255);
                        margin-bottom: 10px;
                    }
                    h1 {
                        font-size: 28px;
                    }
                    h2 {
                        font-size: 24px;
                    }
                    h3 {
                        font-size: 20px;
                    }
                    p {
                        margin: 8px 0;
                    }
                    .section {
                        margin-bottom: 20px;
                    }
                    .highlight {
                        color: #333;
                        background-color: #f4f4f4;
                        padding: 5px;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="section">
                    ${content.replace(/\n/g, '<br>')}
                </div>
            </body>
        </html>
    `);

    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    await browser.close();

    return pdfPath;
}

// API Routes
app.post('/api/upload', async (req, res) => {
    try {
        const { notebooks, language } = req.body;
        if (!notebooks || notebooks.length === 0) {
            return res.status(400).json({ error: 'No notebook files provided' });
        }

        // Process notebooks
        const contents = notebooks.map((notebook, index) => {
            const filePath = path.join(__dirname, 'temp', `uploaded_notebook_${index}.ipynb`);
            fs.writeFileSync(filePath, notebook);
            return notebook;
        }).join("\n\n");

        // For now, just echo back the content
        res.json({ documentation: contents });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error processing notebooks' });
    }
});

app.get('/api/download', (req, res) => {
    const filePath = path.join(__dirname, 'output', 'documentation.pdf');
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: "PDF not found. Please generate it first." });
    }
});

// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({ 
        error: 'Not Found',
        path: req.url,
        method: req.method
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message
    });
});

// Create necessary directories
const dirs = ['temp', 'output'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Test the server at http://localhost:${PORT}/test`);
});
