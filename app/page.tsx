// app/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setAudioFile(file);
    setAudioURL(URL.createObjectURL(file));
    setTranscript("");
    setSummary("");
    setFileSize((file.size / (1024 * 1024)).toFixed(1));
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;
    setLoading(true);
    setSummary("");

    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("prompt", "");
    formData.append("language", "en");
    formData.append("temperature", "0.0");

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Transcription failed");
      }
      const data = await res.json();
      setTranscript(data.text);
    } catch (error) {
      console.error("Error during transcription:", error);
      setTranscript("An error occurred during transcription.");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (currentTranscript: string) => {
    if (!currentTranscript) return;
    setSummaryLoading(true);

    try {
      const res = await fetch("/api/chat/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: currentTranscript }),
      });

      if (!res.ok) {
        throw new Error("Summary generation failed");
      }
      const data = await res.json();
      setSummary(data.summary);
    } catch (error) {
      console.error("Error during summarization:", error);
      setSummary("An error occurred during summarization.");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (transcript) {
      handleSummarize(transcript);
    }
  }, [transcript]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4">
        <h1 className="text-2xl font-bold">Audio Transcription & Summary</h1>
      </header>
      <main className="p-4 max-w-3xl mx-auto">
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 ${
            isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
        >
          <p className="mb-2 text-gray-600">
            Drag and drop your audio file here, or click to select a file.
          </p>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
            id="fileInput"
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer text-blue-600 underline"
          >
            Choose file
          </label>
        </div>

        {audioURL && (
          <div className="mb-4 relative">
            <audio controls src={audioURL} className="w-full">
              Your browser does not support the audio element.
            </audio>
            {/* File size display */}
            {fileSize && (
              <div className="absolute top-1 right-1 text-xs text-gray-500">
                {fileSize} MB
              </div>
            )}
          </div>
        )}

        {audioFile && (
          <button
            onClick={handleTranscribe}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Transcribing..." : "Transcribe"}
          </button>
        )}

        {transcript && (
          <div className="mt-6 p-4 bg-white rounded shadow">
            {summaryLoading && (
              <div className="mb-4">
                <p className="text-gray-600">Summarizing....</p>
              </div>
            )}
            <h2 className="text-xl font-semibold mb-2">Transcription</h2>
            <p className="whitespace-pre-wrap text-gray-800">{transcript}</p>
          </div>
        )}

        {summary && (
          <div className="mt-6 p-4 bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <p className="whitespace-pre-wrap text-gray-800">{summary}</p>
          </div>
        )}
      </main>
    </div>
  );
}
