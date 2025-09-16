import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

function App() {
  const [notebooks, setNotebooks] = useState([]);
  const [language, setLanguage] = useState("English");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(true);

  // New options
  const [docStyle, setDocStyle] = useState("explanatory"); // concise / explanatory
  const [temperatureStyle, setTemperatureStyle] = useState("professional"); // professional / creative / casual

  // Dropzone
  const onDrop = useCallback((acceptedFiles) => {
    const ipynbFiles = acceptedFiles.filter(file => file.name.endsWith('.ipynb'));
    if (ipynbFiles.length === 0) {
      setError('Please upload only Jupyter notebook (.ipynb) files');
      return;
    }
    setNotebooks(ipynbFiles);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/x-ipynb+json': ['.ipynb'] }
  });

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleUpload = async () => {
    if (notebooks.length === 0) {
      setError('Please select at least one notebook file');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);
    setDownloadReady(false);

    // Map options to OpenAI parameters
    let temperature = 0.5;
    let max_tokens = 2048;
    switch (temperatureStyle) {
      case 'professional': temperature = 0.3; break;
      case 'creative': temperature = 0.8; break;
      case 'casual': temperature = 0.6; break;
    }
    switch (docStyle) {
      case 'concise': max_tokens = 1500; break;
      case 'explanatory': max_tokens = 3000; break;
    }

    try {
      const fileContents = await Promise.all(
        notebooks.map(file => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        }))
      );

      setProgress(30);

      const res = await axios.post('http://localhost:5004/upload', {
        notebooks: fileContents,
        language,
        temperature,
        max_tokens
      });

      setProgress(70);
      setResponse(res.data.documentation);
      setDownloadReady(true);
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.error || 'Error processing the files');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await axios.get('http://localhost:5004/download', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'documentation.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error downloading PDF');
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} min-h-screen p-6 transition-colors duration-300`}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold flex items-center gap-2">📚 AI Notebook Narrator</h1>
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 rounded font-semibold text-xl transition-colors"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
        </div>
        <p className="mb-8 text-gray-400">
          AI-powered tool to generate professional documentation from your Jupyter notebooks.
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
              className={`w-full p-2 rounded border focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Chinese">Chinese</option>
              <option value="Hindi">Hindi</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Documentation Style:</label>
            <select
              value={docStyle}
              onChange={(e) => setDocStyle(e.target.value)}
              className={`w-full p-2 rounded border focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
            >
              <option value="concise">Concise</option>
              <option value="explanatory">Explanatory</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tone / Creativity:</label>
            <select
              value={temperatureStyle}
              onChange={(e) => setTemperatureStyle(e.target.value)}
              className={`w-full p-2 rounded border focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
            >
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="casual">Casual</option>
            </select>
          </div>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all
            ${isDragActive
              ? 'border-blue-500 bg-blue-900/20 scale-105'
              : darkMode
                ? 'border-gray-700 hover:border-blue-500 hover:bg-gray-800/20'
                : 'border-gray-400 hover:border-blue-500 hover:bg-gray-200/20'}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? <p>Drop the notebook files here...</p> : <p>Drag & drop notebooks or click to select files (.ipynb)</p>}
        </div>

        {/* Selected files */}
        {notebooks.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Selected Files:</h3>
            <ul className="space-y-2">
              {notebooks.map((file, index) => (
                <li key={index} className={`flex items-center justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <span>{file.name}</span>
                  <button
                    onClick={() => setNotebooks(notebooks.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={`mt-4 p-4 rounded ${darkMode ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-red-200 border-red-400 text-red-800'}`}>
            {error}
          </div>
        )}

        {/* Progress */}
        {loading && (
          <div className="mt-6">
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-300'} w-full rounded-full h-2.5`}>
              <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="mt-2 text-center text-gray-400">Progress: {progress}%</p>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button
            onClick={handleUpload}
            disabled={loading || notebooks.length === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center
              ${loading || notebooks.length === 0 ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Generate Documentation
            {loading && <span className="ml-2 animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>}
          </button>

          {downloadReady && (
            <button
              onClick={downloadPDF}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
            >
              📥 Download PDF
            </button>
          )}
        </div>

        {/* Markdown Preview */}
        {response && (
          <div className={`mt-8 p-6 rounded-lg shadow-lg relative ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <button
              onClick={() => navigator.clipboard.writeText(response)}
              className={`absolute top-2 right-2 px-3 py-1 rounded font-semibold
                ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
            >
              Copy
            </button>
            <ReactMarkdown
              children={response}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={darkMode ? oneDark : oneLight}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>{children}</code>
                  );
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
