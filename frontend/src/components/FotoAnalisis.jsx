import { useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const fotoStyles = `
  .fa-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(5,15,10,0.92);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  .fa-card {
    position: relative;
    width: 100%;
    max-width: 360px;
    border-radius: 1.25rem;
    overflow: hidden;
    background: #0d1f14;
    border: 1px solid rgba(22,163,74,0.18);
    box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(22,163,74,0.08);
  }

  .fa-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.125rem 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .fa-close-btn {
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
    flex-shrink: 0;
    transition: background 180ms ease, color 180ms ease;
  }
  .fa-close-btn:hover {
    background: rgba(255,255,255,0.13);
    color: rgba(255,255,255,0.85);
  }

  /* Botones de acción */
  .fa-btn-primary {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 700;
    color: #fff;
    background: #16a34a;
    border: none;
    border-radius: 0.625rem;
    cursor: pointer;
    transition: background 180ms ease, transform 180ms ease, box-shadow 180ms ease;
    box-shadow: 0 1px 3px rgba(13,31,20,0.18);
  }
  .fa-btn-primary:hover {
    background: #15803d;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(22,163,74,0.3);
  }
  .fa-btn-primary:active { transform: translateY(0); }

  .fa-btn-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.75rem 1rem;
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.09);
    border-radius: 0.625rem;
    cursor: pointer;
    transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
  }
  .fa-btn-secondary:hover {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.85);
    border-color: rgba(255,255,255,0.18);
  }

  /* Choose step */
  .fa-info-box {
    border-radius: 0.875rem;
    padding: 1.125rem;
    margin-bottom: 1.25rem;
    text-align: center;
    background: rgba(22,163,74,0.07);
    border: 1px solid rgba(22,163,74,0.14);
  }
  .fa-info-icon {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 0.75rem;
    background: rgba(22,163,74,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.75rem;
  }

  .fa-option-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.125rem;
    border-radius: 0.875rem;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    cursor: pointer;
    transition: background 180ms ease, border-color 180ms ease;
    text-align: left;
  }
  .fa-option-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(22,163,74,0.25);
  }
  .fa-option-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Error inline */
  .fa-error {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.625rem;
    font-family: var(--font-body);
    font-size: 0.875rem;
    margin-bottom: 1rem;
    background: rgba(220,38,38,0.08);
    color: #f87171;
    border: 1px solid rgba(220,38,38,0.15);
  }

  /* Camera step */
  .fa-viewport {
    position: relative;
    background: #000;
    aspect-ratio: 4 / 3;
    overflow: hidden;
  }
  .fa-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .fa-guide-frame {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .fa-guide-box {
    position: relative;
    width: 16rem;
    height: 11rem;
    border: 1.5px solid rgba(255,255,255,0.2);
    border-radius: 0.75rem;
  }
  .fa-guide-corner {
    position: absolute;
    width: 1.25rem;
    height: 1.25rem;
    border-color: #4ade80;
    border-style: solid;
    border-width: 0;
  }
  .fa-gc-tl { top: -1px; left: -1px;  border-top-width: 2px; border-left-width: 2px;  border-radius: 0.5rem 0 0 0; }
  .fa-gc-tr { top: -1px; right: -1px; border-top-width: 2px; border-right-width: 2px; border-radius: 0 0.5rem 0 0; }
  .fa-gc-bl { bottom: -1px; left: -1px;  border-bottom-width: 2px; border-left-width: 2px;  border-radius: 0 0 0 0.5rem; }
  .fa-gc-br { bottom: -1px; right: -1px; border-bottom-width: 2px; border-right-width: 2px; border-radius: 0 0 0.5rem 0; }
  .fa-hint {
    position: absolute;
    bottom: 0.875rem;
    left: 0;
    right: 0;
    text-align: center;
  }
  .fa-hint-pill {
    display: inline-block;
    font-family: var(--font-body);
    font-size: 0.75rem;
    color: rgba(255,255,255,0.65);
    background: rgba(0,0,0,0.45);
    padding: 0.25rem 0.875rem;
    border-radius: 9999px;
  }

  /* Preview step */
  .fa-preview-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  /* Analyzing step */
  .fa-analyzing-wrap {
    padding: 2.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
  }
  .fa-thumb {
    position: relative;
    width: 5.5rem;
    height: 5.5rem;
    border-radius: 1rem;
    overflow: hidden;
    flex-shrink: 0;
  }
  .fa-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .fa-thumb-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.42);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fa-spinner {
    width: 1.625rem;
    height: 1.625rem;
    border: 2.5px solid rgba(74,222,128,0.25);
    border-top-color: #4ade80;
    border-radius: 50%;
    animation: fa-spin 0.75s linear infinite;
  }
  @keyframes fa-spin { to { transform: rotate(360deg); } }

  .fa-step-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .fa-step-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    border-radius: 0.625rem;
    background: rgba(255,255,255,0.04);
  }
  .fa-step-dot {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .fa-step-dot-done    { background: #16a34a; }
  .fa-step-dot-active  { background: rgba(22,163,74,0.2); }
  .fa-step-dot-pending { background: rgba(255,255,255,0.08); }
  .fa-pulse {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #4ade80;
    animation: fa-pulse 1.2s ease-in-out infinite;
  }
  @keyframes fa-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.75); }
  }

  /* Footer actions */
  .fa-footer {
    display: flex;
    gap: 0.625rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
`;

export default function FotoAnalisis({ ean, onResult, onClose }) {
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);

  const [step, setStep]       = useState('choose');
  const [preview, setPreview] = useState(null);
  const [error, setError]     = useState(null);

  const openCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setStep('camera');
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

  const capturePhoto = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setPreview(canvas.toDataURL('image/jpeg', 0.85));
    setStep('preview');
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); setStep('preview'); };
    reader.readAsDataURL(file);
  }, []);

  const analyzePhoto = useCallback(async () => {
    if (!preview) return;
    setStep('analyzing');
    setError(null);
    try {
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

  const retry = useCallback(() => {
    setPreview(null);
    setError(null);
    setStep('choose');
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const handleClose = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
  }, [onClose]);

  const STEPS = [
    { label: 'Procesando imagen',      done: true,  active: false },
    { label: 'Identificando producto', done: false, active: true  },
    { label: 'Verificando ingredientes', done: false, active: false },
  ];

  return (
    <>
      <style>{fotoStyles}</style>
      <div
        className="fa-overlay"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        role="dialog"
        aria-modal="true"
        aria-label="Análisis por foto"
      >
        <div className="fa-card">

          {/* ── Header ── */}
          <div className="fa-header">
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9375rem', color: '#fff' }}>
                Analizar con foto
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', marginTop: '0.125rem', color: 'rgba(255,255,255,0.38)' }}>
                La IA identificará el producto visualmente
              </p>
            </div>
            <button className="fa-close-btn" onClick={handleClose} aria-label="Cerrar análisis">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ═ STEP: CHOOSE ═ */}
          {step === 'choose' && (
            <div style={{ padding: '1.25rem' }}>
              <div className="fa-info-box">
                <div className="fa-info-icon">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9375rem', color: '#fff', marginBottom: '0.375rem' }}>
                  Fotografía la etiqueta del producto
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.4)' }}>
                  Enfoca la etiqueta de ingredientes o la parte frontal del envase.
                </p>
              </div>

              {error && (
                <div className="fa-error">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, marginTop: '0.125rem' }} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <button className="fa-option-btn" onClick={openCamera}>
                  <div className="fa-option-icon" style={{ background: '#16a34a' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9375rem', color: '#fff' }}>Hacer foto ahora</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.38)', marginTop: '0.125rem' }}>Usa la cámara del dispositivo</p>
                  </div>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.28)" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                <button className="fa-option-btn" onClick={() => fileInputRef.current?.click()}>
                  <div className="fa-option-icon" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.75)" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9375rem', color: '#fff' }}>Elegir de la galería</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.38)', marginTop: '0.125rem' }}>Sube una foto existente</p>
                  </div>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.28)" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </div>
          )}

          {/* ═ STEP: CAMERA ═ */}
          {step === 'camera' && (
            <div>
              <div className="fa-viewport">
                <video ref={videoRef} className="fa-video" autoPlay playsInline muted />
                <div className="fa-guide-frame">
                  <div className="fa-guide-box">
                    <div className="fa-guide-corner fa-gc-tl" />
                    <div className="fa-guide-corner fa-gc-tr" />
                    <div className="fa-guide-corner fa-gc-bl" />
                    <div className="fa-guide-corner fa-gc-br" />
                  </div>
                </div>
                <div className="fa-hint">
                  <span className="fa-hint-pill">Enfoca la etiqueta de ingredientes</span>
                </div>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="fa-footer">
                <button className="fa-btn-secondary" onClick={retry}>Cancelar</button>
                <button className="fa-btn-primary" onClick={capturePhoto}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  Capturar foto
                </button>
              </div>
            </div>
          )}

          {/* ═ STEP: PREVIEW ═ */}
          {step === 'preview' && (
            <div>
              <div style={{ position: 'relative', aspectRatio: '4/3', background: '#000' }}>
                <img src={preview} alt="Vista previa de la foto" className="fa-preview-img" />
              </div>
              {error && (
                <div style={{ padding: '1rem 1.25rem 0' }}>
                  <div className="fa-error">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, marginTop: '0.125rem' }} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}
              <div className="fa-footer">
                <button className="fa-btn-secondary" onClick={retry}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Repetir
                </button>
                <button className="fa-btn-primary" onClick={analyzePhoto}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
                  </svg>
                  Analizar con IA
                </button>
              </div>
            </div>
          )}

          {/* ═ STEP: ANALYZING ═ */}
          {step === 'analyzing' && (
            <div className="fa-analyzing-wrap">
              {preview && (
                <div className="fa-thumb">
                  <img src={preview} alt="" />
                  <div className="fa-thumb-overlay">
                    <div className="fa-spinner" />
                  </div>
                </div>
              )}
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9375rem', color: '#fff', marginBottom: '0.375rem' }}>
                  Analizando la imagen…
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.42)', maxWidth: '26ch', margin: '0 auto' }}>
                  La IA está identificando el producto y verificando sus ingredientes.
                </p>
              </div>
              <div className="fa-step-list">
                {STEPS.map(({ label, done, active }) => (
                  <div key={label} className="fa-step-item">
                    <div className={`fa-step-dot ${done ? 'fa-step-dot-done' : active ? 'fa-step-dot-active' : 'fa-step-dot-pending'}`}>
                      {done && (
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                      {active && <div className="fa-pulse" />}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: done || active ? 500 : 400, color: done || active ? '#fff' : 'rgba(255,255,255,0.28)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
