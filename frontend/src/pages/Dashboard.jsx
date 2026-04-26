import React, { useRef, useState, useEffect } from 'react';
import HistorySidebar from '../components/HistorySidebar';
import HistoryModal from '../components/HistoryModal';

const Dashboard = () => {
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const hiddenOriginalCanvasRef = useRef(null); // FIX: Hidden canvas for the pure image!
  const fileInputRef = useRef(null);
  
  const [username, setUsername] = useState('chintan_dev');
  const [brushSize, setBrushSize] = useState(30);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [status, setStatus] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null); 

  useEffect(() => { fetchHistory(); }, [username]);

  const fetchHistory = async () => {
    if (!username) return;
    try {
      const res = await fetch(`http://localhost:8000/history/${username}`);
      const data = await res.json();
      setHistory(data.filter(job => job.status === 'COMPLETED').reverse());
    } catch (e) { console.error("History fetch failed."); }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      // Set sizes for all 3 canvases
      canvasRef.current.width = maskCanvasRef.current.width = hiddenOriginalCanvasRef.current.width = img.width;
      canvasRef.current.height = maskCanvasRef.current.height = hiddenOriginalCanvasRef.current.height = img.height;
      
      // Draw visible image for user to paint on
      canvasRef.current.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
      
      // Draw pure untouched image to hidden canvas for the backend
      hiddenOriginalCanvasRef.current.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
      
      // Fill mask canvas with black
      const maskCtx = maskCanvasRef.current.getContext('2d');
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, img.width, img.height);
      
      setImageLoaded(true);
      setResultImage(null);
    };
    img.src = URL.createObjectURL(file);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvasRef.current.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const scaledBrush = canvas.width * (brushSize / 1000); 

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath(); ctx.arc(x, y, scaledBrush, 0, Math.PI * 2); ctx.fill();

    maskCtx.fillStyle = "white";
    maskCtx.beginPath(); maskCtx.arc(x, y, scaledBrush, 0, Math.PI * 2); maskCtx.fill();
  };

  const submitToAI = async () => {
    setIsProcessing(true); setStatus('Uploading High-Res Image...');
    
    // FIX: Grab the pure image from the HIDDEN canvas, not the painted one!
    const imageBlob = await new Promise(res => hiddenOriginalCanvasRef.current.toBlob(res, 'image/png'));
    const maskBlob = await new Promise(res => maskCanvasRef.current.toBlob(res, 'image/png'));

    const formData = new FormData();
    formData.append('username', username);
    formData.append('image', imageBlob, 'image.png');
    formData.append('mask', maskBlob, 'mask.png');

    try {
      const res = await fetch('http://localhost:8000/process', { method: 'POST', body: formData });
      const data = await res.json();
      pollJobStatus(data.job_id);
    } catch (err) { setStatus('Failed.'); setIsProcessing(false); }
  };

  const pollJobStatus = (jobId) => {
    const interval = setInterval(async () => {
      setStatus('AI Generating...');
      const res = await fetch(`http://localhost:8000/status/${jobId}`);
      const data = await res.json();
      if (data.status === 'COMPLETED') {
        clearInterval(interval);
        setStatus('Complete!');
        setResultImage(`http://localhost:8000/result/${jobId}`);
        setIsProcessing(false);
        fetchHistory(); 
      } else if (data.status === 'FAILED') {
        clearInterval(interval);
        setStatus('Failed.');
        setIsProcessing(false);
      }
    }, 2000);
  };

  // FIX: The universal Blob Download function
  const forceDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '40px', width: '100%', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
      
      {/* LEFT PANEL */}
      <div className="canvas-container" style={{ flex: 2 }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{color: '#94a3b8', fontWeight: 'bold'}}>User Profile:</span>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }} />
        </div>

        <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} style={{ display: 'none' }} />
        
        {!imageLoaded && (
            <div style={{padding: '50px', border: '2px dashed #334155', borderRadius: '12px', cursor: 'pointer', textAlign: 'center'}} onClick={() => fileInputRef.current.click()}>
                <h3 style={{color: '#94a3b8'}}>Click to Upload High-Res Image</h3>
            </div>
        )}

        {!resultImage ? (
          <canvas ref={canvasRef} onMouseDown={() => setIsDrawing(true)} onMouseUp={() => setIsDrawing(false)} onMouseOut={() => setIsDrawing(false)} onMouseMove={draw} style={{ display: imageLoaded ? 'block' : 'none', width: '100%', height: 'auto', borderRadius: '8px', cursor: 'crosshair', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} />
        ) : (
          <div className="result-viewer">
            <h3 style={{color: '#38bdf8', marginBottom: '10px'}}>Final AI Output</h3>
            <img src={resultImage} alt="AI Result" style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.5)' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="upload-btn" onClick={() => {setResultImage(null); setImageLoaded(false); setStatus('');}} style={{backgroundColor: '#64748b'}}>← Back</button>
              {/* FIX: Re-added the Download button to the main view */}
              <button className="upload-btn" onClick={() => forceDownload(resultImage, `nexusvision_${Date.now()}.png`)} style={{backgroundColor: '#10b981'}}>Download HD</button>
            </div>
          </div>
        )}
        
        {/* Hidden Canvases */}
        <canvas ref={maskCanvasRef} style={{ display: 'none' }} />
        <canvas ref={hiddenOriginalCanvasRef} style={{ display: 'none' }} />
        
        {imageLoaded && !resultImage && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px' }}>
              <span style={{color: '#94a3b8'}}>Brush Size:</span>
              <input type="range" min="10" max="100" value={brushSize} onChange={(e) => setBrushSize(e.target.value)} style={{ flex: 1 }} />
            </div>
            <button className="upload-btn" onClick={submitToAI} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Erase Objects'}
            </button>
            <p style={{color: '#94a3b8', marginTop: '5px', fontSize: '14px'}}>{status}</p>
          </div>
        )}
      </div>

      <HistorySidebar username={username} history={history} onSelectJob={setSelectedJob} />
      <HistoryModal selectedJob={selectedJob} closeModal={() => setSelectedJob(null)} forceDownload={forceDownload} />

    </div>
  );
};

export default Dashboard;