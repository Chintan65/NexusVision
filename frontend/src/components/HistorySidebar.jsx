import React from 'react';

const HistorySidebar = ({ username, history, onSelectJob }) => {
  return (
    <div style={{ flex: 1, backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', maxHeight: '800px', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>{username}'s History</h2>
      
      {history.length === 0 ? (
          <p style={{color: '#64748b', fontSize: '0.9rem'}}>No past edits found.</p>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginTop: '15px' }}>
              {history.map((job) => (
                  <div 
                    key={job.job_id} 
                    onClick={() => onSelectJob(job)}
                    style={{ 
                        backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', 
                        cursor: 'pointer', transition: 'all 0.2s ease-in-out',
                        position: 'relative', overflow: 'hidden'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.border = '1px solid #38bdf8';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.border = 'none';
                    }}
                  >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <p style={{fontSize: '0.7rem', color: '#94a3b8', margin: 0}}>Job: {job.job_id.substring(0,8)}</p>
                          {/* FIX: Visual cue that it is clickable */}
                          <span style={{ backgroundColor: '#38bdf8', color: '#0f172a', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold'}}>
                            🔍 View Details
                          </span>
                      </div>
                      <img src={`http://localhost:8000/result/${job.job_id}`} alt="History" style={{ width: '100%', borderRadius: '4px' }} />
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default HistorySidebar;