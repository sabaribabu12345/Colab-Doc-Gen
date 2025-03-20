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


const PORT = process.env.PORT || 5003;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
console.log("🔑 OpenRouter API Key:", OPENROUTER_API_KEY);

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
        const markdownContent = result.markdown.join("\n");

        try {
            const prompt = `
You are a professional technical writer and software architect. Your task is to generate a comprehensive and professional documentation for the given code. The documentation should be suitable for knowledge transfer or project handover. It should explain the code's purpose, logic, and architecture clearly and concisely.

Guidelines:
1. Do NOT include any raw code snippets in the documentation.
2. Maintain a professional and informative tone.
3. The content should be well-structured and formatted for readability.
4. Focus on explaining the logic, structure, and purpose rather than the code itself.
5. Avoid using special characters or unnecessary symbols.
6. Use plain language and clear formatting to enhance understanding.
7. Write the documentation as if explaining the project to a new team member.

Documentation Format:

Project Overview:
- Briefly describe the overall purpose and goal of the code.
- Mention key features or components implemented.

Architecture and Design:
- Explain the high-level architecture and structure of the code.
- Describe how different components interact with each other.

Key Functionalities:
- Describe the core functionalities and how they are implemented.
- Explain how each functionality contributes to the overall goal.

Workflow and Logic:
- Explain the logical flow of the code from start to finish.
- Provide insights into decision-making and process flow.

Key Concepts and Techniques:
- Highlight important concepts, techniques, or algorithms used.
- Mention any libraries or frameworks utilized and why they were chosen.

Error Handling and Performance:
- Discuss how errors are handled and how performance is optimized.
- Mention any security considerations or best practices followed.

Potential Challenges and Considerations:
- Identify potential challenges or issues faced during development.
- Discuss how these were addressed or mitigated.

Future Enhancements:
- Suggest areas for improvement or future upgrades.
- Mention any features that could be added to increase functionality or performance.

Summary:
- Summarize the key takeaways and the overall project impact.
- Include a brief note on maintenance and support.
No headers or titles or sub-headers are required.
Now, generate the documentation accordingly:
${markdownContent}
${codeSnippets}
`;


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
