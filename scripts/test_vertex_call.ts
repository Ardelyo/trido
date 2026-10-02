import { generateAgentActionsVertex } from '../server/vertexAdapter';

async function test() {
  console.log("=== Testing generateAgentActionsVertex ===");
  try {
    const res = await generateAgentActionsVertex(
      "Halo! Buatkan mindmap tentang Fotosintesis",
      "",
      [],
      { width: 1440, height: 900 },
      null,
      [],
      undefined,
      {},
      "creation",
      true,
      undefined,
      "gemini-3.8-flash"
    );
    console.log("Status: SUCCESS");
    console.log("Tool calls:", res.functionCalls.length);
    console.log("Text response:", res.textResponse.slice(0, 100));
  } catch (err: any) {
    console.error("Vertex Error:", err.message || err);
    if (err.stack) console.error(err.stack);
  }
}

test();
