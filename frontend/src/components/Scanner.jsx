import { useEffect, useRef, useState } from 'react';
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
} from '@zxing/browser';

function GalleryIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0z" /></svg>;
}

function getCameraErrorMessage(cameraError) {
  const name = cameraError?.name ?? '';

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Permiso de cámara denegado. Actívalo en la configuración del navegador.';
  }

  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No se encontró ninguna cámara compatible.';
  }

  return 'No se pudo iniciar la cámara. Inténtalo de nuevo.';
}

function createCodeReader(options) {
  const codeReader = new BrowserMultiFormatReader(undefined, options);

  codeReader.possibleFormats = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
  ];

  return codeReader;
}

export default function Scanner({ onScanSuccess, onClose }) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const controlsRef = useRef(null);
  const detectedRef = useRef(null);

  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return undefined;

    let active = true;

    const codeReader = createCodeReader({
      delayBetweenScanAttempts: 150,
      delayBetweenScanSuccess: 1000,
    });

    const startScanner = async () => {
      try {
        const controls = await codeReader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          videoRef.current,
          (result, scanError) => {
            if (!active) return;

            if (result) {
              const code = result.getText();

              if (code && code !== detectedRef.current) {
                detectedRef.current = code;
                active = false;
                controls.stop();
                onScanSuccess(code);
              }

              return;
            }
          },
        );

        if (!active) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setScanning(true);
      } catch (cameraError) {
        if (active) {
          setError(getCameraErrorMessage(cameraError));
        }
      }
    };

    startScanner();

    return () => {
      active = false;
      controlsRef.current?.stop();
      codeReader.reset();
    };
  }, [onScanSuccess]);

  const handleGalleryFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setGalleryLoading(true);
    setError(null);

    const codeReader = createCodeReader();

    try {
      const imageUrl = URL.createObjectURL(file);
      const result = await codeReader.decodeFromImageUrl(imageUrl);

      URL.revokeObjectURL(imageUrl);

      if (result?.getText()) {
        onScanSuccess(result.getText());
        return;
      }

      setError('No se detectó un código EAN en la imagen. Comprueba que se vea completo y nítido.');
    } catch {
      setError('No se detectó un código EAN en la imagen. Comprueba que se vea completo y nítido.');
    } finally {
      codeReader.reset();
      setGalleryLoading(false);
    }
  };

  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#050f0a]/90 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label="Escáner de código de barras"><div className="w-full max-w-[390px] overflow-hidden rounded-t-xl border border-white/15 bg-[#0d1f14] sm:rounded-xl"><header className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="text-[0.9375rem] font-bold text-white">Escanear código</p><p className="mt-0.5 text-[0.8125rem] text-white/40">Muestra el EAN completo dentro del recuadro</p></div><button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 transition-colors hover:bg-white/[0.13] hover:text-white" onClick={onClose} aria-label="Cerrar escáner"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></header><div className="relative aspect-[4/3] overflow-hidden bg-black"><video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />{scanning && !error && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><div className="relative h-36 w-56"><i className="absolute left-0 top-0 h-[22px] w-[22px] rounded-tl-sm border-l-2 border-t-2 border-green-300" /><i className="absolute right-0 top-0 h-[22px] w-[22px] rounded-tr-sm border-r-2 border-t-2 border-green-300" /><i className="absolute bottom-0 left-0 h-[22px] w-[22px] rounded-bl-sm border-b-2 border-l-2 border-green-300" /><i className="absolute bottom-0 right-0 h-[22px] w-[22px] rounded-br-sm border-b-2 border-r-2 border-green-300" /><i className="absolute left-2 right-2 top-1/2 h-px animate-[scanLine_1.4s_ease-in-out_infinite] rounded bg-green-300 shadow-[0_0_8px_2px_rgba(74,222,128,0.55)]" /></div><p className="mt-4 rounded-full bg-black/45 px-3 py-1.5 text-center text-[0.75rem] font-medium text-white/80">Enfoca el EAN sin acercarlo demasiado</p></div>}{error && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-300"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" /></svg></div><p className="mb-1 text-sm font-semibold text-white">Cámara no disponible</p><p className="text-[0.8125rem] leading-relaxed text-white/50">{error}</p></div>}{!scanning && !error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50"><div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-green-300/20 border-t-green-300" /><p className="text-sm font-medium text-white/70">Iniciando cámara…</p></div>}</div><footer className="border-t border-white/10 p-4"><button type="button" disabled={galleryLoading} onClick={() => fileInputRef.current?.click()} className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-green-200 transition-colors hover:bg-accent/20 disabled:cursor-wait disabled:opacity-60"><GalleryIcon />{galleryLoading ? 'Leyendo imagen…' : 'Elegir una foto de la galería'}</button><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryFile} /><button className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/65 transition-colors hover:border-white/20 hover:bg-white/[0.09] hover:text-white" onClick={onClose}>Cancelar</button></footer></div></div>;
}