const puppeteer = require('puppeteer');

async function run() {
  console.log('🚀 Starting Navigation Verification on http://localhost:3000 ...\n');
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
    // ── TEST 1: Localhost root (http://localhost:3000/) ───────────────────────
    console.log('--- TEST 1: Localhost root default behavior (Direct to Canvas) ---');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 10000 });

    // Wait for canvas or smartboard header
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Trido') && (text.includes('Papan Tulis') || text.includes('Digital Classroom') || text.includes('Whiteboard') || !!document.querySelector('canvas'));
    }, { timeout: 10000 });

    const isSmartboardOnLocalhost = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasCanvas = !!document.querySelector('canvas') || !!document.querySelector('.canvas-container');
      const hasLandingHero = text.includes('Teach out loud.') || text.includes('Mengajar lewat suara.');
      return !hasLandingHero && (hasCanvas || text.includes('Papan Tulis') || text.includes('Digital Classroom'));
    });
    assert(isSmartboardOnLocalhost, 'Localhost / immediately opens Smartboard Canvas without showing landing page');

    // ── TEST 2: Preview Landing Page on Localhost (?landing=true) ────────────
    console.log('\n--- TEST 2: Localhost preview landing page (http://localhost:3000/?landing=true) ---');
    await page.goto('http://localhost:3000/?landing=true', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('main', { timeout: 10000 });

    const heroTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText.replace(/\s+/g, ' ').trim() : '';
    });
    console.log(`  Found hero title: "${heroTitle}"`);
    assert(heroTitle.includes('Teach out loud') || heroTitle.includes('Mengajar lewat suara'), 'Landing page rendered with Hero title');

    // Verify sections exist
    const sections = await page.evaluate(() => {
      return {
        hasHow: !!document.getElementById('how'),
        hasFeatures: !!document.getElementById('features'),
        hasStory: !!document.getElementById('story'),
        hasAward: !!document.getElementById('award'),
        hasFaq: !!document.getElementById('faq'),
        hasDemo: !!document.getElementById('demo') || !!document.getElementById('board'),
      };
    });
    assert(sections.hasHow, 'Section #how exists');
    assert(sections.hasFeatures, 'Section #features exists');
    assert(sections.hasStory, 'Section #story exists');
    assert(sections.hasAward, 'Section #award exists');
    assert(sections.hasFaq, 'Section #faq exists');
    assert(sections.hasDemo, 'Section #board / #demo exists');

    // ── TEST 3: Language Toggle (EN <-> ID) ───────────────────────────────────
    console.log('\n--- TEST 3: Landing Page Language Toggle (EN <-> ID) ---');
    // Click ID toggle button
    const idButton = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const idBtn = btns.find(b => b.innerText.trim().toLowerCase() === 'id');
      if (idBtn) {
        idBtn.click();
        return true;
      }
      return false;
    });
    assert(idButton, 'Found and clicked Indonesian (ID) language toggle button');

    await new Promise(r => setTimeout(r, 600));

    const idTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText.replace(/\s+/g, ' ').trim() : '';
    });
    console.log(`  Title after switching to ID: "${idTitle}"`);
    assert(idTitle.includes('Mengajar lewat suara'), 'Language switched to Indonesian ("Mengajar lewat suara")');

    // Check CTA button in Indonesian
    const ctaIdText = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll('a')).map(a => a.innerText.trim());
      return ctas.find(t => t.includes('Buka Smartboard')) || '';
    });
    assert(ctaIdText.includes('Buka Smartboard'), `Indonesian CTA button visible: "${ctaIdText}"`);

    // Switch back to EN
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const enBtn = btns.find(b => b.innerText.trim().toLowerCase() === 'en');
      if (enBtn) enBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const enTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText.replace(/\s+/g, ' ').trim() : '';
    });
    assert(enTitle.includes('Teach out loud'), 'Language switched back to English ("Teach out loud")');

    // ── TEST 4: CTA Button Launch Navigation ─────────────────────────────────
    console.log('\n--- TEST 4: CTA Click navigates to Smartboard Canvas ---');
    const launchSuccess = await page.evaluate(() => {
      // Find "Launch Smartboard" or "Buka Smartboard" anchor button
      const anchors = Array.from(document.querySelectorAll('a'));
      const launchBtn = anchors.find(a => 
        a.innerText.includes('Launch Smartboard') || 
        a.innerText.includes('Buka Smartboard') ||
        a.getAttribute('href') === '/app'
      );
      if (launchBtn) {
        launchBtn.click();
        return true;
      }
      return false;
    });
    assert(launchSuccess, 'Clicked "Launch Smartboard" CTA button');

    // Wait for the Smartboard Canvas to mount
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return (text.includes('Papan Tulis') || text.includes('Digital Classroom') || !!document.querySelector('canvas')) &&
        !text.includes('Teach out loud.');
    }, { timeout: 10000 });

    const currentPath = await page.evaluate(() => window.location.pathname);
    assert(currentPath === '/app', `URL path updated to "${currentPath}"`);

    const inCanvas = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasCanvas = !!document.querySelector('canvas') || !!document.querySelector('.canvas-container');
      return hasCanvas || text.includes('Papan Tulis') || text.includes('Digital Classroom');
    });
    assert(inCanvas, 'Smartboard Canvas successfully mounted after clicking Launch CTA');

    // ── TEST 5: Direct URL /app ──────────────────────────────────────────────
    console.log('\n--- TEST 5: Direct navigation to /app ---');
    await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 10000 });
    const directAppSuccess = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasCanvas = !!document.querySelector('canvas') || !!document.querySelector('.canvas-container');
      return (hasCanvas || text.includes('Papan Tulis') || text.includes('Digital Classroom')) && !text.includes('Teach out loud.');
    });
    assert(directAppSuccess, 'Direct /app loads Smartboard Canvas immediately');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }

  console.log(`\n========================================`);
  console.log(`VERIFICATION SUMMARY: ${testsPassed} / ${testsTotal} tests passed`);
  console.log(`========================================\n`);

  if (testsPassed === testsTotal && testsTotal > 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run();
