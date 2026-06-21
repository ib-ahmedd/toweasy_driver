'use client';

import { useState, useEffect } from 'react';

interface TowRequest {
  id: string;
  vehicleType: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'accepted' | 'driver_enroute' | 'with_customer' | 'towing_vehicle' | 'at_destination' | 'completed' | 'cancelled' | 'waiting_confirmation' | 'disputed';
  driverId?: { id: string };
  createdAt: string;
}

export default function JobHistory() {
  const [history, setHistory] = useState<TowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
  const toggleJob = (id: string) => setExpandedJobs(p => ({ ...p, [id]: !p[id] }));

  const fetchHistory = async (dId: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/requests');
      const data = await res.json();
      setHistory(data.filter((r: TowRequest) => (r.status === 'completed' || r.status === 'cancelled') && r.driverId?.id === dId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('driverToken');
        const res = await fetch('http://localhost:5000/api/drivers/me', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const d = await res.json();
          fetchHistory(d.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  return (
    <main className="container">
      <h3>Job History</h3>
      <div style={{ marginTop: '20px' }}>
        {loading ? (
          <div className="loading-spinner"></div>
        ) : history.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No jobs found in your history.
          </p>
        ) : (
          <div className="responsive-list">
            {history.map((job) => {
              const isExpanded = !!expandedJobs[job.id];
              const isCompleted = job.status === 'completed';
              return (
                <div key={job.id} className={`list-item ${isExpanded ? 'expanded' : ''}`}
                  style={{ borderLeft: `4px solid ${isCompleted ? 'var(--driver-primary)' : '#dc3545'}` }}>
                  <div className="list-item-summary" onClick={() => toggleJob(job.id)}>
                    <div className="list-item-info">
                      <div className="info-col">
                        <span className="info-label">Customer</span>
                        <span className="info-value">{job.userName}</span>
                      </div>
                      <div className="info-col">
                        <span className="info-label">Vehicle</span>
                        <span className="info-value">{job.vehicleType}</span>
                      </div>
                      <div className="info-col">
                        <span className="info-label">Date</span>
                        <span className="info-value">{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="info-col">
                        <span className="info-label">Outcome</span>
                        <span className="info-value" style={{
                          color: isCompleted ? 'var(--driver-primary)' : '#dc3545',
                          fontWeight: 'bold',
                          fontSize: '0.8rem'
                        }}>
                          {job.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="list-item-chevron">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                  <div className="list-item-details">
                    <div className="details-grid">
                      <div className="details-block">
                        <span className="details-label">Job ID</span>
                        <span className="details-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{job.id}</span>
                      </div>
                      <div className="details-block">
                        <span className="details-label">Customer Phone</span>
                        <span className="details-value">📞 {job.userPhone}</span>
                      </div>
                      <div className="details-block">
                        <span className="details-label">Customer Email</span>
                        <span className="details-value">📧 {job.userEmail}</span>
                      </div>
                      <div className="details-block">
                        <span className="details-label">GPS Coordinates</span>
                        <span className="details-value">
                          📍 {job.location.latitude.toFixed(5)}, {job.location.longitude.toFixed(5)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
