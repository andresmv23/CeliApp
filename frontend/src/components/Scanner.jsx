import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser'; // ❌ Eliminado NotFoundException


/**
 * Scanner de código de barras usando @zxing/browser.
 * Abre la cámara DIRECTAMENTE (sin selector de archivo).
 * Props:
 *   onScanSuccess(code: string) — callback al leer un código
 *   onClose()                   — callback al cancelar
 */
export default function Scanner({ onScanSuccess, onClose }) {
  const videoRef   = useRef(null);
  const readerRef  = useRef(null);
  const controlsRef = useRef(null);


  const [error, setError]       = useState(null);
  const [cameras, setCameras]   = useState([]);
  const [camIdx, setCamIdx]     = useState(0);
  const [scanning, setScanning] = useState(false);


  /* ── Detectar cámaras disponibles ───────────────────── */
  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        if (!devices.length) {
          setError('No se detectó ninguna cámara en este dispositivo.');
          return;
        }
        setCameras(devices);
      })
      .catch(() => setError('No se pudo acceder a la cámara. Revisa los permisos del navegador.'));
  }, []);


  /* ── Iniciar escaneo cuando hay cámaras ─────────────── */
  useEffect(() => {
    if (!videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setScanning(true);
    setError(null);

    const constraints = {
      video: {
        facingMode: camIdx === 0 ? { ideal: 'environment' } : { ideal: 'user' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      }
    };

    reader
      .decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, err, controls) => {
          controlsRef.current = controls;
          if (result) {
            controls.stop();
            onScanSuccess(result.getText());
          }
          // ✅ CORRECCIÓN: Comprobamos el nombre del error en lugar de usar instanceof
          if (err && err.name !== 'NotFoundException') {
            console.warn('[Scanner]', err);
          }
        }
      )
      .catch((e) => {
        const msg = e?.message ?? '';
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          setError('Permiso de cámara denegado. Actívalo en la configuración del navegador.');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setError('No se encontró ninguna cámara compatible.');
        } else {
          setError('No se pudo iniciar la cámara. Inténtalo de nuevo.');
        }
        setScanning(false);
      });

    return () => {
      controlsRef.current?.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camIdx]);


  /* ── Cambiar cámara ──────────────────────────────────── */
  const switchCamera = () => {
    controlsRef.current?.stop();
    setCamIdx((i) => (i + 1) % cameras.length);
  };


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
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>


        {/* Visor de cámara */}
        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />


          {/* Marco de escaneo */}
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Línea de escaneo animada */}
              <div className="relative w-56 h-36">
                {/* Esquinas */}
                {[
                  'top-0 left-0 border-t-2 border-l-2',
                  'top-0 right-0 border-t-2 border-r-2',
                  'bottom-0 left-0 border-b-2 border-l-2',
                  'bottom-0 right-0 border-b-2 border-r-2',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-6 h-6 ${cls} border-emerald-400`} />
                ))}
                {/* Línea de escaneo */}
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


          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/70">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
              </div>
              <p className="text-white font-semibold text-sm mb-1">Cámara no disponible</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{error}</p>
            </div>
          )}


          {/* Loading state */}
          {!scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-white text-sm font-medium">Iniciando cámara…</p>
              </div>
            </div>
          )}
        </div>


        {/* Footer */}
        <div className="px-5 py-4 flex items-center gap-3">
          {/* Cambiar cámara (solo si hay más de una) */}
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(240,253,244,0.6)',
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-1.5 4 1.5 4-1.5 4 1.5z"/>
              </svg>
              Cambiar cámara
            </button>
          )}


          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            Cancelar
          </button>
        </div>


        {/* Animación línea de escaneo */}
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
