import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Aperture, RefreshCw, Share2, Info, Loader2 } from 'lucide-react';
import { scanForInvisibleEntity } from '../services/gemini';
import { InvisibleEntity, ScanResult } from '../types';

interface ARViewProps {
  onBack: () => void;
}

export const ARView: React.FC<ARViewProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        // Attempt to get back camera on mobile, or default
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("No se puede acceder a la cámara. Verifica los permisos.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    setResult(null);

    // Capture frame
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Optional: Add some visual noise or filter to the captured image to make it look "scanned"
      // ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      // ctx.fillRect(0,0,canvas.width, canvas.height);
      
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      try {
        const entity = await scanForInvisibleEntity(imageBase64);
        setResult({
            image: imageBase64,
            entity,
            timestamp: Date.now()
        });
        setShowDetails(true);
      } catch (err) {
        setError("Error al analizar el espectro invisible.");
      } finally {
        setIsScanning(false);
      }
    }
  }, []);

  const handleReset = () => {
    setResult(null);
    setShowDetails(false);
    setError(null);
  };

  // Rarity Color Helper
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Común': return 'text-gray-400 border-gray-400';
      case 'Raro': return 'text-cyan-400 border-cyan-400';
      case 'Legendario': return 'text-amber-400 border-amber-400';
      case 'Artefacto': return 'text-purple-400 border-purple-400';
      default: return 'text-white border-white';
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Feed */}
      <div className="absolute inset-0 z-0">
        {!error ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-all duration-1000 ${result ? 'grayscale brightness-50 blur-sm' : ''}`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white/50 p-6 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Overlay UI - Scanner HUD */}
      {!result && !error && (
        <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Grid Lines */}
            <div className="w-full h-full border-[20px] border-white/5 box-border relative">
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/50" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/50" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/50" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/50" />
                
                {/* Center Reticle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/20 rounded-full flex items-center justify-center">
                    <div className="w-40 h-40 border border-white/10 rounded-full animate-pulse" />
                    <div className="w-1 h-4 bg-white/50 absolute top-0" />
                    <div className="w-1 h-4 bg-white/50 absolute bottom-0" />
                    <div className="w-4 h-1 bg-white/50 absolute left-0" />
                    <div className="w-4 h-1 bg-white/50 absolute right-0" />
                </div>
            </div>

            {/* Scanning Scanline */}
            {isScanning && (
                <div className="absolute left-0 right-0 h-1 bg-cyan-500/80 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-scan z-20" />
            )}
        </div>
      )}

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
        <button 
            onClick={onBack}
            className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/10 transition-colors"
        >
            <ArrowLeft size={24} />
        </button>
        <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-xs font-mono text-cyan-400 border border-cyan-900/30">
            {isScanning ? 'ANALIZANDO ESPECTRO...' : 'LISTO PARA ESCANEAR'}
        </div>
      </div>

      {/* Result Card Overlay */}
      {result && result.entity && (
          <div className={`absolute inset-0 z-20 flex flex-col justify-end transition-opacity duration-500 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
              
              {/* Entity Visual Placeholder (Center of screen simulated AR object) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                      <div className={`w-64 h-64 rounded-full border-2 ${getRarityColor(result.entity.rarity).split(' ')[1]} opacity-50 blur-xl animate-pulse-slow`}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl animate-bounce">✨</span>
                      </div>
                  </div>
              </div>

              {/* Bottom Sheet */}
              <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-6 md:p-8 animate-[slide-up_0.5s_ease-out] max-h-[70vh] overflow-y-auto">
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                  
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <span className={`inline-block px-2 py-1 mb-2 text-[10px] uppercase tracking-widest border rounded ${getRarityColor(result.entity.rarity)}`}>
                              {result.entity.rarity}
                          </span>
                          <h2 className="text-3xl font-display font-bold text-white mb-1">{result.entity.title}</h2>
                          <p className="text-white/50 text-sm font-mono">{result.entity.visualStyle}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-xs text-white/40">EDAD EST.</p>
                          <p className="text-sm text-white/80 font-mono">{result.entity.estimatedAge}</p>
                      </div>
                  </div>

                  <p className="text-lg text-white/90 leading-relaxed font-light mb-6">
                      {result.entity.description}
                  </p>

                  <div className="bg-white/5 rounded-xl p-4 border-l-2 border-purple-500 mb-8">
                      <div className="flex gap-2 items-center mb-2 text-purple-300">
                          <Info size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">Significado</span>
                      </div>
                      <p className="text-sm text-white/70 italic">"{result.entity.meaning}"</p>
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={handleReset}
                        className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                          <RefreshCw size={20} /> Escanear de nuevo
                      </button>
                      <button className="p-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">
                          <Share2 size={20} />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Main Action Button (Only visible when not showing result) */}
      {!result && !isScanning && (
        <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="group relative"
          >
             <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/40 transition-all duration-500" />
             <div className="relative w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border border-white/50 flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <Aperture className="text-black" size={32} />
                </div>
             </div>
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {isScanning && (
          <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center z-20 gap-4">
              <Loader2 className="animate-spin text-white w-10 h-10" />
              <p className="text-white/70 text-sm font-mono tracking-widest animate-pulse">REVELANDO...</p>
          </div>
      )}
    </div>
  );
};