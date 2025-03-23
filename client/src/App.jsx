import React, { useState } from 'react';
import axios from 'axios';

function App() {
    const [notebook, setNotebook] = useState(null);
    const [language, setLanguage] = useState("English");

    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [downloadReady, setDownloadReady] = useState(false);
    const[fileName, setFileName] = useState(null);

    // ✅ Handle File Upload
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        console.log(e.target.files);
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = async (event) => {
            const content = event.target.result;
            console.log(content);
            setLoading(true);  // Start loading

            try {
                const res = await axios.post('http://localhost:5004/upload', { notebook: content, language });
                function formatResponse(response) {
                    // Replace "### " with a space
                    response = response.replace(/###\s*/g, " ");
                    
                    // Replace "**" with a space
                    response = response.replace(/\*\*/g, " ");
                    
                    return response;
                }
                
                setResponse(formatResponse(res.data.documentation));
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
        <div className="min-h-screen p-6 text-center bg-gray-900 text-white">
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
                <option value="Japanese">Japanese</option>
            </select>
            <br />

            <br />
            {/* ✅ Upload Button */}
            <div className="justify-center">
                <label
                    htmlFor="fileUpload"
                    className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Upload File
                </label>
                <input
                    id="fileUpload"
                    type="file"
                    accept=".ipynb"
                    onChange={handleUpload}
                    className="hidden"
                />
                {fileName && <p className="text-white mt-6">Selected File: {fileName}</p>}
            </div>


            {/* ✅ Loading Spinner */}
            {loading && (
                <div className="text-yellow-300 mb-4 mt-7">
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
                <div className="mt-6 p-4 bg-gray-800 rounded-md shadow-lg text-left">
                    <h2 className="text-xl font-semibold mb-2 text-center">Generated Documentation:</h2>
                    <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto p-2 rounded-md bg-gray-700">
                        {response}
                    </pre>
                </div>
            )}

        </div>
    );
}

export default App;
