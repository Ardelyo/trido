import { generateAgentActionsOllama } from '../server/ollamaAdapter';

async function testTools() {
  console.log("Testing Ollama Tools with gemma4:e2b...");
  
  const viewport = { width: 1920, height: 1080 };
  const canvasObjects: any[] = [];
  
  // No image this time
  try {
    const result = await generateAgentActionsOllama(
      "Create a red circle",
      "", // No image
      canvasObjects,
      viewport
    );
    console.log("Success!");
    console.log("Response:", result.textResponse);
    console.log("Tool Calls:", JSON.stringify(result.functionCalls));
  } catch (e: any) {
    console.error("Failed:", e.message);
  }
}

testTools();
