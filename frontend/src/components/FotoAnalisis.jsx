import { useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function CameraIcon({ className = 'h-5 w-5' }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>;
}

function ErrorNotice({ children }) {
  return <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"><svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" /></svg>{children}</div>;
}

export default function FotoAnalisis({ ean, onResult, onClose }) {
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [step, setStep] = useState('choose');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const stopCamera = () => streamRef.current?.getTracks().forEach((track) => track.stop());

  const openCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
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
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setPreview(canvas.toDataURL('image/jpeg', 0.85));
    setStep('preview');
    stopCamera();
  }, []);

  const handleFile = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => { setPreview(loadEvent.target.result); setStep('preview'); };
    reader.readAsDataURL(file);
  }, []);

  const analyzePhoto = useCallback(async () => {
    if (!preview) return;
    setStep('analyzing');
    setError(null);
    try {
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const response = await axios.post(`${API_URL}/analizar-imagen`, { ean, imagen_base64: preview.split(',')[1] }, { headers });
      onResult(response.data);
    } catch (requestError) {
      if (requestError.response?.status === 404) setError('El servidor aún no tiene este endpoint. Pide al desarrollador que lo active.');
      else if (requestError.response?.status === 413) setError('La imagen es demasiado grande. Inténtalo con una foto más pequeña.');
      else setError('Error al analizar la imagen. Inténtalo de nuevo.');
      setStep('preview');
    }
  }, [preview, ean, token, onResult]);

  const retry = useCallback(() => { setPreview(null); setError(null); setStep('choose'); stopCamera(); }, []);
  const handleClose = useCallback(() => { stopCamera(); onClose(); }, [onClose]);
  const steps = [{ label: 'Procesando imagen', state: 'done' }, { label: 'Identificando producto', state: 'active' }, { label: 'Verificando ingredientes', state: 'pending' }];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#050f0a]/90 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }} role="dialog" aria-modal="true" aria-label="Análisis por foto">
      <div className="w-full max-w-[390px] overflow-hidden rounded-t-3xl border border-accent/20 bg-[#0d1f14] shadow-[0_24px_64px_rgba(0,0,0,0.5)] sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div><p className="text-[0.9375rem] font-bold text-white">Analizar con foto</p><p className="mt-0.5 text-[0.8125rem] text-white/40">La IA identificará el producto visualmente</p></div>
          <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/50 transition hover:bg-white/[0.13] hover:text-white" onClick={handleClose} aria-label="Cerrar análisis"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>

        {step === 'choose' && <div className="p-5">
          <div className="mb-5 rounded-2xl border border-accent/20 bg-accent/[0.07] p-4 text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-green-300"><svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div><p className="mb-1 text-sm font-semibold text-white">Fotografía la etiqueta del producto</p><p className="text-[0.8125rem] leading-relaxed text-white/40">Enfoca la etiqueta de ingredientes o la parte frontal del envase.</p></div>
          {error && <div className="mb-4"><ErrorNotice>{error}</ErrorNotice></div>}
          <div className="flex flex-col gap-2.5">
            <button className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-accent/30 hover:bg-white/[0.08]" onClick={openCamera}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white"><CameraIcon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-white">Hacer foto ahora</span><span className="mt-0.5 block text-[0.8125rem] text-white/40">Usa la cámara del dispositivo</span></span><svg className="h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></button>
            <button className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-accent/30 hover:bg-white/[0.08]" onClick={() => fileInputRef.current?.click()}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/75"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-white">Elegir de la galería</span><span className="mt-0.5 block text-[0.8125rem] text-white/40">Sube una foto existente</span></span><svg className="h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>}

        {step === 'camera' && <div><div className="relative aspect-[4/3] overflow-hidden bg-black"><video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted /><div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="relative h-44 w-64 rounded-xl border border-white/20"><i className="absolute -left-px -top-px h-5 w-5 rounded-tl-lg border-l-2 border-t-2 border-green-300" /><i className="absolute -right-px -top-px h-5 w-5 rounded-tr-lg border-r-2 border-t-2 border-green-300" /><i className="absolute -bottom-px -left-px h-5 w-5 rounded-bl-lg border-b-2 border-l-2 border-green-300" /><i className="absolute -bottom-px -right-px h-5 w-5 rounded-br-lg border-b-2 border-r-2 border-green-300" /></div></div><div className="absolute inset-x-0 bottom-3 text-center"><span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/70">Enfoca la etiqueta de ingredientes</span></div></div><canvas ref={canvasRef} className="hidden" /><div className="flex gap-2.5 border-t border-white/10 p-4"><button className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/65 transition hover:bg-white/10 hover:text-white" onClick={retry}>Cancelar</button><button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700" onClick={capturePhoto}><CameraIcon className="h-[18px] w-[18px]" />Capturar foto</button></div></div>}

        {step === 'preview' && <div><div className="relative aspect-[4/3] bg-black"><img src={preview} alt="Vista previa de la foto" className="h-full w-full object-contain" /></div>{error && <div className="px-5 pt-4"><ErrorNotice>{error}</ErrorNotice></div>}<div className="flex gap-2.5 border-t border-white/10 p-4"><button className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/65 transition hover:bg-white/10 hover:text-white" onClick={retry}>Repetir</button><button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700" onClick={analyzePhoto}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" /></svg>Analizar con IA</button></div></div>}

        {step === 'analyzing' && <div className="flex flex-col items-center gap-5 px-6 py-10 text-center">{preview && <div className="relative h-[88px] w-[88px] overflow-hidden rounded-2xl"><img src={preview} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 flex items-center justify-center bg-black/45"><div className="h-7 w-7 animate-spin rounded-full border-[2.5px] border-green-300/25 border-t-green-300" /></div></div>}<div><p className="mb-1.5 text-[0.9375rem] font-bold text-white">Analizando la imagen…</p><p className="mx-auto max-w-[26ch] text-sm leading-relaxed text-white/45">La IA está identificando el producto y verificando sus ingredientes.</p></div><div className="flex w-full flex-col gap-2">{steps.map(({ label, state }) => <div key={label} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-2.5 text-left"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${state === 'done' ? 'bg-accent' : state === 'active' ? 'bg-accent/20' : 'bg-white/10'}`}>{state === 'done' && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}{state === 'active' && <span className="h-2 w-2 animate-pulse rounded-full bg-green-300" />}</span><span className={`text-sm ${state === 'pending' ? 'text-white/30' : 'font-medium text-white'}`}>{label}</span></div>)}</div></div>}
      </div>
    </div>
  );
}
