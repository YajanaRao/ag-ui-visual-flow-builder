import { test, expect } from '@playwright/test';

test.describe('Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('flow-node-node_1')).toBeVisible();
  });

  test('TC-4.1: Empty title shows error', async ({ page }) => {
    // Select Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Clear the title
    const titleInput = page.getByLabel('Title *');
    await titleInput.clear();
    await titleInput.blur();

    // Verify error message appears
    await expect(page.getByText('Title is required')).toBeVisible();
  });

  test('TC-4.2: Removing start node shows global error', async ({ page }) => {
    // Add a second node
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByTestId('flow-node-node_2')).toBeVisible();

    // Select Welcome Node (the start node) using test ID (force click in case of overlap)
    await page.getByTestId('flow-node-node_1').click({ force: true });

    // Delete it
    await page.getByTestId('delete-node-button').click();

    // Verify global error about missing start node
    await expect(page.getByText('A start node is required')).toBeVisible();
  });

  test('TC-4.3: Edge missing condition shows error', async ({ page }) => {
    // Add a second node
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByTestId('flow-node-node_2')).toBeVisible();

    // Select Welcome Node using test ID (force click in case of overlap)
    await page.getByTestId('flow-node-node_1').click({ force: true });

    // Add an edge using data-testid
    await page.getByTestId('add-edge-button').click();

    // Select target but leave condition empty
    const targetSelect = page.locator('select');
    await targetSelect.selectOption({ label: 'Node 2' });

    // Verify error appears - use exact match to avoid duplicates
    await expect(page.getByText('Condition is required', { exact: true })).toBeVisible();
  });

  test('TC-4.4: Edge missing target shows error', async ({ page }) => {
    // Add a second node
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByTestId('flow-node-node_2')).toBeVisible();

    // Select Welcome Node using test ID (force click in case of overlap)
    await page.getByTestId('flow-node-node_1').click({ force: true });

    // Add an edge using data-testid
    await page.getByTestId('add-edge-button').click();

    // Fill condition but leave target empty
    const conditionInput = page.getByPlaceholder('if user clicks yes');
    await conditionInput.fill('some condition');

    // Verify error appears - use exact match to avoid duplicates
    await expect(page.getByText('Target node is required', { exact: true })).toBeVisible();
  });

  test('TC-4.5: Node with validation error has visual indicator', async ({ page }) => {
    // Select Welcome Node using test ID
    await page.getByTestId('flow-node-node_1').click();

    // Clear the title to trigger error
    const titleInput = page.getByLabel('Title *');
    await titleInput.clear();
    await titleInput.blur();

    // Wait for validation
    await expect(page.getByText('Title is required')).toBeVisible();

    // Check that error section is visible
    await expect(page.getByText('Validation Errors:')).toBeVisible();
  });
});
