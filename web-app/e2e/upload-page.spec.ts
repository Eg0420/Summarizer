import { expect, test } from '@playwright/test';

test.describe('upload page', () => {
  test('shows the PDF upload experience', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/PDF Summarizer/);
    await expect(page.getByRole('heading', { name: 'Upload PDF' })).toBeVisible();
    await expect(page.getByText('Upload a PDF to get started')).toBeVisible();
    await expect(page.getByText('Drag and drop your PDF here')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload File' })).toBeVisible();
    await expect(page.getByTestId('pdf-file-input')).toHaveAttribute('accept', '.pdf');
  });

  test('highlights the drop zone while dragging a file over it', async ({ page }) => {
    await page.goto('/');

    const dropZone = page.getByTestId('pdf-drop-zone');
    await dropZone.dispatchEvent('dragover', {
      dataTransfer: await page.evaluateHandle(() => new DataTransfer()),
    });

    await expect(dropZone).toHaveClass(/border-blue-500/);
    await expect(dropZone).toHaveClass(/bg-blue-50/);

    await dropZone.dispatchEvent('dragleave');
    await expect(dropZone).not.toHaveClass(/border-blue-500/);
  });
});
