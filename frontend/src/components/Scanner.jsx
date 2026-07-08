import { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

/**
 * Scanner de código de barras usando @ericblade/quagga2.
 * Especializado en EAN-13 / EAN-8 para máxima velocidad.
 * Props:
 *   onScanSuccess(code: string) — callback al leer un código
 *   onClose()                   — callback al cancelar
 */

const scannerStyles = `
  .scanner-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(5, 15, 10, 0.92);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  .scanner-card {
    position: relative;
    width: 100%;
    max-width: 360px;
    border-radius: 1.25rem;
    overflow: hidden;
    background: #0d1f14;
    border: 1px solid rgba(22, 163, 74, 0.18);
    box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(22,163,74,0.08);
  }

  .scanner-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.125rem 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .scanner-close-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    transition: background 180ms ease, color 180ms ease;
    flex-shrink: 0;
  }
  .scanner-close-btn:hover {
    background: rgba(255,255,255,0.13);
    color: rgba(255,255,255,0.85);
  }

  .scanner-viewport-wrap {
    position: relative;
    background: #000;
    aspect-ratio: 4 / 3;
    overflow: hidden;
  }

  .scanner-ref {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* Quagga overrides */
  .quagga-viewport { position: absolute !important; inset: 0 !important; }
  .quagga-viewport video {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
  .quagga-viewport canvas.drawingBuffer { display: none !important; }

  /* Marco de escaneo */
  .scan-frame {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .scan-box {
    position: relative;
    width: 14rem;
    height: 9rem;
  }
  .scan-corner {
    position: absolute;
    width: 1.375rem;
    height: 1.375rem;
    border-color: #4ade80;
    border-style: solid;
    border-width: 0;
  }
  .scan-corner-tl { top: 0; left: 0;  border-top-width: 2px; border-left-width: 2px;  border-radius: 2px 0 0 0; }
  .scan-corner-tr { top: 0; right: 0; border-top-width: 2px; border-right-width: 2px; border-radius: 0 2px 0 0; }
  .scan-corner-bl { bottom: 0; left: 0;  border-bottom-width: 2px; border-left-width: 2px;  border-radius: 0 0 0 2px; }
  .scan-corner-br { bottom: 0; right: 0; border-bottom-width: 2px; border-right-width: 2px; border-radius: 0 0 2px 0; }
  .scan-line {
    position: absolute;
    left: 0.5rem;
    right: 0.5rem;
    height: 1.5px;
    top: 50%;
    background: #4ade80;
    border-radius: 2px;
    box-shadow: 0 0 8px 2px rgba(74,222,128,0.55);
    animation: scanLine 1.8s ease-in-out infinite;
  }
  @keyframes scanLine {
    0%   { transform: translateY(-2.25rem); opacity: 0.6; }
    50%  { transform: translateY(2.25rem);  opacity: 1; }
    100% { transform: translateY(-2.25rem); opacity: 0.6; }
  }

  /* Estado loading */
  .scan-loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    background: rgba(0,0,0,0.5);
  }
  .scan-spinner {
    width: 2rem;
    height: 2rem;
    border: 2.5px solid rgba(74,222,128,0.2);
    border-top-color: #4ade80;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Estado error */
  .scan-error-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    text-align: center;
    background: rgba(0,0,0,0.72);
  }
  .scan-error-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: rgba(220,38,38,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.75rem;
  }

  /* Footer */
  .scanner-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .scanner-cancel-btn {
    width: 100%;
    padding: 0.6875rem 1rem;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 600;
    border-radius: 0.625rem;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
  }
  .scanner-cancel-btn:hover {
    background: rgba(255,255,255,0.09);
    color: rgba(255,255,255,0.85);
    border-color: rgba(255,255,255,0.18);
  }
`;

export default function Scanner({ onScanSuccess, onClose }) {
  const scannerRef  = useRef(null);
  const detectedRef = useRef(null);
  const [error, setError]       = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!scannerRef.current) return;
    let active = true;

    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            facingMode: 'environment',
            width:  { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720,  max: 1080 },
            aspectRatio: { ideal: 4 / 3 },
          },
          area: { top: '20%', right: '10%', left: '10%', bottom: '20%' },
        },
        decoder: {
          readers:  ['ean_reader', 'ean_8_reader'],
          multiple: false,
        },
        locate:       true,
        numOfWorkers: typeof navigator !== 'undefined'
          ? Math.min(navigator.hardwareConcurrency ?? 2, 4)
          : 2,
        frequency: 12,
      },
      (err) => {
        if (!active) return;
        if (err) {
          const msg = err?.message ?? '';
          if (msg.includes('Permission') || msg.includes('NotAllowed')) {
            setError('Permiso de cámara denegado. Actívalo en la configuración del navegador.');
          } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
            setError('No se encontró ninguna cámara compatible.');
          } else {
            setError('No se pudo iniciar la cámara. Inténtalo de nuevo.');
          }
          return;
        }
        Quagga.start();
        setScanning(true);
      }
    );

    Quagga.onDetected((data) => {
      if (!active) return;
      const code = data?.codeResult?.code;
      if (!code) return;
      const errors = (data.codeResult.decodedCodes ?? [])
        .filter((c) => c.error !== undefined)
        .map((c) => c.error);
      const avgError = errors.length
        ? errors.reduce((s, e) => s + e, 0) / errors.length
        : 1;
      if (avgError < 0.18 && code !== detectedRef.current) {
        detectedRef.current = code;
        active = false;
        Quagga.stop();
        onScanSuccess(code);
      }
    });

    return () => {
      active = false;
      Quagga.stop();
      Quagga.offDetected();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{scannerStyles}</style>
      <div
        className="scanner-overlay"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        role="dialog"
        aria-modal="true"
        aria-label="Escáner de código de barras"
      >
        <div className="scanner-card">

          {/* ── Header ── */}
          <div className="scanner-header">
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9375rem', color: '#fff' }}>
                Escanear código
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', marginTop: '0.125rem', color: 'rgba(255,255,255,0.38)' }}>
                Apunta al código de barras del producto
              </p>
            </div>
            <button
              className="scanner-close-btn"
              onClick={onClose}
              aria-label="Cerrar escáner"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Visor cámara ── */}
          <div className="scanner-viewport-wrap">
            <div ref={scannerRef} className="scanner-ref" />

            {/* Marco de escaneo */}
            {scanning && !error && (
              <div className="scan-frame">
                <div className="scan-box">
                  <div className="scan-corner scan-corner-tl" />
                  <div className="scan-corner scan-corner-tr" />
                  <div className="scan-corner scan-corner-bl" />
                  <div className="scan-corner scan-corner-br" />
                  <div className="scan-line" />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="scan-error-overlay">
                <div className="scan-error-icon">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9375rem', color: '#fff', marginBottom: '0.375rem' }}>
                  Cámara no disponible
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Loading */}
            {!scanning && !error && (
              <div className="scan-loading">
                <div className="scan-spinner" />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                  Iniciando cámara…
                </p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="scanner-footer">
            <button className="scanner-cancel-btn" onClick={onClose}>
              Cancelar
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
