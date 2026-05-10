
import "dotenv/config";
import { generateAgentActionsOllama, generateToolContentOllama } from '../server/ollamaAdapter';
import { ViewportBounds } from '../server/aiTools';

async function runTests() {
  console.log("🚀 Memulai Pengetesan Performa Ollama (gemma4:e2b)...");
  
  const viewport: ViewportBounds = { width: 1920, height: 1080 };
  const canvasObjects: any[] = [];
  const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  // Test 1: Basic Chat / Agent Actions
  console.log("\n--- Test 1: Agent Actions (Chat & Logic) ---");
  const start1 = performance.now();
  try {
    const result = await generateAgentActionsOllama(
      "Buatlah sebuah persegi panjang biru di tengah layar dan tuliskan 'Halo Dunia' di dalamnya.",
      dummyImage,
      canvasObjects,
      viewport
    );
    const end1 = performance.now();
    console.log(`✅ Berhasil dalam ${((end1 - start1) / 1000).toFixed(2)} detik`);
    console.log(`🤖 Respon: ${result.textResponse}`);
    console.log(`🛠️ Tool Calls: ${JSON.stringify(result.functionCalls)}`);
  } catch (e: any) {
    console.error(`❌ Gagal: ${e.message}`);
  }

  // Test 2: Mindmap Generation (JSON Logic)
  console.log("\n--- Test 2: Mindmap Tool Content (JSON Accuracy) ---");
  const start2 = performance.now();
  try {
    const result = await generateToolContentOllama('mindmap', 'Sistem Tata Surya');
    const end2 = performance.now();
    console.log(`✅ Berhasil dalam ${((end2 - start2) / 1000).toFixed(2)} detik`);
    console.log(`🗺️ Nodes: ${Array.isArray(result) ? result.length : 0} item ditemukan`);
    if (Array.isArray(result)) {
        console.log(`📝 Contoh node: ${JSON.stringify(result[0])}`);
    }
  } catch (e: any) {
    console.error(`❌ Gagal: ${e.message}`);
  }

  // Test 3: Complex Quiz Generation
  console.log("\n--- Test 3: Quiz Generation ---");
  const start3 = performance.now();
  try {
    const result = await generateToolContentOllama('quiz', 'Sejarah Kemerdekaan Indonesia');
    const end3 = performance.now();
    console.log(`✅ Berhasil dalam ${((end3 - start3) / 1000).toFixed(2)} detik`);
    console.log(`❓ Pertanyaan: ${result?.question || 'Gagal generate'}`);
  } catch (e: any) {
    console.error(`❌ Gagal: ${e.message}`);
  }

  console.log("\n✨ Pengetesan Selesai.");
}

runTests();
