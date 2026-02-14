import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import AppHeader from "../components/AppHeader";
import ElectricBorder from "../components/ElectricBorder";
import "./UploadPage.css";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const chosen = e.target.files?.[0];
    if (chosen) {
      setFile(chosen);
      setUploadMessage("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setUploadMessage("");
    }
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const uploadFile = async () => {
    if (!file) {
      setUploadMessage("Please select or drop a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setUploadMessage("");

      const res = await axios.post("/upload", formData);

      setUploadMessage(res.data.message || "File uploaded successfully.");
      // Pass limits to choose page so we can show "extracted X, max for AI Y"
      const limits = {
        extractedLength: res.data.extractedLength,
        maxTextForAi: res.data.maxTextForAi,
        truncatedForAi: res.data.truncatedForAi,
      };
      setTimeout(() => navigate("/choose", { state: limits }), 800);
    } catch (error) {
      console.error(error);
      const serverMsg = error.response?.data?.error;
      setUploadMessage(serverMsg || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <AppHeader />
      <h1 className="upload-title">Upload your study material</h1>
      <p className="upload-subtitle">Get started by uploading a file</p>

      <ElectricBorder
        color="#0d9488"
        speed={1}
        chaos={0.12}
        thickness={2}
        style={{ borderRadius: 20 }}
        className="upload-zone-electric"
      >
        <div
          className={`upload-zone ${isDragging ? "upload-zone--dragging" : ""} ${file ? "upload-zone--has-file" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFilePicker}
        >
          <input
            ref={inputRef}
            type="file"
            className="upload-input-hidden"
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          <span className="upload-plus">+</span>
          <p className="upload-zone-text">
            {file ? file.name : "Click or drag file here"}
          </p>
          <p className="upload-zone-hint">PDF, DOCX, TXT or MD</p>
        </div>
      </ElectricBorder>

      <button
        type="button"
        className="upload-btn"
        onClick={(e) => {
          e.stopPropagation();
          uploadFile();
        }}
        disabled={!file || isUploading}
      >
        {isUploading ? "Uploading…" : "Upload"}
      </button>

      {uploadMessage && (
        <p className={`upload-message ${uploadMessage.includes("failed") || uploadMessage.includes("could not") ? "upload-message--error" : ""}`}>
          {uploadMessage}
        </p>
      )}
    </div>
  );
}
