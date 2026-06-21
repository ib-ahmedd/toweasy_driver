"use client";

import { useState, useEffect } from "react";

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
  status:
    | "pending"
    | "accepted"
    | "driver_enroute"
    | "with_customer"
    | "towing_vehicle"
    | "at_destination"
    | "completed"
    | "cancelled"
    | "waiting_confirmation"
    | "disputed";
  driverId?: { id: string };
  createdAt: string;
}

export default function CurrentJob() {
  const [currentJobs, setCurrentJobs] = useState<TowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);

  const fetchJobs = async (dId: string | null) => {
    if (!dId) return;
    try {
      const res = await fetch(
        "https://toweasy-server.onrender.com/api/requests"
      );
      const data = await res.json();

      const activeStatuses = [
        "accepted",
        "driver_enroute",
        "with_customer",
        "towing_vehicle",
        "at_destination",
        "waiting_confirmation",
        "disputed",
      ];

      setCurrentJobs(
        data.filter(
          (r: TowRequest) =>
            activeStatuses.includes(r.status) && r.driverId?.id === dId
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
          setDriverId(d.id);
          fetchJobs(d.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
    const interval = setInterval(() => fetchJobs(driverId), 10000);
    return () => clearInterval(interval);
  }, [driverId]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`https://toweasy-server.onrender.com/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchJobs(driverId);
    } catch (err) {
      console.error(err);
    }
  };

  const getActionButton = (job: TowRequest) => {
    switch (job.status) {
      case "accepted":
        return (
          <button
            onClick={() => updateStatus(job.id, "driver_enroute")}
            className="accept-btn"
            style={{ backgroundColor: "#1e40af" }}
          >
            START JOURNEY
          </button>
        );
      case "driver_enroute":
        return (
          <button
            onClick={() => updateStatus(job.id, "with_customer")}
            className="accept-btn"
            style={{ backgroundColor: "#6b21a8" }}
          >
            ARRIVED AT CUSTOMER
          </button>
        );
      case "with_customer":
        return (
          <button
            onClick={() => updateStatus(job.id, "towing_vehicle")}
            className="accept-btn"
            style={{ backgroundColor: "#9a3412" }}
          >
            VEHICLE LOADED
          </button>
        );
      case "towing_vehicle":
        return (
          <button
            onClick={() => updateStatus(job.id, "at_destination")}
            className="accept-btn"
            style={{ backgroundColor: "#166534" }}
          >
            ARRIVED AT DESTINATION
          </button>
        );
      case "at_destination":
        return (
          <button
            onClick={() => updateStatus(job.id, "waiting_confirmation")}
            className="accept-btn"
            style={{ backgroundColor: "var(--driver-primary)" }}
          >
            FINISH JOB
          </button>
        );
      case "waiting_confirmation":
        return (
          <button
            className="accept-btn"
            disabled
            style={{ backgroundColor: "#666", cursor: "not-allowed" }}
          >
            WAITING FOR CONFIRMATION
          </button>
        );
      case "disputed":
        return (
          <button
            className="accept-btn"
            disabled
            style={{ backgroundColor: "#be123c", cursor: "not-allowed" }}
          >
            DISPUTED
          </button>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "accepted":
        return "Job accepted. Start your journey when ready.";
      case "driver_enroute":
        return "You are currently en route to the customer.";
      case "with_customer":
        return "You have arrived. Please prepare the vehicle for towing.";
      case "towing_vehicle":
        return "Vehicle is loaded. Head to the destination.";
      case "at_destination":
        return "You have reached the destination. Complete the drop-off.";
      case "waiting_confirmation":
        return "Job finished. Waiting for customer to confirm.";
      case "disputed":
        return "Customer has disputed this completion. Please wait for admin resolution.";
      default:
        return "";
    }
  };

  return (
    <main className="container">
      <h3>Active Accepted Jobs</h3>
      <div style={{ marginTop: "20px" }}>
        {loading ? (
          <div className="loading-spinner"></div>
        ) : currentJobs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              background: "#fff",
              borderRadius: "12px",
              border: "1px dashed #ccc",
            }}
          >
            <p>You haven't accepted any jobs yet.</p>
            <a
              href="/active"
              style={{
                color: "var(--driver-primary)",
                fontWeight: "bold",
                display: "block",
                marginTop: "10px",
              }}
            >
              Find a job
            </a>
          </div>
        ) : (
          currentJobs.map((job) => (
            <div
              key={job.id}
              className="job-card"
              style={{ borderLeftColor: "var(--driver-primary)" }}
            >
              <div className="job-header">
                <div>
                  <strong>
                    {job.vehicleType} Recovery - {job.userName}
                  </strong>
                  <p style={{ fontSize: "0.85rem", color: "#666" }}>
                    ID: {job.id}
                  </p>
                </div>
                {getActionButton(job)}
              </div>
              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                }}
              >
                <p>
                  <strong>Customer Contact:</strong>
                </p>
                <p style={{ fontSize: "1.1rem", marginTop: "5px" }}>
                  📞 {job.userPhone}
                </p>
                <p style={{ fontSize: "1rem", color: "#666" }}>
                  📧 {job.userEmail}
                </p>
              </div>
              <div style={{ fontSize: "0.9rem", marginTop: "10px" }}>
                📍 Location: {job.location.latitude.toFixed(4)},{" "}
                {job.location.longitude.toFixed(4)}
              </div>
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  background: job.status === "disputed" ? "#fff1f2" : "#f0fdf4",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  color: job.status === "disputed" ? "#be123c" : "#166534",
                }}
              >
                {getStatusMessage(job.status)}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
