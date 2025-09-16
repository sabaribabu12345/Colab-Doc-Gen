const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { AppError } = require('../utils/errorHandler');
const openRouterService = require('../services/openRouterService');
const pdfService = require('../services/pdfService');
const config = require('../config/config');

class DocumentationController {
    async generateDocumentation(req, res, next) {
        try {
            const { notebooks, language } = req.body;

            if (!notebooks || notebooks.length === 0) {
                throw new AppError('No notebook files provided', 400);
            }

            if (!config.supportedLanguages.includes(language)) {
                throw new AppError('Unsupported language', 400);
            }

            // Process notebooks
            const contents = await this._processNotebooks(notebooks);

            // Generate documentation using OpenRouter
            const documentation = await openRouterService.generateDocumentation(contents, language);

            // Generate PDF
            await pdfService.generatePDF(documentation);

            res.json({ documentation });
        } catch (error) {
            next(error);
        }
    }

    async downloadPDF(req, res, next) {
        try {
            const pdfPath = path.join(__dirname, '../../', config.outputDir, 'documentation.pdf');
            
            if (!fs.existsSync(pdfPath)) {
                throw new AppError('PDF not found. Please generate it first.', 404);
            }

            res.download(pdfPath);
        } catch (error) {
            next(error);
        }
    }

    async _processNotebooks(notebooks) {
        const tempDir = path.join(__dirname, '../../', config.tempDir);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        try {
            const contents = notebooks.map((notebook, index) => {
                const filePath = path.join(tempDir, `uploaded_notebook_${index}.ipynb`);
                fs.writeFileSync(filePath, notebook);

                const result = JSON.parse(execSync(`python3 scripts/process_notebook.py ${filePath}`));
                return result.markdown.concat(result.code).join("\n");
            }).join("\n\n");

            return contents;
        } finally {
            // Cleanup temporary files
            fs.readdirSync(tempDir).forEach(file => {
                fs.unlinkSync(path.join(tempDir, file));
            });
        }
    }
}

module.exports = new DocumentationController(); 