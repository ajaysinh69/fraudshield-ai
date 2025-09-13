"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

type TranscribeResponse = {
  id: string;
  status: string;
  text?: string;
  error?: string;
};

export const transcribe = action({
  args: {
    file: v.bytes(),
    mimeType: v.string(),
    filename: v.string(),
    mediaType: v.union(v.literal("audio"), v.literal("video")),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "AssemblyAI API key not configured. Set ASSEMBLYAI_API_KEY in Convex environment."
      );
    }

    // 1) Upload file to AssemblyAI
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: Buffer.from(args.file),
    });

    if (!uploadRes.ok) {
      const msg = await uploadRes.text().catch(() => "Upload failed");
      throw new Error(`Upload failed: ${msg}`);
    }

    const uploadJson = (await uploadRes.json()) as { upload_url: string };
    if (!uploadJson?.upload_url) {
      throw new Error("Upload failed: missing upload_url");
    }

    // 2) Create transcription job
    const createRes = await fetch("https://api.assemblyai.com/v2/transcribe", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: uploadJson.upload_url,
      }),
    });

    if (!createRes.ok) {
      const msg = await createRes.text().catch(() => "Create job failed");
      throw new Error(`Create transcription failed: ${msg}`);
    }

    const createJson = (await createRes.json()) as TranscribeResponse;
    if (!createJson?.id) {
      throw new Error("Create transcription failed: missing job id");
    }

    // 3) Poll until completion
    const pollUrl = `https://api.assemblyai.com/v2/transcribe/${createJson.id}`;
    const started = Date.now();
    const timeoutMs = 1000 * 60 * 5; // 5 minutes max

    while (Date.now() - started < timeoutMs) {
      const pollRes = await fetch(pollUrl, {
        headers: { authorization: apiKey },
      });
      if (!pollRes.ok) {
        const msg = await pollRes.text().catch(() => "Poll failed");
        throw new Error(`Polling failed: ${msg}`);
      }
      const pollJson = (await pollRes.json()) as TranscribeResponse;

      if (pollJson.status === "completed") {
        return {
          text: pollJson.text ?? "",
          mediaType: args.mediaType,
          filename: args.filename,
          mimeType: args.mimeType,
        };
      }
      if (pollJson.status === "error") {
        throw new Error(pollJson.error || "Transcription failed");
      }

      await new Promise((r) => setTimeout(r, 3000));
    }

    throw new Error("Transcription timed out. Please try again.");
  },
});
