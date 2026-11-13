const mockEmbeddingsCreate = jest.fn();
const mockOpenAI = jest.fn().mockImplementation(({ apiKey }: { apiKey?: string }) => {
  if (!apiKey) throw new Error("Missing credentials");
  return { embeddings: { create: mockEmbeddingsCreate } };
});

jest.mock("openai", () => ({ __esModule: true, default: mockOpenAI }));

import { generateEmbedding, isEmbeddingConfigured } from "../embedding-utils";

describe("embedding-utils without a configured AI provider", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    mockEmbeddingsCreate.mockReset().mockResolvedValue({ data: [{ embedding: [0.1, 0.2] }] });
    mockOpenAI.mockClear();
  });

  afterAll(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  it("can be imported without constructing an OpenAI client", () => {
    expect(isEmbeddingConfigured()).toBe(false);
    expect(mockOpenAI).not.toHaveBeenCalled();
  });

  it("reports a clear optional-configuration error only when embedding is requested", async () => {
    await expect(generateEmbedding("client notes")).rejects.toThrow("OpenAI embeddings are not configured");
    expect(mockOpenAI).not.toHaveBeenCalled();
  });

  it("creates the client lazily when a valid environment key is available", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    await expect(generateEmbedding("client notes")).resolves.toEqual([0.1, 0.2]);
    expect(mockOpenAI).toHaveBeenCalledWith({ apiKey: "test-openai-key" });
  });
});
