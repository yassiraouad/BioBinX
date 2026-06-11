import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, X, Loader2 } from 'lucide-react';

export default function QRCodeGenerator({ isOpen, onClose, binId }) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloading(true);
    try {
      const svg = document.getElementById('bin-qr-code');
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width * 4;
        canvas.height = img.height * 4;
        ctx.scale(4, 4);
        ctx.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `biobin-qr-${binId}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        setDownloading(false);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Error downloading QR:', err);
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>BioBin QR - ${binId}</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
            .container { text-align: center; }
            .qr { margin: 20px; }
            .bin-id { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="qr">${document.getElementById('bin-qr-code')?.outerHTML || ''}</div>
            <div class="bin-id">${binId}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bio-card p-8 w-full max-w-md text-center animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={20} />
        </button>

        <h2 className="font-display font-700 text-white text-xl mb-6">QR-kode for bøtte</h2>

        <div className="bg-white p-4 rounded-xl inline-block mb-6">
          <QRCodeSVG
            id="bin-qr-code"
            value={binId}
            size={200}
            level="H"
            includeMargin
          />
        </div>

        <p className="text-slate-400 font-mono text-lg mb-6">{binId}</p>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {downloading ? <Loader2 size={18} className="animate-spin" /> : <><Download size={18} /> Last ned PNG</>}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white hover:bg-white/5 flex items-center justify-center gap-2"
          >
            <Printer size={18} /> Skriv ut
          </button>
        </div>
      </div>
    </div>
  );
}