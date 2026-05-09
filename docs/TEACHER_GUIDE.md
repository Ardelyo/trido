# Teacher's Guide to Smartboard Teach AI

This guide is written for educators. No coding knowledge required.

## Getting Started

### Installation (IT Admin or First-Time Setup)

1. **Download and Install**
   - Visit the project repository and follow README.md
   - Or ask your IT department to deploy it for you

2. **First Launch**
   - Open the application in your browser
   - Grant microphone permission (your browser will ask)
   - You're ready to teach

### Checking Your Setup

Before teaching, verify everything works:

1. **Microphone Test**
   - Click the microphone button
   - Say: "Test, test, one two three"
   - You should see your words appear in the chat box

2. **AI Mode Check**
   - Look at the top-right corner
   - You should see either **"Mode: Cloud"** (Gemini) or **"Mode: Offline"** (Ollama)
   - If it says "Unavailable," contact IT or check your internet connection

3. **Drawing Test**
   - Say: "Draw a circle"
   - You should see the agent cursor move and draw a circle on the canvas

---

## Using Your Voice

### Basic Commands

**The system understands natural language.** Don't memorize phrases; just speak naturally.

#### Example 1: Create a Mind Map
```
"Create a mind map about photosynthesis"
"Show me the parts of a plant"
"Make a concept map: soil, water, sunlight as main topics"
```

The AI will draw interconnected bubbles with the concepts you mention.

#### Example 2: Generate a Quiz
```
"Create a 5-question quiz on the Civil War"
"Make a true-false quiz about fractions"
"Generate a matching question: match elements to their symbols"
```

The AI creates the quiz layout on your board.

#### Example 3: Use Built-in Tools
```
"Start a 10-minute timer"
"Set up a calculator"
"Show me the periodic table"
"Create a flashcard set for Spanish vocabulary"
```

Each tool appears on the canvas.

#### Example 4: Organize Information
```
"Create a timeline of World War II"
"Make a comparison table: photosynthesis vs. respiration"
"Draw a Venn diagram showing living vs. non-living things"
```

### Tips for Better Results

1. **Be specific:** 
   - ❌ "Draw something"
   - ✓ "Create a labeled diagram of the water cycle"

2. **Use natural language:**
   - ❌ "CREATE_MINDMAP: Proteins"
   - ✓ "Draw a mind map showing types of proteins"

3. **Provide context when needed:**
   - ❌ "Quiz"
   - ✓ "Create a multiple-choice quiz about Spanish verb conjugations"

4. **If the AI misunderstands:** Simply rephrase:
   - "Hmm, that's not quite right. Let me try again: Show me the human skeleton labeled with bone names"

---

## Teaching Workflows

### Lesson Plan: Biology - Photosynthesis

**5-Minute Introduction**
```
Teacher: "Create a mind map about photosynthesis. Include chlorophyll, sunlight, water, glucose, and oxygen."
```
AI draws the concept map. You point at it and discuss each component.

**10-Minute Explanation**
```
Teacher: "Draw a diagram showing how photosynthesis happens. Show light energy, water input, and glucose output."
```
Students see the animated drawing process. You narrate as the diagram appears.

**5-Minute Quiz**
```
Teacher: "Create a 3-question quiz about photosynthesis with multiple choice options."
```
Quiz appears. You ask students to discuss answers before revealing the correct ones.

**Closing**
```
Teacher: "Show me the periodic table so we can look up carbon, hydrogen, and oxygen."
```
Reference material appears instantly.

---

### Lesson Plan: Math - Fractions

**Warm-up (2 min)**
```
Teacher: "Create a visual showing equivalent fractions: 1/2, 2/4, 3/6, 4/8"
```
AI draws fraction representations. Students see visual relationships.

**Direct Instruction (10 min)**
```
Teacher: "Draw a step-by-step process for adding fractions with different denominators"
```
You narrate each step as it appears on the board.

**Practice (5 min)**
```
Teacher: "Create a 5-question practice problem set on adding fractions. Include answer choices."
```
Students work through them with peer support.

**Check Understanding (3 min)**
```
Teacher: "Make a quick true-false quiz to check if students understand LCD."
```
Fast assessment without paper/pencils.

