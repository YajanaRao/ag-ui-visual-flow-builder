import { test, expect } from '@playwright/test';

test.describe('JSON Preview Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('flow-node-node_1')).toBeVisible();
  });

  test('TC-5.1: JSON updates on changes', async ({ page }) => {
    // Get initial JSON
    const initialJson = await page.locator('code').textContent();
    expect(initialJson).toContain('Welcome Node');

    // Add a new node
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByTestId('flow-node-node_2')).toBeVisible();

    // Verify JSON updated
    const updatedJson = await page.locator('code').textContent();
    expect(updatedJson).toContain('node_2');
    expect(updatedJson).toContain('Node 2');
  });

  test('TC-5.2: Copy JSON to clipboard shows feedback', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click Copy button
    await page.getByRole('button', { name: 'Copy' }).click();

    // Verify feedback - button text should change to include "Copied!"
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible({ timeout: 5000 });

    // Wait for feedback to reset
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible({ timeout: 5000 });
  });

  test('TC-5.3: Download JSON triggers download', async ({ page }) => {
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click Download button
    await page.getByRole('button', { name: 'Download' }).click();

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('flow.json');
  });

  test('TC-5.4: JSON is valid format', async ({ page }) => {
    // Get JSON content
    const jsonContent = await page.locator('code').textContent();

    // Verify it's valid JSON
    expect(() => JSON.parse(jsonContent!)).not.toThrow();

    // Verify structure
    const parsed = JSON.parse(jsonContent!);
    expect(parsed).toHaveProperty('nodes');
    expect(Array.isArray(parsed.nodes)).toBe(true);
    expect(parsed.nodes.length).toBeGreaterThan(0);

    // Verify node structure
    const node = parsed.nodes[0];
    expect(node).toHaveProperty('id');
    expect(node).toHaveProperty('description');
    expect(node).toHaveProperty('position');
    expect(node).toHaveProperty('isStart');
    expect(node).toHaveProperty('edges');
  });

  test('TC-5.5: JSON reflects all node properties correctly', async ({ page }) => {
    // Select node using test ID
    await page.getByTestId('flow-node-node_1').click();
    
    // Wait for sidebar to be visible
    await expect(page.getByText('Node Properties')).toBeVisible();
    
    // Update description first (doesn't change node identity)
    const descriptionInput = page.getByLabel('Description (optional)');
    await descriptionInput.click();
    await descriptionInput.fill('Custom Description');
    await descriptionInput.blur();
    
    // Update title
    const titleInput = page.getByLabel('Title *');
    await titleInput.click();
    await titleInput.clear();
    await titleInput.fill('Custom Title');
    await titleInput.blur();
    
    // Update ID last (since it changes the node identity)
    const idInput = page.getByLabel('Node ID *');
    await idInput.click();
    await idInput.clear();
    await idInput.fill('custom_id');
    await idInput.blur();

    // Wait for JSON to update
    await page.waitForTimeout(200);

    // Verify JSON contains all updated values
    const json = await page.locator('code').textContent();
    const parsed = JSON.parse(json!);
    const node = parsed.nodes[0];

    expect(node.id).toBe('custom_id');
    expect(node.title).toBe('Custom Title');
    expect(node.description).toBe('Custom Description');
  });
});
