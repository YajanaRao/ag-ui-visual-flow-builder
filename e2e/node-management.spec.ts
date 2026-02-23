import { test, expect } from '@playwright/test';

test.describe('Node Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the initial node to load using specific test ID
    await expect(page.getByTestId('flow-node-node_1')).toBeVisible();
  });

  test('TC-2.1: Add new node via button', async ({ page }) => {
    // Get initial node count from JSON
    const initialJson = await page.locator('code').textContent();
    const initialNodes = JSON.parse(initialJson!).nodes.length;

    // Click Add Node button
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();

    // Wait for new node to appear using test ID pattern
    await expect(page.getByTestId('flow-node-node_2')).toBeVisible({ timeout: 5000 });

    // Verify JSON updated
    const updatedJson = await page.locator('code').textContent();
    const updatedNodes = JSON.parse(updatedJson!).nodes.length;
    expect(updatedNodes).toBe(initialNodes + 1);
  });

  test('TC-2.2: Click node selects it and shows sidebar', async ({ page }) => {
    // Click on the Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Check sidebar shows node properties
    await expect(page.getByText('Node Properties')).toBeVisible();
    await expect(page.getByLabel('Node ID *')).toBeVisible();
    await expect(page.getByLabel('Title *')).toBeVisible();
  });

  test('TC-2.3: Edit node ID updates JSON', async ({ page }) => {
    // Click on the Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Clear and type new ID
    const idInput = page.getByLabel('Node ID *');
    await idInput.clear();
    await idInput.fill('my_custom_id');
    await idInput.blur();

    // Verify JSON updated
    await expect(page.locator('code')).toContainText('my_custom_id');
  });

  test('TC-2.4: Edit node title updates node and JSON', async ({ page }) => {
    // Click on the Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Clear and type new title
    const titleInput = page.getByLabel('Title *');
    await titleInput.clear();
    await titleInput.fill('My New Title');
    await titleInput.blur();

    // Verify node label updated on canvas - use getByTestId to find node then check label
    await expect(page.getByTestId('flow-node-node_1').getByTestId('node-label')).toContainText('My New Title');

    // Verify JSON updated
    await expect(page.locator('code')).toContainText('My New Title');
  });

  test('TC-2.5: Edit node description updates JSON', async ({ page }) => {
    // Click on the Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Clear and type new description
    const descriptionInput = page.getByLabel('Description (optional)');
    await descriptionInput.clear();
    await descriptionInput.fill('This is a new description text');
    await descriptionInput.blur();

    // Verify JSON updated
    await expect(page.locator('code')).toContainText('This is a new description text');
  });

  test('TC-2.6: Delete node via sidebar removes it', async ({ page }) => {
    // First add a new node
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByTestId('flow-node-node_2')).toBeVisible();

    // Select the new node
    await page.getByTestId('flow-node-node_2').click();

    // Get initial node count
    const initialJson = await page.locator('code').textContent();
    const initialNodes = JSON.parse(initialJson!).nodes.length;

    // Click delete button in sidebar
    await page.getByTestId('delete-node-button').click();

    // Verify node removed
    await expect(page.getByTestId('flow-node-node_2')).not.toBeVisible();

    // Verify JSON updated
    const updatedJson = await page.locator('code').textContent();
    const updatedNodes = JSON.parse(updatedJson!).nodes.length;
    expect(updatedNodes).toBe(initialNodes - 1);
  });

  test('TC-2.7: Set node as start shows star icon', async ({ page }) => {
    // Add a new node
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByTestId('flow-node-node_2')).toBeVisible();

    // Select the new node
    await page.getByTestId('flow-node-node_2').click();

    // Click "Set as Start" button
    await page.getByRole('button', { name: 'Set as Start' }).click();

    // Verify the button changed to "Start Node"
    await expect(page.getByRole('button', { name: 'Start Node' })).toBeVisible();

    // Verify JSON updated - Node 2 should be start, node_1 should not
    const json = await page.locator('code').textContent();
    const parsed = JSON.parse(json!);
    const node2 = parsed.nodes.find((n: any) => n.title === 'Node 2');
    const node1 = parsed.nodes.find((n: any) => n.id === 'node_1');
    
    expect(node2.isStart).toBe(true);
    expect(node1.isStart).toBe(false);
  });

  test('TC-2.8: Click canvas deselects node', async ({ page }) => {
    // Click on the Welcome Node to select it using test ID
    await page.getByTestId('flow-node-node_1').click();
    await expect(page.getByText('Node Properties')).toBeVisible();

    // Click on the canvas background
    await page.locator('.react-flow__pane').click({ position: { x: 10, y: 10 } });

    // Verify sidebar shows placeholder
    await expect(page.getByText('Select a node to edit its properties')).toBeVisible();
  });
});
