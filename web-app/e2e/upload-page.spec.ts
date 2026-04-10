import { expect, test } from '@playwright/test';

test.describe('upload page', () => {
  test('shows the PDF upload experience', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/PDF Summarizer/);
    await expect(page.getByRole('heading', { name: 'Upload PDF' })).toBeVisible();
    await expect(page.getByText('Upload a PDF to get started')).toBeVisible();
    await expect(page.getByText('Drag and drop your PDF here')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload File' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Process PDF' })).toBeDisabled();
    await expect(page.getByTestId('pdf-file-input')).toHaveAttribute('accept', '.pdf');
  });

  test('uploads a PDF and shows the summary and chat', async ({ page }) => {
    await page.route('**/api/process', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          documentId: 'doc-123',
          filename: 'sample.pdf',
          textLength: 120,
          chunkCount: 2,
        }),
      });
    });
    await page.route('**/api/summarize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          documentId: 'doc-123',
          filename: 'sample.pdf',
          summary: 'Document Summary: This PDF is ready.',
          tokensUsed: 14,
        }),
      });
    });

    await page.goto('/');
    await page.getByTestId('pdf-file-input').setInputFiles({
      name: 'sample.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n%%EOF'),
    });

    await expect(page.getByTestId('selected-file')).toContainText('sample.pdf');
    await page.getByRole('button', { name: 'Process PDF' }).click();

    await expect(page.getByTestId('summary')).toContainText('Document Summary: This PDF is ready.');
    await expect(page.getByPlaceholder('Ask a question...')).toBeVisible();
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