---

### Lesson Plan: History - American Revolution

**Timeline Activity (8 min)**
```
Teacher: "Create a timeline of the American Revolution from 1775 to 1783. Include: Declaration of Independence, Valley Forge, Yorktown, major battles"
```
Board fills with the timeline. You add notes as you discuss.

**Document Analysis (5 min)**
```
Teacher: "Write the first paragraph of the Declaration of Independence at the top of the board"
```
Primary source appears for close reading.

**Synthesis (5 min)**
```
Teacher: "Create a comparison chart: Causes of the Revolution in column 1, Results in column 2"
```
Students help fill in the chart by shouting out ideas.

---

## Using Teaching Tools

### Timer
Perfect for pacing and building accountability.

```
"Start a 3-minute think-pair-share timer"
"Set a 15-minute bell ringer timer"
"5 minutes for group work, then 2 minutes to clean up"
```

### Calculator
For instant math checks (great for checking student work).

```
"Calculate 247 × 38"
"What's 15% of 520?"
```

### Flashcard Generator
For vocabulary or memorization.

```
"Create flashcards for Spanish verb conjugations: ser, estar, ir, tener"
"Make flashcards for the periodic table symbols"
```

Each flashcard appears on the board. Click to flip.

### Quiz Tools
Generates assessments automatically. Types available:

- **Multiple Choice:** "Generate 4 multiple-choice questions about photosynthesis"
- **True/False:** "5 true-false questions on the American Revolution"
- **Matching:** "Create a matching question: Match the country to its capital"
- **Essay Prompts:** "Generate 3 essay questions about climate change"

### Custom App Builder
For special needs or unique tools.

```
"Create a temperature converter from Celsius to Fahrenheit"
"Make a tool that converts units of measurement"
"Build a periodic table reference"
```

---

## Canvas Basics

### Navigation
- **Zoom in:** Scroll wheel up or pinch (tablet)
- **Zoom out:** Scroll wheel down
- **Pan:** Click and drag with middle mouse button (or drag with two fingers on tablet)
- **Pan on touchscreen:** Use two-finger drag

### Selecting Objects
- **Click** any object to select it
- **Drag** to move it
- **Delete** selected object: Press Delete key or say "Delete that"

### Saving Your Work
```
Teacher: "Save this lesson as Biology-Photosynthesis"
```
The SaveMenu component opens. Choose format:
- **JSON** (preserves all interactivity)
- **PDF** (for printing or sharing)
- **PNG/SVG** (for embedding in documents)

### Share with Students
```
Teacher: "Share this board"
```
A link appears. Students visit that URL on their devices to see your board in real-time.

**Important:** Viewers see your board; they can't draw or edit. This prevents accidental erasures.

---

## Accessibility Features

### For Teachers with Motor Disabilities

The entire application is voice-controlled:
- ✓ No mouse required
- ✓ No keyboard required
- ✓ Commands work from anywhere on the board

**Standard Commands:**
```
"Move cursor to top-left"
"Click that"
"Undo last action"
"Clear the board"
"Take a screenshot"
```

### For Teachers with Vision Impairments

- High contrast mode: Settings → Display → High Contrast
- Larger text: Settings → Display → Text Size → Large
- Screen reader support: Full keyboard navigation enabled

### For Students with Different Learning Styles

**Visual Learners:**
- Mind maps and diagrams automatically generated
- Color-coded elements
- Animated drawing process

**Auditory Learners:**
- Voice input/output
- Audio timer alerts
- Can ask AI to explain concepts

**Kinesthetic Learners:**
- Interactive tools (calculator, flashcards)
- Touch-friendly on tablets
- Can edit board in real-time

---

## Troubleshooting

### "Microphone Isn't Working"

1. **Check browser permissions:**
   - Chrome: Settings → Privacy → Microphone → Allow for this site
   - Firefox: Same process, Settings → Privacy

2. **Test your microphone:**
   - Windows: Settings → Sound → Test microphone
   - Mac: System Preferences → Sound → Input

3. **Still not working?**
   - Use text input instead (type in the chat box)
   - Or contact IT

