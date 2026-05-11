import { useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * FotoAnalisis — permite al usuario fotografiar el producto
 * cuando no está convencido del resultado del EAN.
 *
 * Props:
 *   ean         — EAN buscado originalmente
 *   onResult(data) — callback con el nuevo resultado de la IA
 *   onClose()      — cerrar sin analizar
 */
export default function FotoAnalisis({ ean, onResult, onClose }) {
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);

  const [step, setStep]       = useState('choose');   // choose | camera | preview | analyzing
  const [preview, setPreview] = useState(null);       // data URL de la foto
  const [error, setError]     = useState(null);

  /* ── Abrir cámara ──────────────────────────────────── */
  const openCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setStep('camera');
      // Necesitamos esperar al siguiente tick para que el video esté en el DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 80);
    } catch {
      setError('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
    }
  }, []);

  /* ── Capturar foto desde cámara ────────────────────── */
  const capturePhoto = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(dataUrl);
    setStep('preview');

    // Parar stream
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  /* ── Seleccionar desde galería ─────────────────────── */
  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  /* ── Enviar foto a la IA ────────────────────────────── */
  const analyzePhoto = useCallback(async () => {
    if (!preview) return;
    setStep('analyzing');
    setError(null);

    try {
      // Convertir data URL a blob base64 puro
      const base64 = preview.split(',')[1];

      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await axios.post(
        `${API_URL}/analizar-imagen`,
        { ean, imagen_base64: base64 },
        { headers }
      );

      onResult(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('El servidor aún no tiene este endpoint. Pide al desarrollador que lo active.');
      } else if (err.response?.status === 413) {
        setError('La imagen es demasiado grande. Inténtalo con una foto más pequeña.');
      } else {
        setError('Error al analizar la imagen. Inténtalo de nuevo.');
      }
      setStep('preview');
    }
  }, [preview, ean, token, onResult]);

  /* ── Reintentar ────────────────────────────────────── */
  const retry = useCallback(() => {
    setPreview(null);
    setError(null);
    setStep('choose');
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  /* ── Cleanup ────────────────────────────────────────── */
  const handleClose = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#0f1f16', border: '1px solid rgba(255,255,255,0.08)' }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="font-black text-white text-base">Analizar con foto</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(240,253,244,0.4)' }}>
              La IA identificará el producto visualmente
            </p>
          </div>
          <button onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,253,244,0.5)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ══════════════════════════════════════════════
            STEP: CHOOSE — elegir cámara o galería
        ══════════════════════════════════════════════ */}
        {step === 'choose' && (
          <div className="p-6">
            <div className="rounded-2xl p-5 mb-5 text-center" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <p className="text-white font-semibold text-sm mb-1">
                Fotografía la etiqueta del producto
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,253,244,0.45)' }}>
                Enfoca la etiqueta de ingredientes o la parte frontal del envase.
                La IA analizará la imagen para identificarlo correctamente.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.15)' }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-3">
              {/* Cámara */}
              <button onClick={openCamera}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#10b981' }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Hacer foto ahora</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(240,253,244,0.4)' }}>Usa la cámara del dispositivo</p>
                </div>
                <svg className="w-4 h-4 ml-auto shrink-0" style={{ color: 'rgba(240,253,244,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </button>

              {/* Galería */}
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Elegir de la galería</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(240,253,244,0.4)' }}>Sube una foto existente</p>
                </div>
                <svg className="w-4 h-4 ml-auto shrink-0" style={{ color: 'rgba(240,253,244,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP: CAMERA — visor de cámara
        ══════════════════════════════════════════════ */}
        {step === 'camera' && (
          <div>
            <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              {/* Marco guía */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-44 border-2 border-white/30 rounded-xl">
                  {/* Esquinas verdes */}
                  {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
                    'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2']
                    .map((cls, i) => <div key={i} className={`absolute w-5 h-5 ${cls} border-emerald-400`} />)}
                </div>
              </div>
              {/* Hint */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-xs text-white/60 bg-black/40 px-3 py-1 rounded-full">
                  Enfoca la etiqueta de ingredientes
                </span>
              </div>
            </div>

            {/* canvas oculto para captura */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="p-5 flex gap-3">
              <button onClick={retry}
                className="px-5 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,253,244,0.6)' }}>
                Cancelar
              </button>
              <button onClick={capturePhoto}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: '#10b981' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                </svg>
                Capturar foto
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP: PREVIEW — confirmar antes de enviar
        ══════════════════════════════════════════════ */}
        {step === 'preview' && (
          <div>
            <div className="relative" style={{ aspectRatio: '4/3', background: '#000' }}>
              <img src={preview} alt="Vista previa" className="w-full h-full object-contain" />
            </div>

            {error && (
              <div className="mx-5 mt-4 flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.15)' }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                {error}
              </div>
            )}

            <div className="p-5 flex gap-3">
              <button onClick={retry}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,253,244,0.6)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
                </svg>
                Repetir
              </button>
              <button onClick={analyzePhoto}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: '#10b981' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3"/>
                </svg>
                Analizar con IA
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP: ANALYZING — loader mientras la IA trabaja
        ══════════════════════════════════════════════ */}
        {step === 'analyzing' && (
          <div className="p-10 flex flex-col items-center text-center gap-5">
            {/* Imagen preview pequeña con overlay */}
            {preview && (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <svg className="animate-spin w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              </div>
            )}

            <div>
              <p className="font-black text-white text-base mb-1">Analizando la imagen…</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,253,244,0.45)' }}>
                La IA está identificando el producto y verificando sus ingredientes.
                Esto puede tardar unos segundos.
              </p>
            </div>

            {/* Pasos visuales */}
            <div className="w-full space-y-2.5">
              {[
                { label: 'Procesando imagen', done: true },
                { label: 'Identificando producto', done: false, active: true },
                { label: 'Verificando ingredientes', done: false },
              ].map(({ label, done, active }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    done ? 'bg-emerald-500' : active ? 'bg-emerald-500/20' : 'bg-white/10'
                  }`}>
                    {done
                      ? <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                      : active
                      ? <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                      : null
                    }
                  </div>
                  <span className={`text-sm ${done || active ? 'text-white font-medium' : 'text-white/30'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}