"use client";

import { useState, useEffect } from "react";

interface TowRequest {
  id: string;
  status: string;
  driverId?: {
    id: string;
  };
}

interface Driver {
  id: string;
  name: string;
  isOnline: boolean;
}

export default function DriverDashboard() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [stats, setStats] = useState({
    available: 0,
    current: 0,
    completed: 0,
  });
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchDriver = async () => {
    try {
      const token = localStorage.getItem("driverToken");
      const res = await fetch(
        "https://toweasy-server.onrender.com/api/drivers/me",
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.ok) {
        const data = await res.json();
        setDriver(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async (currentDriverId: string) => {
    try {
      const res = await fetch(
        "https://toweasy-server.onrender.com/api/requests"
      );
      const data = await res.json();
      setStats({
        available: data.filter((r: TowRequest) => r.status === "pending")
          .length,
        current: data.filter(
          (r: TowRequest) =>
            (r.status === "accepted" ||
              r.status === "waiting_confirmation" ||
              r.status === "disputed") &&
            r.driverId?.id === currentDriverId
        ).length,
        completed: data.filter(
          (r: TowRequest) =>
            r.status === "completed" && r.driverId?.id === currentDriverId
        ).length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("driverToken");
        const res = await fetch(
          "https://toweasy-server.onrender.com/api/drivers/me",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (res.ok) {
          const d = await res.json();
          setDriver(d);
          fetchStats(d.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
    const interval = setInterval(() => {
      if (driver) fetchStats(driver.id);
    }, 30000);
    return () => clearInterval(interval);
  }, [driver?.id]);

  const toggleAvailability = async () => {
    if (!driver) return;
    setToggleLoading(true);
    try {
      const token = localStorage.getItem("driverToken");
      let currentLocation = undefined;

      // Only attempt to detect location if the driver is going online
      if (!driver.isOnline) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 4000,
                maximumAge: 0,
              });
            }
          );
          currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (geoErr) {
          console.warn(
            "Geolocation detection failed or timed out. Falling back to default coordinate (New York center) for testing:",
            geoErr
          );
          // Set a default mock location for demo and test environments
          currentLocation = {
            latitude: 40.7128,
            longitude: -74.006,
          };
        }
      }

      console.log(
        `[ToggleAvailability] Triggering status update. Going from isOnline=${
          driver.isOnline
        } to isOnline=${!driver.isOnline}. currentLocation:`,
        currentLocation
      );

      await fetch(
        `https://toweasy-server.onrender.com/api/drivers/${driver.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            isOnline: !driver.isOnline,
            currentLocation,
          }),
        }
      );
      console.log(
        `[ToggleAvailability] Status update request completed successfully.`
      );
      // Explicitly refetch driver status from server
      await fetchDriver();
    } catch (err) {
      console.error(
        "[ToggleAvailability] Error in status toggle availability:",
        err
      );
    } finally {
      setToggleLoading(false);
    }
  };

  const isEngaged = stats.current > 0;

  if (!driver) return <div className="container">Loading Dashboard...</div>;

  return (
    <main className="container">
      <div className="status-panel">
        <div className="status-indicator">
          <span
            className={`dot ${
              isEngaged
                ? "dot-engaged"
                : driver.isOnline
                ? "dot-online"
                : "dot-offline"
            }`}
          ></span>
          <span>
            {isEngaged ? "ENGAGED" : driver.isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
        {!isEngaged && (
          <button
            onClick={toggleAvailability}
            className={`toggle-btn ${
              driver.isOnline ? "btn-offline" : "btn-online"
            }`}
            disabled={toggleLoading}
          >
            {toggleLoading
              ? "Updating..."
              : driver.isOnline
              ? "Go Offline"
              : "Go Online"}
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        <div
          className="job-card"
          style={{
            borderLeftColor: "var(--warning-yellow)",
            textAlign: "center",
          }}
        >
          <h4>Available</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
            {stats.available}
          </p>
          <a
            href="/active"
            style={{
              fontSize: "0.8rem",
              color: "blue",
              textDecoration: "none",
            }}
          >
            View Jobs
          </a>
        </div>
        <div
          className="job-card"
          style={{
            borderLeftColor: "var(--driver-primary)",
            textAlign: "center",
          }}
        >
          <h4>My Active Jobs</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
            {stats.current}
          </p>
          <a
            href="/current"
            style={{
              fontSize: "0.8rem",
              color: "blue",
              textDecoration: "none",
            }}
          >
            Go to Job
          </a>
        </div>
        <div
          className="job-card"
          style={{ borderLeftColor: "#333", textAlign: "center" }}
        >
          <h4>Completed</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
            {stats.completed}
          </p>
          <a
            href="/history"
            style={{
              fontSize: "0.8rem",
              color: "blue",
              textDecoration: "none",
            }}
          >
            History
          </a>
        </div>
      </div>

      <div
        className="card"
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          marginTop: "30px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <h3>Welcome back, {driver.name}!</h3>
        <p style={{ marginTop: "10px", color: "#666" }}>
          {driver.isOnline
            ? "You are currently online and visible to customers. Keep an eye on the 'Available Jobs' tab for new requests."
            : "You are currently offline. You won't receive any new job notifications until you go online."}
        </p>
      </div>
    </main>
  );
}
