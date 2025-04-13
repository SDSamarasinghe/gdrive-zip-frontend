import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import "./App.css";

function App() {
  const [urls, setUrls] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showGift, setShowGift] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowGift(true), 2000);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase();
      if (fileExtension === "csv") {
        parseCSVFile(uploadedFile);
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        parseExcelFile(uploadedFile);
      } else {
        alert(
          "Unsupported file format. Please upload a .csv, .xlsx, or .xls file."
        );
      }
    }
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

      const extractedLinks = rows
        .flat()
        .filter((cell) => typeof cell === "string" && cell.startsWith("http"));
      setUrls((prevUrls) =>
        [...prevUrls.split("\n"), ...extractedLinks].join("\n")
      );
    };
    reader.readAsArrayBuffer(file);
  };

  const parseCSVFile = (file: File) => {
    Papa.parse(file, {
      complete: (result: any) => {
        const rows = result.data as string[][];
        const extractedLinks = rows
          .flat()
          .filter(
            (cell) => typeof cell === "string" && cell.startsWith("http")
          );
        setUrls((prevUrls) =>
          [...prevUrls.split("\n"), ...extractedLinks].join("\n")
        );
      },
      error: (err: any) => {
        console.error("Error parsing CSV file:", err);
        alert("Failed to parse the CSV file. Please check the file format.");
      },
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const urlList = urls
      .split("\n")
      .map((u) => {
        const match = u.match(/q=([^&]+)/);
        if (match) {
          const decodedUrl = decodeURIComponent(match[1]);
          const driveMatch = decodedUrl.match(/\/file\/d\/([^/]+)/);
          return driveMatch
            ? `https://drive.google.com/uc?id=${driveMatch[1]}`
            : null;
        }
        return null;
      })
      .filter(Boolean);

    if (urlList.length === 0) {
      alert("No valid Google Drive URLs found.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "https://gdrive-zip-backend.onrender.com/download-zip",
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
      console.error("Error during file download:", err);
      alert("Something went wrong. Check the console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {showGift && (
        <div className="gift-box">
          <div className="gift-lid" />
          <div className="gift-content">
            🎁 This is my New Year gift for you! 🎉
          </div>
        </div>
      )}
      <h1>Google Drive File Downloader</h1>
      <textarea
        placeholder="Paste Google Drive redirect URLs here (one per line)"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        rows={10}
        cols={60}
      />
      <br />
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
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
