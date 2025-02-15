import fs, { promises as fsPromises } from "fs";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import os from "os";
import path from "path";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    // Use Groq's recommended model if not provided by the client
    // const model = (formData.get("model") as string) || "whisper-large-v3-turbo";
    // const prompt = (formData.get("prompt") as string) || "";
    // const language = (formData.get("language") as string) || "en";
    // const temperature = parseFloat(
    //   (formData.get("temperature") as string) || "0.0"
    // );

    if (!file) {
      return NextResponse.json({ error: "File not provided" }, { status: 400 });
    }

    // Write the uploaded file to a temporary location
    const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${file.name}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fsPromises.writeFile(tempFilePath, buffer);

    // Create a read stream from the temporary file
    const fileStream = fs.createReadStream(tempFilePath);

    // Create the transcription job using Groq's cloud API
    const transcription = await groq.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-large-v3",
      prompt: "interview in English and Hebrew",
      response_format: "json",
      temperature: 0.0,
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error: any) {
    console.error("Error in transcription API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
