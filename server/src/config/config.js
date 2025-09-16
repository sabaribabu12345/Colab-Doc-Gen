const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 5004,
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    openRouterApiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: "mistralai/mistral-7b-instruct:free",
    maxFileSize: 500 * 1024 * 1024, // 500MB
    supportedLanguages: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Hindi', 'Japanese'],
    outputDir: 'output',
    tempDir: 'temp',
    maxRetries: 3,
    retryDelay: 2000, // Increased to 2 seconds
    pdfOptions: {
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
        }
    }
}; 