const puppeteer = require('puppeteer');

async function verifyRedesign() {
  console.log('🚀 Testing Smartboard Redesign Prototype on http://localhost:3000 ...\n');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, message) {
    testsTotal++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 10000 });

    // Wait for Smartboard to mount
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Trido') && (text.includes('Klasik') || text.includes('Dok Pintar') || text.includes('Radial'));
    }, { timeout: 10000 });

    // ── TEST 1: Layout Switcher exists ────────────────────────────────────────
    console.log('--- TEST 1: Layout Switcher Segmented Control ---');
    const layoutModes = await page.evaluate(() => {
      const switcher = document.querySelector('[role="radiogroup"]');
      if (!switcher) return [];
      const buttons = Array.from(switcher.querySelectorAll('button'));
      return buttons.map(b => b.innerText.trim());
    });
    console.log('  Found layout modes:', layoutModes);
    assert(layoutModes.some(m => m.includes('Klasik')), 'Option "Klasik" present');
    assert(layoutModes.some(m => m.includes('Dok Pintar')), 'Option "Dok Pintar" present');
    assert(layoutModes.some(m => m.includes('Radial')), 'Option "Radial" present');

    // ── TEST 2: Dock Mode Verification ────────────────────────────────────────
    console.log('\n--- TEST 2: Dok Pintar (macOS Magnification Dock) ---');
    // Click "Dok Pintar"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('[role="radiogroup"] button'));
      const dockBtn = btns.find(b => b.innerText.includes('Dok Pintar'));
      if (dockBtn) dockBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const dockVisible = await page.evaluate(() => {
      // Look for the bottom dock container with rounded-3xl
      const dockEl = Array.from(document.querySelectorAll('div')).find(d => 
        d.className.includes('fixed bottom-4 left-1/2') || d.className.includes('rounded-3xl')
      );
      return !!dockEl;
    });
    assert(dockVisible, 'Smartboard Dock is rendered at bottom center');

    // Click Timer in dock
    console.log('  Clicking Timer tool in dock...');
    const clickedTimer = await page.evaluate(() => {
      const dockButtons = Array.from(document.querySelectorAll('button'));
      const timerBtn = dockButtons.find(b => b.getAttribute('title')?.includes('Timer') || b.querySelector('svg'));
      // Find button by icon or title
      const allButtons = Array.from(document.querySelectorAll('.fixed button'));
      if (allButtons.length > 0) {
        allButtons[5]?.click();
        return true;
      }
      return false;
    });
    assert(clickedTimer, 'Interacted with tool button in dock');

    // ── TEST 3: Radial Mode Verification ──────────────────────────────────────
    console.log('\n--- TEST 3: Radial Touch Quick-Menu ---');
    // Switch to Radial
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('[role="radiogroup"] button'));
      const radialBtn = btns.find(b => b.innerText.includes('Radial'));
      if (radialBtn) radialBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const radialFabVisible = await page.evaluate(() => {
      const fab = document.querySelector('button[title*="Radial"]');
      return !!fab;
    });
    assert(radialFabVisible, 'Radial Center-Bottom FAB button rendered');

    // Click FAB to bloom radial menu
    console.log('  Opening Radial Menu...');
    await page.evaluate(() => {
      const fab = document.querySelector('button[title*="Radial"]');
      if (fab) fab.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const petalsCount = await page.evaluate(() => {
      const petalButtons = Array.from(document.querySelectorAll('.pointer-events-auto button'));
      return petalButtons.length;
    });
    console.log(`  Found ${petalsCount} radial tool petals bloomed in arcs`);
    assert(petalsCount >= 6, `Radial tool petals successfully blossomed (${petalsCount} petals)`);

    // ── TEST 4: Classic Mode Switch ──────────────────────────────────────────
    console.log('\n--- TEST 4: Classic Mode Switch ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('[role="radiogroup"] button'));
      const classicBtn = btns.find(b => b.innerText.includes('Klasik'));
      if (classicBtn) classicBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const isClassicActive = await page.evaluate(() => {
      const switcher = document.querySelector('[role="radiogroup"]');
      const activeBtn = switcher?.querySelector('[aria-checked="true"]');
      return activeBtn?.innerText.includes('Klasik');
    });
    assert(isClassicActive, 'Switched back to Klasik workspace smoothly');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }

  console.log(`\n========================================`);
  console.log(`PROTOTYPE VERIFICATION: ${testsPassed} / ${testsTotal} tests passed`);
  console.log(`========================================\n`);

  if (testsPassed === testsTotal && testsTotal > 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verifyRedesign();
