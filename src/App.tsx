import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [urls, setUrls] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      const response = await axios.post(
        "http://localhost:5000/download-zip",
        { urls: urlList },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "download.zip";
      link.click();
    } catch (err) {
      alert("Something went wrong. Check the console.");
      console.error(err);
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
    </div>
  );
}

export default App;
