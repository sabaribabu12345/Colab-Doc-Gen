const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();



const app = express();
app.use(cors());
app.use(bodyParser.json());


const PORT = process.env.PORT || 5002;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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
                        color: #007bff;
                    }
                    pre {
                        background-color: #f4f4f4;
                        padding: 10px;
                        border-radius: 5px;
                        white-space: pre-wrap; /* Prevent line breaks */
                        overflow-x: auto;
                    }
                    code {
                        background-color: #e1e1e1;
                        padding: 4px;
                        border-radius: 4px;
                    }
                    .section {
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <h1>Generated Documentation</h1>
                <div class="section">
                    ${content.replace(/\n/g, '<br>')}
                </div>
            </body>
        </html>
    `);

    await page.pdf({ path: pdfPath, format: 'A4' });
    await browser.close();

    return pdfPath;
}

// ✅ Endpoint to download the generated PDF
app.get('/download', (req, res) => {
    const filePath = path.join(__dirname, 'output', 'documentation.pdf');
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: "PDF not found. Please generate it first." });
    }
});

// ✅ Upload Colab Notebook and Generate Documentation
// ✅ Upload Colab Notebook and Generate Documentation
app.post('/upload', (req, res) => {
    const { notebook } = req.body;
    if (!notebook) return res.status(400).json({ error: 'No notebook file provided' });

    const filePath = path.join(__dirname, 'scripts', 'uploaded_notebook.ipynb');
    fs.writeFileSync(filePath, notebook);

    exec(`python3 scripts/process_notebook.py ${filePath}`, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error processing notebook: ${stderr}`);
            return res.status(500).json({ error: 'Error processing notebook' });
        }

        const result = JSON.parse(stdout);
        const codeSnippets = result.code.join("\n");

        try {
            const prompt = `
You are an advanced AI code documentation generator. 
Your task is to analyze the given code and produce well-organized documentation that includes:

1. A high-level overview of the entire code's purpose and functionality.
2. An explanation of the underlying logic and flow of the code.
3. A breakdown of complex functions and their roles within the code.
4. Key concepts and approaches used in the code.
5. Practical insights and context to help a developer understand the code’s thought process.

Guidelines:
1. Do not include any code snippets.
2. Focus on explaining the logic and reasoning behind the code.
3. Make the documentation crisp, clear, and human-readable.
4. The maximum word count should be 2000.
5. The documentation should feel like a **knowledge transfer** to another developer.

Documentation Structure:

### Purpose of the Code
<Briefly explain what the code does and its primary goal.>

### High-Level Architecture
<Explain the architecture and how components are structured.>

### Logic and Workflow
<Describe the core logic and how the code operates step by step.>

### Key Concepts and Techniques
<Highlight important techniques, algorithms, and best practices used.>

### Challenges and Considerations
<Discuss potential issues, challenges faced, and how they are handled.>

### Summary and Future Improvements
<Provide a summary of the code’s strengths and suggest possible improvements.>

Now, process the given code and produce the documentation accordingly:

${codeSnippets}
`;


            // ✅ Call OpenRouter API to Generate Documentation
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: 'google/gemma-3-4b-it:free',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 2000,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const aiResponse = response.data.choices[0].message.content;

            // ✅ Generate PDF from the AI-generated documentation
            await generatePDF(aiResponse);

            res.json({ documentation: aiResponse });
        } catch (error) {
            console.error("❌ OpenRouter API Error:", error.response?.data || error.message);
            res.status(500).json({ error: 'Error processing AI request' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
