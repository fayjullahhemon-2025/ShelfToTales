import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PdfViewer from './PdfViewer';

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs', () => 'mocked-worker-url');

vi.mock('react-pdf', () => ({
  pdfjs: { GlobalWorkerOptions: {}, version: '5.4.296' },
  Document: ({ children, onLoadSuccess }) => {
    React.useEffect(() => {
      onLoadSuccess({ numPages: 20 });
    }, [onLoadSuccess]);
    return <div data-testid="document">{children}</div>;
  },
  Page: ({ pageNumber }) => <div data-testid="page">Rendered page {pageNumber}</div>,
}));

describe('PdfViewer', () => {
  it('updates displayed page when initialPage changes after progress hydrates', async () => {
    const { rerender } = render(<PdfViewer url="/sample.pdf" title="Sample" initialPage={1} />);

    expect(await screen.findByText('Rendered page 1')).toBeInTheDocument();

    rerender(<PdfViewer url="/sample.pdf" title="Sample" initialPage={8} />);

    await waitFor(() => expect(screen.getByText('Rendered page 8')).toBeInTheDocument());
  });
});
