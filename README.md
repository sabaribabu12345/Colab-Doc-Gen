# Jupyter Notebook Documentation Generator

A full-stack AI tool that generates professional documentation from Jupyter notebooks. The application uses OpenRouter API for AI-generated documentation and Puppeteer for PDF generation.

## Features

- Upload multiple Jupyter notebooks
- AI-powered documentation generation
- Multilingual support
- Professional PDF output
- Drag-and-drop file upload
- Progress tracking
- Modern, responsive UI

## Tech Stack

### Frontend
- React
- Vite
- TailwindCSS
- React Dropzone

### Backend
- Node.js
- Express
- OpenRouter API
- Puppeteer

## Prerequisites

- Node.js >= 18.0.0
- Python 3.x (for notebook processing)
- OpenRouter API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd document-generator
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create environment files:

Create `.env` in the server directory:
```
PORT=5004
OPENROUTER_API_KEY=your_openrouter_api_key
```

4. Start the development servers:

```bash
# Start the backend server (from server directory)
npm run dev

# Start the frontend development server (from client directory)
npm run dev
```

## Usage

1. Open the application in your browser (default: http://localhost:5173)
2. Select your preferred documentation language
3. Drag and drop your Jupyter notebook files or click to select them
4. Click "Generate Documentation"
5. Once processing is complete, download the generated PDF

## Deployment

### Backend (Railway)
1. Create a new Railway project
2. Connect your GitHub repository
3. Add environment variables
4. Deploy

### Frontend (Vercel)
1. Create a new Vercel project
2. Connect your GitHub repository
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables
5. Deploy

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 