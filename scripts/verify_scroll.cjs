const puppeteer = require('puppeteer');

async function testScroll() {
  console.log('Testing landing page scrollability on http://localhost:3000/?landing=true ...\n');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await page.goto('http://localhost:3000/?landing=true', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('main', { timeout: 10000 });

    const scrollMetricsBefore = await page.evaluate(() => {
      return {
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        bodyScrollHeight: document.body.scrollHeight,
        scrollY: window.scrollY,
        overflowY: window.getComputedStyle(document.body).overflowY,
        htmlOverflowY: window.getComputedStyle(document.documentElement).overflowY,
      };
    });

    console.log('Metrics before scroll:', scrollMetricsBefore);

    if (scrollMetricsBefore.scrollHeight <= scrollMetricsBefore.clientHeight) {
      throw new Error(`Page is not scrollable! scrollHeight (${scrollMetricsBefore.scrollHeight}) <= clientHeight (${scrollMetricsBefore.clientHeight})`);
    }

    // Attempt scrolling by 1200px
    await page.evaluate(() => {
      window.scrollTo(0, 1200);
    });

    await new Promise(r => setTimeout(r, 600));

    const scrollMetricsAfter = await page.evaluate(() => {
      return {
        scrollY: window.scrollY,
        pageYOffset: window.pageYOffset
      };
    });

    console.log('Metrics after scroll(0, 1200):', scrollMetricsAfter);

    if (scrollMetricsAfter.scrollY <= 0) {
      throw new Error(`window.scrollY is still ${scrollMetricsAfter.scrollY} after scrolling!`);
    }

    // Test scrolling to bottom / #faq
    await page.evaluate(() => {
      const faq = document.getElementById('faq');
      if (faq) faq.scrollIntoView();
    });

    await new Promise(r => setTimeout(r, 800));

    const faqScrollY = await page.evaluate(() => window.scrollY);
    console.log(`Scroll position at #faq: ${faqScrollY}px`);

    if (faqScrollY <= 1200) {
      throw new Error(`Failed to scroll to #faq! scrollY is ${faqScrollY}`);
    }

    console.log('\n✅ [SUCCESS] Landing page scroll is working completely and smoothly!');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Scroll test failed:', err);
    await browser.close();
    process.exit(1);
  }
}

testScroll();
