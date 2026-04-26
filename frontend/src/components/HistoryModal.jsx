import React from 'react';

const HistoryModal = ({ selectedJob, closeModal, forceDownload }) => {
  if (!selectedJob) return null;

  const originalUrl = `http://localhost:8000/original/${selectedJob.job_id}`;
  const maskUrl = `http://localhost:8000/mask/${selectedJob.job_id}`;
  const resultUrl = `http://localhost:8000/result/${selectedJob.job_id}`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
      backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', 
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '1200px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>Job Analysis: {selectedJob.job_id.substring(0,8)}</h2>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h4 style={{ color: '#94a3b8', marginBottom: '10px' }}>1. Original Image</h4>
            <img src={originalUrl} alt="Original" style={{ width: '100%', borderRadius: '8px', border: '1px solid #334155' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h4 style={{ color: '#94a3b8', marginBottom: '10px' }}>2. AI Mask</h4>
            <img src={maskUrl} alt="Mask" style={{ width: '100%', borderRadius: '8px', border: '1px solid #334155' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h4 style={{ color: '#38bdf8', marginBottom: '10px' }}>3. Final Generation</h4>
            <img src={resultUrl} alt="Result" style={{ width: '100%', borderRadius: '8px', border: '1px solid #38bdf8' }} />
          </div>
        </div>
        
        {/* FIX: Real buttons that trigger Blob downloads */}
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button 
                onClick={() => forceDownload(originalUrl, `original_${selectedJob.job_id}.png`)}
                style={{backgroundColor: '#64748b', padding: '12px 24px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>
                Download Original
            </button>
            <button 
                onClick={() => forceDownload(resultUrl, `result_${selectedJob.job_id}.png`)}
                style={{backgroundColor: '#10b981', padding: '12px 24px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>
                Download Final Result
            </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;