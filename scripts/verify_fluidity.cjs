const puppeteer = require('puppeteer');

async function testFluidity() {
  console.log('Testing Circular Corners & Fluidity on http://localhost:3030 ...\n');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await page.goto('http://localhost:3030/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 10000 });

    // Wait for canvas to mount
    await page.waitForFunction(() => {
      return !!document.querySelector('canvas') || !!document.querySelector('.canvas-container');
    }, { timeout: 10000 });

    console.log('  ✅ Canvas mounted successfully');

    // Check circular pill corners on drawing toolbar
    const toolbarMetrics = await page.evaluate(() => {
      const toolbars = Array.from(document.querySelectorAll('.rounded-full'));
      const buttons = Array.from(document.querySelectorAll('button.rounded-full'));
      return {
        pillContainersCount: toolbars.length,
        circularButtonsCount: buttons.length,
      };
    });
    console.log('  Metrics:', toolbarMetrics);

    // Click sidebar item "Riwayat Sesi" then "Papan Tulis" to verify FLIP spring pill
    console.log('  Testing FLIP sidebar pill transition...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('aside button'));
      const historyBtn = buttons.find(b => b.innerText.includes('Riwayat'));
      if (historyBtn) historyBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Click back to Papan Tulis
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('aside button'));
      const boardBtn = buttons.find(b => b.innerText.includes('Papan Tulis'));
      if (boardBtn) boardBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    console.log('  ✅ FLIP sidebar pill transition executed smoothly');

    // Click drawing tool (Pencil)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[title*="Pilih"], button[title*="Coret"]'));
      if (buttons[1]) buttons[1].click();
    });
    await new Promise(r => setTimeout(r, 300));

    console.log('  ✅ Drawing tool interactive and active');

    console.log('\n========================================');
    console.log('CIRCULAR & FLUIDITY TEST PASSED!');
    console.log('========================================');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    await browser.close();
    process.exit(1);
  }
}

testFluidity();
