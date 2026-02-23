import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Import/Export Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('flow-node-node_1')).toBeVisible();
  });

  test('TC-6.1: Import valid JSON reconstructs flow', async ({ page }) => {
    // Prepare valid JSON to import
    const validFlow = {
      nodes: [
        {
          id: 'imported_start',
          title: 'Imported Start Node',
          description: 'This was imported',
          position: { x: 100, y: 100 },
          isStart: true,
          edges: [
            {
              id: 'imported_edge_1',
              to_node_id: 'imported_end',
              condition: 'always'
            }
          ]
        },
        {
          id: 'imported_end',
          title: 'Imported End Node',
          description: 'End of flow',
          position: { x: 100, y: 300 },
          isStart: false,
          edges: []
        }
      ]
    };

    // Create a temporary file for import
    const tempFilePath = path.join(__dirname, 'temp-import.json');
    fs.writeFileSync(tempFilePath, JSON.stringify(validFlow, null, 2));

    try {
      // Click Import JSON and select file
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Import JSON' }).click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(tempFilePath);

      // Verify nodes were imported using test IDs
      await expect(page.getByTestId('flow-node-imported_start')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('flow-node-imported_end')).toBeVisible({ timeout: 5000 });

      // Verify JSON preview updated
      const json = await page.locator('code').textContent();
      expect(json).toContain('imported_start');
      expect(json).toContain('imported_end');
    } finally {
      // Cleanup temp file
      fs.unlinkSync(tempFilePath);
    }
  });

  test('TC-6.2: Import updates node count correctly', async ({ page }) => {
    // Import a flow with 3 nodes
    const threeNodeFlow = {
      nodes: [
        { id: 'n1', title: 'Node 1', position: { x: 100, y: 100 }, isStart: true, edges: [] },
        { id: 'n2', title: 'Node 2', position: { x: 200, y: 100 }, isStart: false, edges: [] },
        { id: 'n3', title: 'Node 3', position: { x: 300, y: 100 }, isStart: false, edges: [] }
      ]
    };

    const tempFilePath = path.join(__dirname, 'temp-import-3.json');
    fs.writeFileSync(tempFilePath, JSON.stringify(threeNodeFlow, null, 2));

    try {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Import JSON' }).click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(tempFilePath);

      // Wait for import to complete using test ID
      await expect(page.getByTestId('flow-node-n1')).toBeVisible({ timeout: 5000 });

      // Verify JSON has exactly 3 nodes
      const json = await page.locator('code').textContent();
      const parsed = JSON.parse(json!);
      expect(parsed.nodes.length).toBe(3);
    } finally {
      fs.unlinkSync(tempFilePath);
    }
  });

  test('TC-6.3: Import invalid JSON shows error', async ({ page }) => {
    // Create invalid JSON file
    const tempFilePath = path.join(__dirname, 'temp-invalid.json');
    fs.writeFileSync(tempFilePath, 'this is not valid json {{{');

    // Setup dialog listener
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Import failed');
      await dialog.accept();
    });

    try {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Import JSON' }).click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(tempFilePath);

      // Wait a bit for the alert to trigger
      await page.waitForTimeout(1000);
    } finally {
      fs.unlinkSync(tempFilePath);
    }
  });

  test('TC-6.4: Export matches current state', async ({ page }) => {
    // Modify the flow using test ID
    await page.getByTestId('flow-node-node_1').click();
    const titleInput = page.getByLabel('Title *');
    await titleInput.clear();
    await titleInput.fill('Modified Node');
    await titleInput.blur();

    // Add another node
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByTestId('flow-node-node_2')).toBeVisible();

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    const download = await downloadPromise;

    // Read downloaded file
    const downloadPath = await download.path();
    const content = fs.readFileSync(downloadPath!, 'utf-8');
    const parsed = JSON.parse(content);

    // Verify exported content matches current state
    expect(parsed.nodes.length).toBe(2);
    expect(parsed.nodes[0].title).toBe('Modified Node');
  });
});
