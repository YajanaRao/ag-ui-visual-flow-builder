import { test, expect } from '@playwright/test';

test.describe('Edge Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the initial node to load using test ID
    await expect(page.getByTestId('flow-node-node_1')).toBeVisible();
    
    // Add a second node for edge testing
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByTestId('flow-node-node_2')).toBeVisible();
  });

  test('TC-3.1: Add edge from sidebar', async ({ page }) => {
    // Select Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Check initial state - no edges
    await expect(page.getByText('No outgoing edges')).toBeVisible();

    // Click the + button to add edge (using data-testid)
    await page.getByTestId('add-edge-button').click();

    // Verify edge form appears with target dropdown and condition input
    await expect(page.getByText('Target Node', { exact: true })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Condition' })).toBeVisible();
  });

  test('TC-3.2: Select edge target updates JSON', async ({ page }) => {
    // Select Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Add an edge using data-testid
    await page.getByTestId('add-edge-button').click();

    // Select target node from dropdown
    const targetSelect = page.locator('select');
    await targetSelect.selectOption({ label: 'Node 2' });

    // Verify JSON updated with edge target
    await expect(page.locator('code')).toContainText('node_2');
  });

  test('TC-3.3: Edit edge condition updates JSON', async ({ page }) => {
    // Select Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Add an edge using data-testid
    await page.getByTestId('add-edge-button').click();

    // Find and fill the condition input
    const conditionInput = page.getByPlaceholder('if user clicks yes');
    await conditionInput.fill('if user accepts terms');

    // Verify JSON updated
    await expect(page.locator('code')).toContainText('if user accepts terms');
  });

  test('TC-3.4: Delete edge removes it', async ({ page }) => {
    // Select Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Add an edge using data-testid
    await page.getByTestId('add-edge-button').click();

    // Fill in the edge details
    const targetSelect = page.locator('select');
    await targetSelect.selectOption({ label: 'Node 2' });

    const conditionInput = page.getByPlaceholder('if user clicks yes');
    await conditionInput.fill('test condition');

    // Verify edge exists in JSON
    await expect(page.locator('code')).toContainText('test condition');

    // Click Remove Edge button
    await page.getByRole('button', { name: 'Remove Edge' }).click();

    // Verify edge removed
    await expect(page.getByText('No outgoing edges')).toBeVisible();
  });

  test('TC-3.5: Multiple edges can be added to a node', async ({ page }) => {
    // Add a third node
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByTestId('flow-node-node_3')).toBeVisible();

    // Select Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Add first edge using data-testid
    await page.getByTestId('add-edge-button').click();
    await page.locator('select').first().selectOption({ label: 'Node 2' });
    await page.getByPlaceholder('if user clicks yes').first().fill('condition 1');

    // Add second edge using data-testid
    await page.getByTestId('add-edge-button').click();
    
    // Wait for second edge form to appear
    const selects = page.locator('select');
    await expect(selects).toHaveCount(2);
    
    await selects.last().selectOption({ label: 'Node 3' });
    await page.getByPlaceholder('if user clicks yes').last().fill('condition 2');

    // Verify JSON has both edges
    const json = await page.locator('code').textContent();
    const parsed = JSON.parse(json!);
    const welcomeNode = parsed.nodes.find((n: any) => n.id === 'node_1');
    
    expect(welcomeNode.edges.length).toBe(2);
  });
});
