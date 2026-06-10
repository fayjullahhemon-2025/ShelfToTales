'use client';

import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PdfViewer({ url, title }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = useCallback(({ numPages: total }) => {
    setNumPages(total);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    setError('Failed to load PDF. The file may be unavailable.');
    setLoading(false);
    console.error('PDF load error:', err);
  }, []);

  const goToPrevPage = () => setPageNumber(p => Math.max(1, p - 1));
  const goToNextPage = () => setPageNumber(p => Math.min(numPages || 1, p + 1));
  const zoomIn = () => setScale(s => Math.min(3, s + 0.2));
  const zoomOut = () => setScale(s => Math.max(0.4, s - 0.2));
  const fitWidth = () => setScale(1.2);

  if (error) {
    return (
      <div className="text-center py-5">
        <i className="fa-solid fa-file-pdf fa-3x text-muted mb-3" />
        <p className="text-muted">{error}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
          <i className="fa-solid fa-external-link me-1" /> Open in New Tab
        </a>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-wrapper">
      {/* Toolbar */}
      <div className="pdf-toolbar d-flex align-items-center justify-content-between p-2 bg-light border-bottom">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={goToPrevPage} disabled={pageNumber <= 1}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <span className="small text-muted">
            Page {pageNumber} of {numPages || '...'}
          </span>
          <button className="btn btn-sm btn-outline-secondary" onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)}>
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={zoomOut} title="Zoom out">
            <i className="fa-solid fa-minus" />
          </button>
          <span className="small text-muted">{Math.round(scale * 100)}%</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={zoomIn} title="Zoom in">
            <i className="fa-solid fa-plus" />
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={fitWidth} title="Fit width">
            <i className="fa-solid fa-arrows-left-right" />
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary ms-2" title="Open in new tab">
            <i className="fa-solid fa-external-link" />
          </a>
        </div>
      </div>

      {/* PDF Document */}
      <div className="pdf-document-container" style={{ overflow: 'auto', maxHeight: '70vh', background: '#525659', display: 'flex', justifyContent: 'center', padding: '1rem' }}>
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-light" />
            <p className="text-light mt-2">Loading PDF...</p>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}

export default PdfViewer;
