import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [urls, setUrls] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    // Extract Google Drive file IDs and construct direct download links
    const urlList = urls
      .split("\n")
      .map((u) => {
        const match = u.match(/q=([^&]+)/); // Extract the "q" parameter from the URL
        if (match) {
          const decodedUrl = decodeURIComponent(match[1]);
          const driveMatch = decodedUrl.match(/\/file\/d\/([^/]+)/); // Extract the file ID from the URL
          return driveMatch
            ? `https://drive.google.com/uc?id=${driveMatch[1]}`
            : null;
        }
        return null;
      })
      .filter(Boolean);

    console.log("🚀 ~ handleSubmit ~ urlList:", urlList);

    if (urlList.length === 0) {
      alert("No valid Google Drive URLs found.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5004/download-zip", // Ensure this matches your backend URL
        { urls: urlList },
        { responseType: "blob" }
      );
      console.log("🚀 ~ handleSubmit ~ response:", response);

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "download.zip";
      link.click();
    } catch (err) {
      console.log("🚀 ~ handleSubmit ~ err:", err);
      console.error("Error during file download:", err);
      alert("Something went wrong. Check the console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Google Drive File Downloader</h1>
      <textarea
        placeholder="Paste Google Drive redirect URLs here (one per line)"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        rows={10}
        cols={60}
      />
      <br />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Processing..." : "Download ZIP"}
      </button>
      <footer style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#888" }}>
        Created by Sadish {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
