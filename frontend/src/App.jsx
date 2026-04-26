import React from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <div className="app-container">
      <h1>NexusVision Engine</h1>
      <p style={{color: '#94a3b8'}}>Generative AI Object Removal</p>
      <Dashboard />
    </div>
  )
}

export default App