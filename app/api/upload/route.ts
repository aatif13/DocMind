import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { chunkText } from "@/lib/chunker";
import { embedTexts } from "@/lib/embeddings";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 20MB limit" }, { status: 400 });
    }

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uint8 = new Uint8Array(arrayBuffer);

    // Insert doc as processing, including raw PDF bytes
    const docRes = await query(
      "INSERT INTO documents (user_id, name, size_bytes, chunk_count, status, file_data) VALUES ($1, $2, $3, 0, 'processing', $4) RETURNING id",
      [session.user.id, file.name, file.size, buffer]
    );
    const documentId = docRes.rows[0].id;

    // Parse PDF using unpdf (no pdfjs conflict)
    let text = "";
    try {
      const { extractText } = await import("unpdf");
      const { text: extracted } = await extractText(uint8, { mergePages: true });
      text = extracted;
    } catch (parseErr) {
      console.error("PDF parse error:", parseErr);
      await query("UPDATE documents SET status = 'error' WHERE id = $1", [documentId]);
      return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
    }

    if (!text || text.trim().length === 0) {
      await query("UPDATE documents SET status = 'error' WHERE id = $1", [documentId]);
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    // Chunk text
    const chunks = chunkText(text, 500, 50);

    // Embed chunks
    let embeddings: number[][];
    try {
      embeddings = await embedTexts(chunks);
    } catch (embedErr) {
      console.error("Embedding error:", embedErr);
      await query("UPDATE documents SET status = 'error' WHERE id = $1", [documentId]);
      return NextResponse.json({ error: "Failed to generate embeddings" }, { status: 500 });
    }

    // Insert chunks
    for (let i = 0; i < chunks.length; i++) {
      const embedding = `[${embeddings[i].join(",")}]`;
      await query(
        "INSERT INTO chunks (document_id, user_id, content, embedding, chunk_index) VALUES ($1, $2, $3, $4::vector, $5)",
        [documentId, session.user.id, chunks[i], embedding, i]
      );
    }

    // Mark document ready
    await query(
      "UPDATE documents SET status = 'ready', chunk_count = $1 WHERE id = $2",
      [chunks.length, documentId]
    );

    return NextResponse.json({ documentId, chunkCount: chunks.length, name: file.name });

  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process upload" }, { status: 500 });
  }
}