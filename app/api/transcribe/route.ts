import { exec } from "child_process";
import fs from "fs";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import os from "os";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Function to check FFmpeg installation
async function checkFFmpeg() {
  try {
    const { stdout } = await execAsync("ffmpeg -version");
    console.log(`✅ FFmpeg is installed. Version:`, stdout.split("\n")[0]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.error("❌ FFmpeg is NOT installed or not in PATH.");
    throw new Error("FFmpeg is required but not installed.");
  }
}

export async function POST(request: Request) {
  console.log("######################################################1");
  try {
    await checkFFmpeg(); // Ensure FFmpeg is installed

    // Read file from request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file)
      return NextResponse.json({ error: "File not provided" }, { status: 400 });

    // Save uploaded file to temp directory
    const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${file.name}`);
    await fs.promises.writeFile(
      tempFilePath,
      Buffer.from(await file.arrayBuffer())
    );

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    console.log(
      `📂 Uploaded file: ${file.name}, Size: ${fileSizeMB.toFixed(2)}MB`
    );

    if (fileSizeMB <= 25) {
      // Send directly to Groq if within size limit
      return NextResponse.json({ text: await transcribeFile(tempFilePath) });
    }

    // Split audio into chunks (~20MB each)
    const chunkFiles = await splitAudio(tempFilePath);
    console.log(`🔹 Splitting completed. ${chunkFiles.length} chunks created.`);

    // Transcribe all chunks **in parallel**
    console.log(`🚀 Transcribing ${chunkFiles.length} chunks in parallel...`);
    const transcriptions = await Promise.all(chunkFiles.map(transcribeFile));

    // Cleanup chunk files
    chunkFiles.forEach((chunk) => fs.unlinkSync(chunk));

    // Return combined transcript
    return NextResponse.json({ text: transcriptions.join(" ").trim() });
  } catch (error) {
    console.error("❌ Error in transcription API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Function to split audio into chunks (~20MB each)
async function splitAudio(inputFilePath: string): Promise<string[]> {
  const chunkDir = path.join(os.tmpdir(), `chunks-${Date.now()}`);
  fs.mkdirSync(chunkDir);

  // Get file duration
  const { stdout } = await execAsync(
    `ffmpeg -i "${inputFilePath}" 2>&1 | grep "Duration"`
  );
  const durationMatch = stdout.match(/(\d+):(\d+):(\d+\.\d+)/);
  if (!durationMatch) throw new Error("Could not determine audio duration");

  const durationInSeconds =
    parseInt(durationMatch[1]) * 3600 +
    parseInt(durationMatch[2]) * 60 +
    parseFloat(durationMatch[3]);

  // Calculate chunk duration (~20MB per chunk)
  const fileSizeMB = fs.statSync(inputFilePath).size / (1024 * 1024);
  const approxSizePerSecond = fileSizeMB / durationInSeconds;
  const chunkDuration = Math.floor(20 / approxSizePerSecond); // 20MB chunks

  console.log(`⏳ Splitting into ~${chunkDuration}s chunks...`);

  // Split file into chunks
  const outputPattern = path.join(chunkDir, "chunk-%03d.mp3");
  await execAsync(
    `ffmpeg -i "${inputFilePath}" -f segment -segment_time ${chunkDuration} -c copy "${outputPattern}"`
  );

  const chunkFiles = fs
    .readdirSync(chunkDir)
    .map((file) => path.join(chunkDir, file));
  console.log(`✅ ${chunkFiles.length} chunks generated.`);
  return chunkFiles;
}

// Function to transcribe a file using Groq
async function transcribeFile(filePath: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  console.log(`📤 Sending to Groq: ${filePath}`);

  const transcription = await groq.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-large-v3-turbo",
    response_format: "json",
    temperature: 0.0,
  });

  console.log(`✅ Transcription received.`);
  return transcription.text;
}
