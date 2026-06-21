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

export default function ActiveJobs() {
  const [requests, setRequests] = useState<TowRequest[]>([]);
  const [hasActiveJob, setHasActiveJob] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('driverToken');
      const res = await fetch('http://localhost:5000/api/drivers/me', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const d = await res.json();
        setIsOnline(d.isOnline);
        setDriverId(d.id);
        return d.id;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const fetchRequests = async (currentDriverId: string | null) => {
    try {
      const res = await fetch('http://localhost:5000/api/requests');
      const data = await res.json();
      setRequests(data.filter((r: TowRequest) => r.status === 'pending'));
      if (currentDriverId) {
        setHasActiveJob(data.some((r: TowRequest) => (r.status === 'accepted' || r.status === 'waiting_confirmation') && r.driverId?.id === currentDriverId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const dId = await fetchStatus();
      await fetchRequests(dId);
    };
    init();
    const interval = setInterval(() => fetchRequests(driverId), 30000);
    return () => clearInterval(interval);
  }, [driverId]);

  const acceptJob = async (requestId: string) => {
    if (!driverId) return;
    try {
      await fetch(`http://localhost:5000/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted', driverId }),
      });
      fetchRequests(driverId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="container">
      <h3>Available Jobs</h3>
      {!isOnline ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#eee', borderRadius: '12px', color: '#888', marginTop: '20px' }}>
          <p>You are currently offline. Go to Dashboard to go online and see jobs.</p>
        </div>
      ) : (
        <div className="job-list" style={{ marginTop: '20px' }}>
          {loading ? (
            <div className="loading-spinner"></div>
          ) : requests.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              No pending towing requests at the moment.
            </p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="job-card">
                <div className="job-header">
                  <div>
                    <strong>{req.vehicleType} Recovery - {req.userName}</strong>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>
                      {new Date(req.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => acceptJob(req.id)} 
                    className="accept-btn"
                    disabled={hasActiveJob}
                    style={hasActiveJob ? { backgroundColor: '#666', cursor: 'not-allowed', opacity: 0.7 } : {}}
                  >
                    {hasActiveJob ? 'FINISH CURRENT JOB' : 'ACCEPT JOB'}
                  </button>
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  📍 Location: {req.location.latitude.toFixed(4)}, {req.location.longitude.toFixed(4)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
