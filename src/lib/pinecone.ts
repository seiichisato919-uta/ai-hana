import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

function getPinecone() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

const INDEX_NAME = process.env.PINECONE_INDEX || "ai-hana";

/**
 * インデックスが存在しなければ自動作成する
 */
export async function ensureIndex() {
  const pc = getPinecone();
  const { indexes } = await pc.listIndexes();
  const exists = indexes?.some((idx) => idx.name === INDEX_NAME);

  if (!exists) {
    console.log(`Creating Pinecone index: ${INDEX_NAME}`);
    await pc.createIndex({
      name: INDEX_NAME,
      dimension: 1536, // text-embedding-3-small の次元数
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });
    // インデックス作成後、readyになるまで少し待つ
    console.log("Waiting for index to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
}

export function getIndex() {
  const pc = getPinecone();
  return pc.index(INDEX_NAME);
}

export interface UpsertRecord {
  id: string;
  values: number[];
  metadata: {
    title: string;
    body: string;
    url: string;
  };
}

export async function upsertVectors(records: UpsertRecord[]) {
  const index = getIndex();
  // Pineconeは一度に100件までupsert可能
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await index.upsert({ records: batch });
  }
}

export async function queryVectors(vector: number[], topK: number = 5) {
  const index = getIndex();
  const result = await index.query({
    vector,
    topK,
    includeMetadata: true,
  });
  return result.matches || [];
}

export async function fetchVectorById(id: string) {
  const index = getIndex();
  const result = await index.fetch({ ids: [id] });
  return result.records?.[id] || null;
}
