// app/page.tsx
"use client";

import { useCallback, useState } from "react";

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const handleFile = (file: File) => {
    setAudioFile(file);
    setAudioURL(URL.createObjectURL(file));
    setTranscript("");
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

    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", "whisper-large-v3-turbo");
    // Optional parameters; modify as needed.
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4">
        <h1 className="text-2xl font-bold">Audio Transcription</h1>
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
          <div className="mb-4">
            <audio controls src={audioURL} className="w-full">
              Your browser does not support the audio element.
            </audio>
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
            <h2 className="text-xl font-semibold mb-2">Transcription</h2>
            <p className="whitespace-pre-wrap text-gray-800">{transcript}</p>
          </div>
        )}
      </main>
    </div>
  );
}
