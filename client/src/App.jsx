import React, { useState } from 'react';
import axios from 'axios';

function App() {
    const [notebook, setNotebook] = useState(null);
    const [language, setLanguage] = useState("English");

    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [downloadReady, setDownloadReady] = useState(false);

    // ✅ Handle File Upload
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            const content = event.target.result;
            setLoading(true);  // Start loading

            try {
                const res = await axios.post('http://localhost:5004/upload', { notebook: content,language });
                setResponse(res.data.documentation);
                setDownloadReady(true);  // Enable download
            } catch (error) {
                console.error("Upload failed:", error);
                setResponse("Error processing the file.");
            } finally {
                setLoading(false);  // Stop loading
            }
        };

        reader.readAsText(file);
    };

    // ✅ Download PDF
    const downloadPDF = async () => {
        try {
            const response = await axios.get('http://localhost:5004/download', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'documentation.pdf');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error("Error downloading PDF:", error);
        }
    };

    return (
        <div className="min-h-screen p-6 bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-6">📚 Colab Documentation Generator</h1>

            <br />
            <label>Select Language:</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Hindi">Hindi</option>
            </select>
            <br />
            
            <br/>
            {/* ✅ Upload Button */}
            <input 
                type="file" 
                accept=".ipynb" 
                onChange={handleUpload} 
                className="mb-4 block p-2 border border-gray-700 bg-gray-800 text-white rounded-md"
            />
            

            {/* ✅ Loading Spinner */}
            {loading && (
                <div className="text-yellow-300 mb-4">
                    🌀 Generating documentation... Please wait.
                </div>
            )}

            {/* ✅ Download Button */}
            {downloadReady && (
                <button 
                    onClick={downloadPDF} 
                    className="mt-4 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md"
                >
                    📥 Download PDF
                </button>
            )}

            {/* ✅ Display Documentation */}
{response && (
    <div className="mt-6 p-4 bg-gray-800 rounded-md shadow-lg">
        <h2 className="text-xl font-semibold mb-2">Generated Documentation:</h2>
        <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto p-2 rounded-md bg-gray-700">
            {response}
        </pre>
    </div>
)}

        </div>
    );
}

export default App;
