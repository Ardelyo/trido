export const CALCULATOR_TEMPLATE = `
<div class="h-full flex flex-col bg-slate-900 text-white p-4 font-sans select-none">
  <div class="bg-black/40 p-4 rounded-xl mb-4 text-right overflow-hidden">
    <div id="equation" class="text-slate-500 text-xs h-4 mb-1 truncate"></div>
    <div id="display" class="text-3xl font-mono font-bold truncate">0</div>
  </div>
  <div class="grid grid-cols-4 gap-2 flex-1">
    <button class="bg-slate-700 hover:bg-slate-600 rounded-lg p-2 font-bold" onclick="clearDisplay()">C</button>
    <button class="bg-slate-700 hover:bg-slate-600 rounded-lg p-2 font-bold" onclick="appendOperator('/')">÷</button>
    <button class="bg-slate-700 hover:bg-slate-600 rounded-lg p-2 font-bold" onclick="appendOperator('*')">×</button>
    <button class="bg-rose-600 hover:bg-rose-500 rounded-lg p-2 font-bold" onclick="deleteLast()">DEL</button>
    
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg p-2 font-bold" onclick="appendNumber('7')">7</button>
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg p-2 font-bold" onclick="appendNumber('8')">8</button>
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg p-2 font-bold" onclick="appendNumber('9')">9</button>
    <button class="bg-slate-700 hover:bg-slate-600 rounded-lg p-2 font-bold" onclick="appendOperator('-')">-</button>
    
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg p-2 font-bold" onclick="appendNumber('4')">4</button>
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg p-2 font-bold" onclick="appendNumber('5')">5</button>
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg p-2 font-bold" onclick="appendNumber('6')">6</button>
    <button class="bg-slate-700 hover:bg-slate-600 rounded-lg p-2 font-bold" onclick="appendOperator('+')">+</button>
    
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg p-2 font-bold" onclick="appendNumber('1')">1</button>
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg p-2 font-bold" onclick="appendNumber('2')">2</button>
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg p-2 font-bold" onclick="appendNumber('3')">3</button>
    <button class="bg-indigo-600 hover:bg-indigo-500 rounded-lg row-span-2 p-2 font-bold" onclick="calculate()">=</button>
    
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg col-span-2 p-2 font-bold" onclick="appendNumber('0')">0</button>
    <button class="bg-slate-800 hover:bg-slate-700 rounded-lg p-2 font-bold" onclick="appendNumber('.')">.</button>
  </div>
</div>
<script>
  let currentDisplay = '0';
  let currentEquation = '';
  const displayEl = document.getElementById('display');
  const equationEl = document.getElementById('equation');

  function updateDisplay() {
    displayEl.innerText = currentDisplay;
    equationEl.innerText = currentEquation;
  }

  function appendNumber(num) {
    if (currentDisplay === '0') currentDisplay = num;
    else currentDisplay += num;
    updateDisplay();
  }

  function appendOperator(op) {
    currentEquation = currentDisplay + ' ' + op + ' ';
    currentDisplay = '0';
    updateDisplay();
  }

  function calculate() {
    try {
      const result = eval(currentEquation + currentDisplay);
      currentDisplay = String(parseFloat(result.toFixed(8)));
      currentEquation = '';
      updateDisplay();
    } catch (e) {
      currentDisplay = 'Error';
      updateDisplay();
    }
  }

  function clearDisplay() {
    currentDisplay = '0';
    currentEquation = '';
    updateDisplay();
  }

  function deleteLast() {
    if (currentDisplay.length > 1) currentDisplay = currentDisplay.slice(0, -1);
    else currentDisplay = '0';
    updateDisplay();
  }
</script>
`;
export const TIMER_TEMPLATE = (seconds = 300) => `
<div class="h-full flex flex-col bg-slate-50 p-6 font-sans select-none items-center justify-center">
  <div id="timer-display" class="text-6xl font-mono font-black text-slate-800 tracking-tighter mb-8">
    ${formatTime(seconds)}
  </div>
  <div class="flex gap-4">
    <button id="start-btn" class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95">START</button>
    <button id="reset-btn" class="bg-slate-200 hover:bg-slate-300 text-slate-600 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95">RESET</button>
  </div>
</div>
<script>
  let timeLeft = ${seconds};
  let initialTime = ${seconds};
  let timer = null;
  const displayEl = document.getElementById('timer-display');
  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
  }

  function updateDisplay() {
    displayEl.innerText = formatTime(timeLeft);
  }

  startBtn.onclick = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
      startBtn.innerText = 'START';
      startBtn.classList.replace('bg-amber-500', 'bg-emerald-500');
    } else {
      timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(timer);
          timer = null;
          timeLeft = 0;
          alert('Waktu habis!');
        }
        updateDisplay();
      }, 1000);
      startBtn.innerText = 'PAUSE';
      startBtn.classList.replace('bg-emerald-500', 'bg-amber-500');
    }
  };

  resetBtn.onclick = () => {
    clearInterval(timer);
    timer = null;
    timeLeft = initialTime;
    updateDisplay();
    startBtn.innerText = 'START';
    startBtn.classList.replace('bg-amber-500', 'bg-emerald-500');
  };
</script>
`;
function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
}
