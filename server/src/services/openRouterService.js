const axios = require('axios');
const config = require('../config/config');
const { AppError } = require('../utils/errorHandler');

class OpenRouterService {
    constructor() {
        this.apiKey = config.openRouterApiKey;
        this.apiUrl = config.openRouterApiUrl;
        this.model = config.model;
    }

    async generateDocumentation(content, language) {
        if (!this.apiKey) {
            throw new AppError('OpenRouter API key is not configured', 500);
        }

        if (!content) {
            throw new AppError('No content provided for documentation generation', 400);
        }

        const prompt = this._createPrompt(content, language);
        console.log('📝 Generated prompt for documentation');
        
        for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt} of ${config.maxRetries} to generate documentation`);
                
                const response = await axios.post(
                    this.apiUrl,
                    {
                        model: this.model,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a documentation AI that writes clean technical reports from Jupyter Notebooks.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 2000
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'http://localhost:5173', // Required by OpenRouter
                            'X-Title': 'Jupyter Notebook Documentation Generator'
                        },
                        timeout: 30000 // 30 second timeout
                    }
                );

                if (!response.data || !response.data.choices || !response.data.choices[0]) {
                    throw new Error('Invalid response format from OpenRouter API');
                }

                console.log('✅ Successfully generated documentation');
                return response.data.choices[0].message.content;
            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed:`, {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });

                if (attempt === config.maxRetries) {
                    throw new AppError(
                        `Failed to generate documentation after ${config.maxRetries} attempts. Last error: ${error.message}`,
                        500
                    );
                }

                const delay = config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`⏳ Waiting ${delay}ms before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    _createPrompt(content, language) {
        return `
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

Language the documentation should be in: ${language}

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

Now, generate the documentation accordingly:
${content}
`;
    }
}

module.exports = new OpenRouterService(); 