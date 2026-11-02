const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          .thermal-isolated-wrapper {
            color: #000000 !important;
            background: #ffffff !important;
          }
          .thermal-isolated-wrapper * {
            border-color: #000000 !important;
          }
          .thermal-isolated-wrapper *:not(.thermal-inverted):not(.thermal-inverted *):not([class*="bg-black"]):not([class*="bg-black"] *):not([class*="bg-[#000000]"]):not([class*="bg-[#000000]"] *):not([class*="text-white"]):not([class*="text-[#ffffff]"]):not([style*="background-color: #000000"] *):not([style*="background: #000000"] *):not([style*="color: #ffffff"]):not([style*="color:#ffffff"]):not([style*="color: rgb(255, 255, 255)"]) {
            color: #000000 !important;
          }
          .thermal-isolated-wrapper .thermal-inverted {
            background-color: #000000 !important;
            color: #ffffff !important;
          }
          .thermal-isolated-wrapper .thermal-inverted * {
            color: #ffffff !important;
          }
        </style>
      </head>
      <body>
        <div class="thermal-isolated-wrapper">
          <div style="background-color: #000000; color: #ffffff;" class="thermal-inverted">
            <div style="color: #ffffff;" class="text-sm text-white">★ ★ ★ P2 - URGENTE ★ ★ ★</div>
            <div style="color: #ffffff;" class="text-white">
              <span style="color: #ffffff;" class="text-white">TIEMPO APROX. ESPERA:</span>
              <strong style="color: #ffffff;">~28 min</strong>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);

  const computed = await page.evaluate(() => {
    const p2 = document.querySelector('.text-sm');
    const strong = document.querySelector('strong');
    return {
      p2Color: window.getComputedStyle(p2).color,
      strongColor: window.getComputedStyle(strong).color,
    };
  });

  console.log('COMPUTED COLORS:', JSON.stringify(computed));
  await browser.close();
})();
