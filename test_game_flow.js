const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
        else console.log('BROWSER LOG:', msg.text());
    });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        console.log('Navigated to localhost:3000');

        // Click create room
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('div[role="button"]'));
            const hostBtn = btns.find(b => b.textContent.includes('إنشاء غرفة'));
            if (hostBtn) hostBtn.click();
        });

        await page.waitForTimeout(2000);
        console.log('Clicked Create Room');

        // Click Add Bot 4 times
        for (let i = 0; i < 4; i++) {
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('div[role="button"]'));
                const botBtn = btns.find(b => b.textContent.includes('إضافة بوت'));
                if (botBtn) botBtn.click();
            });
            await page.waitForTimeout(500);
        }

        console.log('Added bots');
        await page.waitForTimeout(1000);

        // Click Start Game
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('div[role="button"]'));
            const startBtn = btns.find(b => b.textContent.includes('بدء اللعب'));
            if (startBtn) startBtn.click();
        });
        console.log('Started game');

        await page.waitForTimeout(2000); // Game Intro

        // Host should auto progress to HostDrafting then HostQualityVoting...
        // Let's just monitor state for 15 seconds
        for (let i = 0; i < 15; i++) {
            const html = await page.content();
            if (html.includes('وقت النقاش')) {
                console.log('REACHED DISCUSSION SCREEN!');
                break;
            }
            await page.waitForTimeout(1000);
        }

        console.log('Taking screenshot...');
        await page.screenshot({ path: 'discussion_test.png' });
        console.log('Screenshot saved to discussion_test.png');

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await browser.close();
    }
})();
