import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('flow-node-node_1')).toBeVisible();
    
    // Add an extra node so we can delete without removing all nodes
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByTestId('flow-node-node_2')).toBeVisible();
  });

  test('TC-7.1: Delete key removes selected node', async ({ page }) => {
    // Get initial node count
    const initialJson = await page.locator('code').textContent();
    const initialNodes = JSON.parse(initialJson!).nodes.length;
    expect(initialNodes).toBe(2);

    // Select Node 2 using test ID
    await page.getByTestId('flow-node-node_2').click();
    await expect(page.getByText('Node Properties')).toBeVisible();

    // Press Delete key (need to focus on body/canvas first)
    await page.locator('.react-flow').press('Delete');

    // Verify node was deleted
    await expect(page.getByTestId('flow-node-node_2')).not.toBeVisible({ timeout: 3000 });

    // Verify JSON updated
    const updatedJson = await page.locator('code').textContent();
    const updatedNodes = JSON.parse(updatedJson!).nodes.length;
    expect(updatedNodes).toBe(initialNodes - 1);
  });

  test('TC-7.2: Delete in input field does not delete node', async ({ page }) => {
    // Select Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Wait for sidebar to be visible
    await expect(page.getByText('Node Properties')).toBeVisible();

    // Focus on the title input
    const titleInput = page.getByLabel('Title *');
    await titleInput.click();
    
    // Clear and type some text
    await titleInput.fill('Test Title');
    await titleInput.blur();
    
    // Wait for update
    await page.waitForTimeout(100);
    
    // Now focus again and delete a character
    await titleInput.click();
    await titleInput.press('End');
    await titleInput.press('Backspace');
    await titleInput.blur();

    // Verify node count unchanged (2 nodes) - that's the main assertion
    const json = await page.locator('code').textContent();
    const nodes = JSON.parse(json!).nodes.length;
    expect(nodes).toBe(2);
    
    // Also verify the node label updated correctly (with 'e' deleted)
    await expect(page.locator('code')).toContainText('Test Titl');
  });

  test('TC-7.3: Backspace key also removes selected node', async ({ page }) => {
    // Get initial node count
    const initialJson = await page.locator('code').textContent();
    const initialNodes = JSON.parse(initialJson!).nodes.length;

    // Select Node 2 using test ID
    await page.getByTestId('flow-node-node_2').click();
    await expect(page.getByText('Node Properties')).toBeVisible();

    // Click somewhere outside inputs but still on the page
    await page.locator('.react-flow').click({ position: { x: 10, y: 10 } });
    
    // Re-select the node using test ID
    await page.getByTestId('flow-node-node_2').click();

    // Press Backspace key
    await page.locator('.react-flow').press('Backspace');

    // Verify node was deleted
    await expect(page.getByTestId('flow-node-node_2')).not.toBeVisible({ timeout: 3000 });

    // Verify JSON updated
    const updatedJson = await page.locator('code').textContent();
    const updatedNodes = JSON.parse(updatedJson!).nodes.length;
    expect(updatedNodes).toBe(initialNodes - 1);
  });
});
