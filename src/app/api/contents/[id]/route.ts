import { NextRequest, NextResponse } from "next/server";
import { fetchVectorById } from "@/lib/pinecone";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await fetchVectorById(id);

    if (!record) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    const metadata = record.metadata as {
      title: string;
      body: string;
      url: string;
    };

    return NextResponse.json({
      id,
      title: metadata?.title || "",
      body: metadata?.body || "",
      url: metadata?.url || "",
    });
  } catch (error) {
    console.error("Fetch content error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
