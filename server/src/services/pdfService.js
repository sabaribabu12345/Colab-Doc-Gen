const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { AppError } = require('../utils/errorHandler');

class PDFService {
    constructor() {
        this.outputDir = path.join(__dirname, '../../', config.outputDir);
        this.ensureOutputDirectory();
    }

    ensureOutputDirectory() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async generatePDF(content) {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setContent(this._createHTML(content));

            const pdfPath = path.join(this.outputDir, 'documentation.pdf');
            await page.pdf({
                path: pdfPath,
                ...config.pdfOptions
            });

            return pdfPath;
        } catch (error) {
            throw new AppError('Failed to generate PDF', 500);
        } finally {
            await browser.close();
        }
    }

    _createHTML(content) {
        return `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Technical Documentation</title>
                <style>
                    :root {
                        --primary-color: rgb(106, 0, 255);
                        --text-color: #333;
                        --bg-color: #fff;
                        --code-bg: #f4f4f4;
                        --border-radius: 5px;
                    }

                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        line-height: 1.6;
                        color: var(--text-color);
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }

                    h1, h2, h3, h4 {
                        color: var(--primary-color);
                        margin: 1.5em 0 0.5em;
                        line-height: 1.2;
                    }

                    h1 { font-size: 2em; }
                    h2 { font-size: 1.75em; }
                    h3 { font-size: 1.5em; }
                    h4 { font-size: 1.25em; }

                    p {
                        margin: 1em 0;
                    }

                    .section {
                        margin: 2em 0;
                        padding: 1em;
                        border-left: 4px solid var(--primary-color);
                        background-color: rgba(106, 0, 255, 0.05);
                    }

                    .highlight {
                        background-color: var(--code-bg);
                        padding: 0.5em;
                        border-radius: var(--border-radius);
                        font-family: 'Courier New', Courier, monospace;
                    }

                    ul, ol {
                        margin: 1em 0;
                        padding-left: 2em;
                    }

                    li {
                        margin: 0.5em 0;
                    }

                    .summary {
                        background-color: var(--code-bg);
                        padding: 1em;
                        border-radius: var(--border-radius);
                        margin: 2em 0;
                    }

                    @media print {
                        body {
                            padding: 0;
                        }
                        
                        .section {
                            break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="section">
                    ${content.replace(/\n/g, '<br>')}
                </div>
            </body>
        </html>
        `;
    }
}

module.exports = new PDFService(); 