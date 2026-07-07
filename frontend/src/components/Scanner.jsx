import { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

/**
 * Scanner de código de barras usando @ericblade/quagga2.
 * Especializado en EAN-13 / EAN-8 para máxima velocidad.
 * Props:
 *   onScanSuccess(code: string) — callback al leer un código
 *   onClose()                   — callback al cancelar
 */
export default function Scanner({ onScanSuccess, onClose }) {
  const scannerRef  = useRef(null);
  const detectedRef = useRef(null); // evita doble callback
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
          // Restringe el área de decodificación al centro (igual que el marco visual)
          area: {
            top:    '20%',
            right:  '10%',
            left:   '10%',
            bottom: '20%',
          },
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

      // Filtro de calidad: descarta lecturas con demasiado ruido
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#0f1f16', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <p className="font-black text-white text-base">Escanear código</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(240,253,244,0.4)' }}>
              Apunta al código de barras del producto
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,253,244,0.5)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Visor de cámara ── */}
        {/*
          position:relative + overflow:hidden en este div impide que el canvas
          de Quagga empuje el layout y provoque el efecto de "zoom out".
        */}
        <div
          className="relative bg-black"
          style={{ aspectRatio: '4/3', overflow: 'hidden' }}
        >
          {/*
            Quagga inyecta aquí un <video> y un <canvas>.
            Los estilos de abajo los fuerzan a ocupar exactamente
            el contenedor sin desbordarse ni reposicionarse.
          */}
          <div
            ref={scannerRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />

          {/* Oculta el canvas de debug de Quagga y ajusta el video */}
          <style>{`
            .quagga-viewport { position: absolute !important; inset: 0 !important; }
            .quagga-viewport video {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
            }
            .quagga-viewport canvas.drawingBuffer { display: none !important; }
          `}</style>

          {/* ── Marco de escaneo ── */}
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-36">
                {[
                  'top-0 left-0 border-t-2 border-l-2',
                  'top-0 right-0 border-t-2 border-r-2',
                  'bottom-0 left-0 border-b-2 border-l-2',
                  'bottom-0 right-0 border-b-2 border-r-2',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-6 h-6 ${cls} border-emerald-400`} />
                ))}
                <div
                  className="absolute left-2 right-2 h-0.5 bg-emerald-400"
                  style={{
                    top: '50%',
                    boxShadow: '0 0 8px 2px rgba(52,211,153,0.6)',
                    animation: 'scanLine 1.8s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/70">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-sm mb-1">Cámara no disponible</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{error}</p>
            </div>
          )}

          {/* ── Loading ── */}
          {!scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-white text-sm font-medium">Iniciando cámara…</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(239,68,68,0.12)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            Cancelar
          </button>
        </div>

        {/* ── Animación línea de escaneo ── */}
        <style>{`
          @keyframes scanLine {
            0%   { transform: translateY(-28px); opacity: 0.6; }
            50%  { transform: translateY(28px);  opacity: 1; }
            100% { transform: translateY(-28px); opacity: 0.6; }
          }
        `}</style>
      </div>
    </div>
  );
}
