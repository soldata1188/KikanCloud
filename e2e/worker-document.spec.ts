import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Worker Document Upload Flow', () => {
    let testFilePath: string;

    test.beforeAll(() => {
        // Create a dummy PDF file for testing
        testFilePath = path.join(__dirname, 'dummy.pdf');
        fs.writeFileSync(testFilePath, 'dummy pdf content for testing');
    });

    test.afterAll(() => {
        // Clean up the dummy file
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    test('Admin can view worker table and upload document', async ({ page }) => {
        // 1. Go to Login page
        await page.goto('/login');

        // 2. Fill login form and submit
        await page.fill('input[name="email"]', 'demo@kikancloud.com');
        await page.fill('input[name="password"]', 'demo123');
        await page.click('button[type="submit"]');

        // 3. Wait for dashboard page to load
        await expect(page).toHaveURL('/');

        // 4. Click SideBar '外国人材管理' to go to /workers
        await page.locator('aside a[href="/workers"]').click();
        await expect(page).toHaveURL(/\/workers/);

        // 5. Verify the data table is visible by checking heading
        await expect(page.locator('h2')).toBeVisible();

        // 6. Create a new worker to ensure we have one
        await page.locator('a[href="/workers/new"]').click();
        await expect(page).toHaveURL(/\/workers\/new/);

        // Fill out minimum required fields
        const testName = 'TEST WORKER ' + Math.random().toString(36).substring(7).toUpperCase();
        await page.fill('input[name="full_name_romaji"]', testName);
        await page.fill('input[name="full_name_kana"]', 'テスト ワーカー');
        await page.fill('input[name="dob"]', '1995-01-01');

        // Wait for the save button and click it
        await page.locator('main form button[type="submit"]').click();

        // Wait to return to /workers page
        await expect(page).toHaveURL(/.*\/workers$/);

        // Allow table to refresh data
        await page.waitForTimeout(1000);

        // 7. Click the newest worker's edit link (first one in the list)
        const workerLink = page.locator('a[href*="/edit"]').first();
        await expect(workerLink).toBeVisible({ timeout: 10000 });
        await workerLink.click();

        // 8. Wait for navigation to /workers/[id]/edit
        await expect(page).toHaveURL(/\/workers\/[^/]+\/edit/);

        // 9. Click "関連書類・ファイル管理" (Document Management)
        const docMgmtLink = page.locator('a[href$="/documents"]').first();
        await expect(docMgmtLink).toBeVisible();
        await docMgmtLink.click();

        // 10. Wait for navigation to /workers/[id]/documents
        await expect(page).toHaveURL(/\/workers\/[^/]+\/documents/);
        await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });

        // 11. Start the upload process
        const fileInput = page.locator('input[type="file"]');

        // Set up dialog handler for possible alerts
        page.on('dialog', async dialog => {
            console.error('DIALOG MESSAGE:', dialog.message());
            await dialog.accept();
        });

        // Upload the file
        await fileInput.setInputFiles(testFilePath);

        // 12. Verify upload success (file name dummy.pdf should appear in the document list)
        await expect(page.locator('text=dummy.pdf').first()).toBeVisible({ timeout: 15000 });
    });
});
