import React, { useState, useEffect } from 'react'
import './App.css'

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
}

interface ApiInfo {
  message: string;
  version: string;
  status: string;
}

function App() {
  const [backendHealth, setBackendHealth] = useState<HealthStatus | null>(null)
  const [backendApi, setBackendApi] = useState<ApiInfo | null>(null)
  const [aiServiceHealth, setAiServiceHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkServices = async () => {
      try {
        // Backend health check
        const backendHealthRes = await fetch('http://localhost:3001/health')
        if (backendHealthRes.ok) {
          const healthData = await backendHealthRes.json()
          setBackendHealth(healthData)
        }

        // Backend API info
        const backendApiRes = await fetch('http://localhost:3001/api/v1')
        if (backendApiRes.ok) {
          const apiData = await backendApiRes.json()
          setBackendApi(apiData)
        }

        // AI Service health check
        const aiHealthRes = await fetch('http://localhost:8000/health')
        if (aiHealthRes.ok) {
          const aiHealthData = await aiHealthRes.json()
          setAiServiceHealth(aiHealthData)
        }
      } catch (error) {
        console.error('Error checking services:', error)
      } finally {
        setLoading(false)
      }
    }

    checkServices()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 myJarvis - AI Personal Assistant</h1>
        <p>Local Development Environment</p>

        <div className="services-status">
          <h2>Services Status</h2>

          {loading && <p>Checking services...</p>}

          <div className="service-card">
            <h3>Backend Service (Node.js + Express + Prisma)</h3>
            <p><strong>Port:</strong> 3001</p>
            {backendHealth ? (
              <div className="status-healthy">
                ✅ Status: {backendHealth.status}
                <br />
                Service: {backendHealth.service}
                <br />
                Last Check: {new Date(backendHealth.timestamp).toLocaleString()}
              </div>
            ) : (
              <div className="status-unhealthy">❌ Backend not responding</div>
            )}
            {backendApi && (
              <div className="api-info">
                <p>API: {backendApi.message} (v{backendApi.version})</p>
              </div>
            )}
          </div>

          <div className="service-card">
            <h3>AI Service (Python + Ollama)</h3>
            <p><strong>Port:</strong> 8000</p>
            {aiServiceHealth ? (
              <div className="status-healthy">
                ✅ Status: {aiServiceHealth.status}
                <br />
                Service: {aiServiceHealth.service}
                <br />
                Last Check: {new Date(aiServiceHealth.timestamp).toLocaleString()}
              </div>
            ) : (
              <div className="status-unhealthy">❌ AI Service not responding</div>
            )}
          </div>

          <div className="service-card">
            <h3>Frontend Service (React + Vite)</h3>
            <p><strong>Port:</strong> 3000</p>
            <div className="status-healthy">
              ✅ Status: healthy (you're viewing this!)
              <br />
              Service: myJarvis-frontend
              <br />
              Framework: React + Vite + Material-UI
            </div>
          </div>
        </div>

        <div className="development-links">
          <h2>Development Links</h2>
          <ul>
            <li><a href="http://localhost:3001/health" target="_blank">Backend Health Check</a></li>
            <li><a href="http://localhost:3001/api/v1" target="_blank">Backend API Info</a></li>
            <li><a href="http://localhost:3001/api/v1/db-test" target="_blank">Database Connection Test</a></li>
            <li><a href="http://localhost:8000/health" target="_blank">AI Service Health Check</a></li>
            <li><a href="http://localhost:11434" target="_blank">Ollama API (AI Models)</a></li>
          </ul>
        </div>
      </header>
    </div>
  )
}

export default App