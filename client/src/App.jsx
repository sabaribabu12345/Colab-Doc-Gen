import React, { useState } from 'react';
import axios from 'axios';

function App() {
    const [notebooks, setNotebooks] = useState([]);
    const [language, setLanguage] = useState("English");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [downloadReady, setDownloadReady] = useState(false);
    const [fileNames, setFileNames] = useState([]);
    

    // ✅ Handle Multiple File Uploads
    const handleUpload = async (e) => {
        const files = Array.from(e.target.files); // Convert FileList to Array
        if (files.length === 0) return;

        setFileNames(files.map(file => file.name));

        try {
            // Read all files asynchronously
            const notebooks = await Promise.all(
                files.map(file => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (event) => resolve(event.target.result);
                        reader.onerror = reject;
                        reader.readAsText(file);
                    });
                })
            );

            setLoading(true);  // Start loading

            try {
                // ✅ Send multiple notebooks to the backend
                const res = await axios.post('http://localhost:5004/upload', { notebooks, language });
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
        } catch (error) {
            console.error("Error reading files:", error);
            setResponse("Error reading the files.");
        }
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
                    Upload Files
                </label>
                <input
                    id="fileUpload"
                    type="file"
                    accept=".ipynb"
                    onChange={handleUpload}
                    className="hidden"
                    multiple  // Allow multiple file selection
                />
                {fileNames.length > 0 && (
                    <div className="mt-4 text-white">
                        <h3>Selected Files:</h3>
                        <ul>
                            {fileNames.map((name, index) => (
                                <li key={index}>{name}</li>
                            ))}
                        </ul>
                    </div>
                )}
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
