# Suara Guru Agent - Small Model Guidelines

This framework has been optimized to work with small language models (like Gemma 2B and 7B) running locally or in constrained environments. 

## Architectural Changes Made
1. **Simplified Tools:** Tools reduced from 12 to 6 robust high-level tools. 
2. **Abstract Coordinates:** Removed absolute X/Y geometry calculations and replaced them with enum-based grid logic (`TOP_LEFT`, `CENTER`, etc).
3. **Structured Context:** Improved how existing canvas objects are passed into system prompt, making it parseable.
4. **Validation Layer:** Added safety layer to fix hallucinated parameters before they hit the canvas.

## Model Compatibility Matrix

| Feature / Model | Gemma 2B (Local) | Gemma 7B (Local) | Gemini Flash |
|-----------------|------------------|------------------|--------------|
| Text Annotations| ✅ Pass           | ✅ Pass           | ✅ Pass       |
| 3-Node Mindmap  | ⚠️ Hit-or-miss   | ✅ Pass           | ✅ Pass       |
| HTML Components | ❌ Fail          | ⚠️ Simple Configs | ✅ Pass       |
| Multi-Step Edits| ❌ Fail          | ⚠️ Unreliable    | ✅ Pass       |

## Recommended Hyperparameters for Gemma models
When using small models, we recommend updating the `generateAgentActions` config as follows:
- `temperature`: 0.2 - 0.4
- `maxOutputTokens`: 1024
- Disable `thinkingConfig` format requirements if the local LLM doesn't natively support structured `<thought>` output.

## Adding Custom Interactive Components
To extend component templates easily:
1. Add to the `componentType` enum in `services/geminiService.ts`
2. Add the corresponding HTML generation switch case in `hooks/useGeminiBrain.ts` under the `add_component` tool definition.
