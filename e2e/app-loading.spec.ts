import { test, expect } from '@playwright/test';

test.describe('Application Loading Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-1.1: Application loads successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('flow-builder');
    
    // Check main heading is visible
    await expect(page.getByRole('heading', { name: 'Visual Flow Builder' })).toBeVisible();
  });

  test('TC-1.2: Canvas renders with React Flow', async ({ page }) => {
    // Check React Flow canvas is present
    const canvas = page.locator('.react-flow');
    await expect(canvas).toBeVisible();
    
    // Check controls are visible
    await expect(page.getByRole('button', { name: 'Zoom Out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fit View' })).toBeVisible();
  });

  test('TC-1.3: Initial node exists', async ({ page }) => {
    // Check Welcome Node is present using test ID
    await expect(page.getByTestId('flow-node-node_1')).toBeVisible();
    // Check the node label
    await expect(page.getByTestId('flow-node-node_1').getByTestId('node-label')).toContainText('Welcome Node');
  });

  test('TC-1.4: Sidebar shows placeholder when no node selected', async ({ page }) => {
    // Wait for canvas to be ready
    await expect(page.locator('.react-flow')).toBeVisible();
    
    // Initially no node should be selected, so placeholder should show
    // Or click on canvas background to ensure no node is selected
    await page.locator('.react-flow__pane').click({ position: { x: 50, y: 50 } });
    
    // Check placeholder message
    await expect(page.getByText('Select a node to edit its properties')).toBeVisible({ timeout: 5000 });
  });

  test('TC-1.5: JSON preview is visible', async ({ page }) => {
    // Check JSON Preview heading
    await expect(page.getByRole('heading', { name: 'JSON Preview' })).toBeVisible();
    
    // Check Copy and Download buttons
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
    
    // Check JSON content contains nodes
    await expect(page.locator('code')).toContainText('"nodes"');
  });

  test('TC-1.6: Toolbar buttons are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add Node', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import JSON' })).toBeVisible();
  });
});