### "The AI Isn't Responding"

**Wait 3-5 seconds.** AI can be slow depending on:
- Internet speed (cloud mode)
- Computer power (offline mode)
- Complexity of your request

**If it stays stuck:**
1. Check mode indicator (top-right): Is it Cloud or Offline?
2. If Cloud: Check internet connection
3. If Offline: Check that Ollama is running (ask IT)
4. Refresh page: Press Ctrl+R (Windows) or Cmd+R (Mac)

### "Drawing Looks Messy"

Redraw it or say: *"Redo that better"* or *"Delete that and try again"*

The AI will delete the previous attempt and redraw.

### "Offline Mode Showing as 'Unavailable'"

This means Ollama isn't running on your computer. Options:
1. Switch to Cloud mode (if you have internet)
2. Ask IT to start the Ollama service
3. For home use: Download Ollama from https://ollama.ai

### "Students Can't See My Board"

1. Check they're visiting the correct link (should show room ID)
2. Verify you clicked "Share" and sent the link
3. Ask them to refresh the page
4. Check your firewall isn't blocking port 3000

### "Board Disappeared / Lost Work"

Work is auto-saved. It might have been:
1. **Cleared accidentally:** Check undo history (Ctrl+Z)
2. **Saved to different session:** Sessions are separate; you might be in a new room
3. **Browser cache cleared:** Browser refreshed and lost IndexedDB

**Backup tip:** Regularly save important lessons as files using the SaveMenu.

---

## Best Practices

### Before Class
- ✓ Test microphone and AI mode
- ✓ Plan key concepts you want visualized
- ✓ Have a backup (print a diagram) in case tech fails

### During Class
- ✓ Narrate what the AI is drawing: "As you see, photosynthesis has three main parts..."
- ✓ Pause between commands to let students absorb
- ✓ Involve students: "What should the next step be?"
- ✓ Have text input ready as fallback if voice fails

### After Class
- ✓ Save lesson as PDF or JSON
- ✓ Share file with students (email, Google Classroom, etc.)
- ✓ Use as study guide for next lesson

---

## Advanced: Using Multiple Pages

Large topics can span multiple pages:

```
Teacher: "Create a new page"
```

Board clears (old page is saved). You now have a fresh canvas.

```
Teacher: "Show page 2"
```

Returns to previously created page.

Use this for:
- Multi-part lessons
- Before/after comparisons
- Different topic sections

---

## Getting Help

### Quick Troubleshooting
1. Check this guide (Ctrl+F to search topics)
2. Test mode indicator and internet connection
3. Try rephrasing your command

### Report a Bug
Share a screenshot of the error with your IT department. Include:
- What you were trying to do
- What went wrong
- What you expected to happen

### Suggest a Feature
- "Can we have a timeline tool?"
- "I'd like to import images"

Send suggestions to your IT department or project maintainers.

---

## Sample Lesson Templates

### 15-Minute Lesson: Fractions

```
1. "Create a visual showing 1/2, 1/3, 1/4 as pie charts" (2 min, students absorbed)
2. "Draw a number line from 0 to 2, mark 1/2, 1, 1.5, 2" (2 min, discuss)
3. "Make a quiz with 3 fraction problems" (2 min)
4. "Create a comparison: improper fractions vs. proper fractions" (2 min)
5. "Quick summary in a circle: What is a fraction?" (student input) (2 min)
6. Save and share with students (1 min)
```

### 20-Minute Lesson: Electricity

```
1. "Mind map: electricity, with sources, uses, dangers, and safety" (3 min)
2. "Draw a circuit diagram with battery, wire, bulb, and switch labeled" (3 min)
3. "Create a table: Conductors vs. Insulators with examples" (2 min)
4. "Timeline: history of electricity from Benjamin Franklin to now" (3 min)
5. "Quiz: 4 questions on electricity safety" (2 min)
6. "Students draw on my board: Where is electricity used in your home?" (2 min)
7. Wrap up and save (1 min)
```

---

## Video Walkthrough

(If available) Check your school's learning platform for video tutorials.

---

**Happy teaching!**

For detailed technical information, see [README.md](../README.md) and [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).
