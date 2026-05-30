import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Check, AlertTriangle, RefreshCw, Smartphone } from 'lucide-react';

interface QrCodeScannerModalProps {
  onClose: () => void;
  onScan: (scannedText: string) => Promise<void>;
  lastResult: {
    success: boolean;
    name?: string;
    phone?: string;
    companions?: number;
    relation?: string;
    message: string;
    timestamp: Date;
  } | null;
  setLastResult: (res: any) => void;
}

export const QrCodeScannerModal: React.FC<QrCodeScannerModalProps> = ({
  onClose,
  onScan,
  lastResult,
  setLastResult
}) => {
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-viewport';

  // Request cameras list on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        setCameraPermissionGranted(true);
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera ("environment") if available
          const backCam = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('environment') ||
            device.label.toLowerCase().includes('rear')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setScannerError('រកមិនឃើញឧបករណ៍កាមេរ៉ាឡើយ (No cameras found)');
        }
        setIsInitializing(false);
      })
      .catch((err) => {
        console.error("Failed to get cameras:", err);
        setCameraPermissionGranted(false);
        setScannerError('សូមអនុញ្ញាតផ្តល់សិទ្ធិប្រើប្រាស់កាមេរ៉ាក្នុងកម្មវិធីរុករក (Permission Denied)');
        setIsInitializing(false);
      });

    return () => {
      // Clean up scanner on unmount
      stopScanner();
    };
  }, []);

  // Initialize and start scanner when selectedCameraId or showResult state permits
  useEffect(() => {
    if (!selectedCameraId || lastResult) {
      // If we have a result shown, let's pause scanner to avoid rapid double scans
      stopScanner();
      return;
    }

    startScanner(selectedCameraId);

    return () => {
      stopScanner();
    };
  }, [selectedCameraId, lastResult]);

  const startScanner = async (cameraId: string) => {
    try {
      setIsScanning(false);
      // Wait for DOM to register container
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const element = document.getElementById(containerId);
      if (!element) return;

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(containerId);
      } else {
        await stopScanner();
        html5QrCodeRef.current = new Html5Qrcode(containerId);
      }

      setIsScanning(true);
      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 12,
          qrbox: (width, height) => {
            const minSize = Math.min(width, height);
            const qrSize = Math.floor(minSize * 0.7);
            return { width: qrSize, height: qrSize };
          },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Success callback
          // Pause camera stream first to give audio and toast feedback
          stopScanner();
          await onScan(decodedText);
        },
        () => {
          // Silence verbose runtime read errors
        }
      );
    } catch (err: any) {
      console.error("Error starting QR Code scanner:", err);
      setIsScanning(false);
      setScannerError(`មិនអាចបើកកាមេរ៉ាបានទេ៖ ${err.message || err}`);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
    }
    setIsScanning(false);
  };

  const handleScanAgain = () => {
    setLastResult(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-wedding-50 rounded-xl text-wedding-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">ស្កេន QR Code ភ្ញៀវចូលរួម</h3>
              <p className="text-[10px] text-slate-400">ស្កេនកូដដើម្បីកត់ត្រាវត្តមានស្វ័យប្រវត្ត</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-600"
            id="btn-close-qr-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Selector */}
        {cameras.length > 1 && !lastResult && (
          <div className="px-4 py-2 bg-slate-100 border-b border-rose-50 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold select-none flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              ជ្រើសរើសកាមេរ៉ា៖
            </span>
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 outline-none text-[11px] cursor-pointer max-w-[200px]"
              id="select-active-camera"
            >
              {cameras.map((device, i) => (
                <option key={device.id} value={device.id}>
                  {device.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content Viewport */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col justify-center items-center">
          
          {isInitializing && (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-wedding-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-medium">កំពុងស្វែងរក និងភ្ជាប់កាមេរ៉...</p>
            </div>
          )}

          {scannerError && !cameraPermissionGranted && (
            <div className="py-12 px-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">{scannerError}</p>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  សូមបើកសិទ្ធិចូលយកកាមេរ៉ាក្នុង Browser (Site Settings) រួចដំណើរការជាថ្មី ដើម្បីប្រើប្រាស់មុខងារស្កេន QR Code។
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="py-2 px-4 bg-slate-800 text-white rounded-xl text-xs hover:bg-slate-900 transition-all font-semibold font-sans cursor-pointer"
              >
                Refresh ទំព័រ
              </button>
            </div>
          )}

          {cameraPermissionGranted && !lastResult && (
            <div className="w-full text-center space-y-4">
              
              {/* Scan box viewport */}
              <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden border-2 border-dashed border-wedding-500 shadow-inner bg-slate-900 flex items-center justify-center">
                
                {/* HTML5 QR Code Mount point */}
                <div id={containerId} className="w-full h-full object-cover"></div>

                {/* Aesthetic Scanning Overlays */}
                {isScanning && (
                  <>
                    <div className="absolute inset-0 border-[12px] border-black/20 pointer-events-none"></div>
                    
                    {/* Retro target brackets */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-wedding-500 rounded-tl-md"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-wedding-500 rounded-tr-md"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-wedding-500 rounded-bl-md"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-wedding-500 rounded-br-md"></div>
                    
                    {/* Red moving scan line */}
                    <div className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-[scan_2s_infinite_linear]"></div>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider bg-wedding-50 text-wedding-700 animate-pulse border border-wedding-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Camera scanning active
                </span>
                <p className="text-xs font-bold text-slate-700 mt-1">សូមដាក់ QR Code ភ្ញៀវក្នុងប្រអប់ស្កេន</p>
                <p className="text-[10px] text-slate-400">ប្រឡាយកូដនឹងសម្គាល់ និងកត់ត្រាវត្តមានភ្លាមៗដោយស្វ័យប្រវត្ត</p>
              </div>

            </div>
          )}

          {/* SCAN DETECTED RESULT DISPLAY */}
          {lastResult && (
            <div className="w-full p-1 animate-[fadeIn_0.25s_ease-out]">
              {lastResult.success ? (
                /* Successful Scan Checked In */
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-5 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  
                  <div className="space-y-1.5 flex flex-col items-center">
                    <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 tracking-wider">
                      កត់ត្រាវត្តមានជោគជ័យ
                    </span>
                    <h4 className="text-base font-bold text-slate-800 font-sans mt-1">{lastResult.name}</h4>
                    {lastResult.phone && (
                      <p className="text-xs font-mono text-slate-500 font-semibold">{lastResult.phone}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left bg-white p-3 rounded-xl border border-slate-100 text-[11px] text-slate-650">
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">ទំនាក់ទំនង៖</span>
                      <strong className="text-slate-700 font-bold font-sans">{lastResult.relation || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">អ្នកមកជាមួយ៖</span>
                      <strong className="text-emerald-700 font-bold">
                        {lastResult.companions && lastResult.companions > 0 ? `+${lastResult.companions} នាក់` : 'មកម្នាក់ឯង'}
                      </strong>
                    </div>
                  </div>

                  <p className="text-slate-600 text-xs font-medium leading-relaxed bg-white inline-block px-3 py-1.5 rounded-lg shadow-2xs border border-emerald-200">
                    🎉 {lastResult.message}
                  </p>
                  
                  <div className="text-[10px] text-slate-400 font-mono">
                    Check-in: {lastResult.timestamp.toLocaleTimeString('km-KH')}
                  </div>
                </div>
              ) : (
                /* Failed Scan Result / Not Found */
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center space-y-4">
                  <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <AlertTriangle className="w-6 h-6 stroke-[2]" />
                  </div>
                  
                  <div className="space-y-1 text-center">
                    <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-black bg-red-150 text-red-700 tracking-wider">
                      ពិនិត្យកូដមិនបានជោគជ័យ
                    </span>
                    {lastResult.name && <h4 className="text-sm font-bold text-slate-800 mt-1">{lastResult.name}</h4>}
                    <p className="text-xs text-red-600 font-normal leading-relaxed mt-2">{lastResult.message}</p>
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono">
                    ម៉ោង៖ {lastResult.timestamp.toLocaleTimeString('km-KH')}
                  </p>
                </div>
              )}

              {/* Action Button to scan next */}
              <div className="mt-5 text-center">
                <button
                  onClick={handleScanAgain}
                  className="w-full py-2.5 bg-wedding-600 hover:bg-wedding-700 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center space-x-1.5 animate-bounce"
                  id="btn-scan-more"
                >
                  <RefreshCw className="w-4 h-4 animate-[spin_5s_infinite_linear]" />
                  <span>បន្តស្កេនបន្ទាប់ទៀត (Scan Next)</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer info tip */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 select-none font-sans">
          គាំទ្រ QR Code standard របស់ Web Browser (SSL is recommended)
        </div>

      </div>
    </div>
  );
};
