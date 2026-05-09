import { generateAgentActions } from '../services/aiService';
import { CanvasObjectData } from '../types';

interface TestResult {
  passed: boolean;
  actualCalls: any[];
  errors: string[];
  thinkingQuality: number; // 0-100
}

const runTest = async (prompt: string, expectedCalls: any[], context: CanvasObjectData[] = []): Promise<TestResult> => {
  const { functionCalls, thought } = await generateAgentActions(
    prompt,
    "", // mock base64 canvas for test
    context,
    { width: 1920, height: 1080 }
  );
  
  const errors: string[] = [];
  
  // Check call count
  if (functionCalls.length !== expectedCalls.length) {
    errors.push(`Expected ${expectedCalls.length} calls, got ${functionCalls.length}`);
  }
  
  // Check call names
  functionCalls.forEach((call, i) => {
    if (call.name !== expectedCalls[i]?.name) {
      errors.push(`Call ${i}: expected ${expectedCalls[i]?.name}, got ${call.name}`);
    }
  });
  
  // Evaluate thinking quality (if present)
  let thinkingQuality = 0;
  if (thought) {
    thinkingQuality = 
      (thought.includes("coordinate") ? 25 : 0) +
      (thought.includes("position") ? 25 : 0) +
      (thought.length > 50 ? 25 : 0) +
      (functionCalls.length > 0 ? 25 : 0);
  }
  
  return {
    passed: errors.length === 0,
    actualCalls: functionCalls,
    errors,
    thinkingQuality
  };
};

export const runEvaluationSuite = async () => {
    console.log("Starting Evaluation Suite...");
    
    // Test 1: Single action
    const t1 = await runTest(
        "Create a red circle in the center with text 'Hello'",
        [{ name: "add_mindmap_node" }]
    );
    console.log("Test 1 Passed:", t1.passed);

    // Test 2: Multiple similar actions
    const t2 = await runTest(
        "Create 3 boxes labeled A, B, C",
        [
            { name: "add_mindmap_node" },
            { name: "add_mindmap_node" },
            { name: "add_mindmap_node" }
        ]
    );
    console.log("Test 2 Passed:", t2.passed);

    // Test 5: Component generation
    const t5 = await runTest(
        "Add a calculator",
        [{ name: "add_component" }]
    );
    console.log("Test 5 Passed:", t5.passed);
};

// If run directly:
// runEvaluationSuite();
