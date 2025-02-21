"use client";

import { useCallback, useEffect, useState } from "react";

const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 mr-3 mx-2"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

interface SummaryData {
  summary: string;
}

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null); // Use the SummaryData interface
  const [loading, setLoading] = useState<boolean>(false);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(true);

  const handleFile = (file: File) => {
    setAudioFile(file);
    setAudioURL(URL.createObjectURL(file));
    setTranscript("");
    setSummaryData(null); // Reset summary data
    setFileSize((file.size / (1024 * 1024)).toFixed(1));
    setFileName(file.name);
    setIsTranscriptOpen(true);
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
    setSummaryData(null); // Clear previous summary
    setTranscript("");

    const formData = new FormData();
    formData.append("file", audioFile);

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
        const errorData = await res.json(); // Attempt to get error details
        throw new Error(
          `Summary generation failed: ${res.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }
      const data = await res.json(); // Explicitly type the response
      console.log(data, "++");
      setSummaryData(data.summary); // Store the entire summary object
      setIsTranscriptOpen(false);
    } catch (error) {
      console.error("Error during summarization:", error);
      setSummaryData({
        //set summary data in case of error.
        summary: "An error occurred during summarization.",
      });
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
    <div className="min-h-screen bg-gray-50 flex flex-col pb-8">
      <header className="bg-white shadow p-4 sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-indigo-500">
          Audio Transcription & Summary
        </h1>
      </header>

      <main className="p-4 max-w-3xl mx-auto w-full space-y-6">
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

        {/* Audio Player */}
        {audioURL && (
          <div className="mb-4">
            {fileName && (
              <div className="text-sm text-gray-600 mb-2">
                {fileName} ({fileSize} MB)
              </div>
            )}
            <audio controls src={audioURL} className="w-full">
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {audioFile && (
          <button
            onClick={handleTranscribe}
            className="flex bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <span>Transcribing </span>
                <Spinner />
              </>
            ) : (
              "Transcribe"
            )}
          </button>
        )}
        {/* Summarizing Indicator (Outside Collapsible) */}
        {summaryLoading && (
          <div className="mt-4 flex items-center justify-center">
            <p className="text-gray-600 mr-2">Summarizing</p>
            <Spinner />
          </div>
        )}

        {/* Display Summary Data */}
        {summaryData && (
          <div className="mt-6 p-4 bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <p className="whitespace-pre-wrap text-gray-800 px-2 pb-4">
              {summaryData.summary}
            </p>
          </div>
        )}

        {/* Transcript Collapsible Section */}
        {transcript && (
          <div className="mt-4 bg-white rounded shadow">
            {/* Collapsible Header */}
            <button
              onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
              className="w-full flex items-center justify-between p-4 border-b border-gray-200"
            >
              <h2 className="text-xl font-semibold">Full Transcript</h2>
              <svg
                className={`w-5 h-5 transition-transform transform ${
                  isTranscriptOpen ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>
            {/* Collapsible Content */}
            {isTranscriptOpen && (
              <div className="p-4">
                <p className="whitespace-pre-wrap text-gray-700 px-2 pb-4">
                  {transcript}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
