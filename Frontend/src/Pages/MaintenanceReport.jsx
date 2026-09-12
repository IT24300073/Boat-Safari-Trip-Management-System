import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../Styles/MaintenanceReport.css";

function MaintenanceReport() {
  const { user } = useAuth();
  const [boats, setBoats] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    boatId: "",
    guideName: user?.name || "",
    description: "",
    severity: "MEDIUM",
  });

  const fetchBoatsAndIssues = () => {
    axios
      .get("http://localhost:8080/api/boats")
      .then((res) => setBoats(res.data || []))
      .catch((err) => console.error("Error fetching boats:", err));

    axios
      .get("http://localhost:8080/api/maintenance")
      .then((res) => setIssues(res.data || []))
      .catch((err) => console.error("Error fetching maintenance issues:", err));
  };

  useEffect(() => {
    fetchBoatsAndIssues();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.boatId) {
      setError("Please select a boat to report maintenance for.");
      return;
    }

    setLoading(true);

    try {
      const selectedBoat = boats.find((b) => b.id === Number(formData.boatId));
      const payload = {
        boatId: Number(formData.boatId),
        boatName: selectedBoat?.name || "",
        guideName: formData.guideName.trim() || user?.name || "Safari Guide",
        description: formData.description.trim(),
        severity: formData.severity,
      };

      const response = await axios.post("http://localhost:8080/api/maintenance", payload);

      if (response.data) {
        setMessage(
          `🛠️ Maintenance issue reported successfully for boat "${selectedBoat?.name}". The boat is now marked UNAVAILABLE/MAINTENANCE and excluded from new trip bookings.`
        );
        setFormData({
          boatId: "",
          guideName: user?.name || "",
          description: "",
          severity: "MEDIUM",
        });
        fetchBoatsAndIssues();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to report maintenance issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (issueId) => {
    try {
      await axios.put(`http://localhost:8080/api/maintenance/${issueId}/resolve`);
      setMessage("✅ Maintenance issue marked RESOLVED. The boat status has been restored to AVAILABLE!");
      fetchBoatsAndIssues();
    } catch (err) {
      console.error(err);
      setError("Failed to resolve maintenance issue.");
    }
  };

  return (
    <div className="maintenance-page-wrapper">
      <div className="maintenance-container">
        <div className="maintenance-header">
          <div className="maintenance-badge">🛠️ SAFARI GUIDE PORTAL</div>
          <h2>Report Boat Maintenance Issue</h2>
          <p>
            Report mechanical, engine, or safety issues. Reported boats are instantly set to
            <strong> UNAVAILABLE / MAINTENANCE</strong> and blocked from trip assignments.
          </p>
        </div>

        {message && <div className="alert-box success">{message}</div>}
        {error && <div className="alert-box error">{error}</div>}

        {/* Form Card */}
        <div className="maintenance-card">
          <h3>📝 New Maintenance Incident Report</h3>
          <form onSubmit={handleSubmit} className="maintenance-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="boatId">Select Boat *</label>
                <select
                  id="boatId"
                  name="boatId"
                  value={formData.boatId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Choose Boat --</option>
                  {boats.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.boatType}) - Current Status: {b.status || "AVAILABLE"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="guideName">Guide / Reporter Name *</label>
                <input
                  id="guideName"
                  type="text"
                  name="guideName"
                  value={formData.guideName}
                  onChange={handleChange}
                  placeholder="e.g. Captain Sunimal"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="severity">Severity Level *</label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option value="LOW">🟢 Low - Minor cosmetic/fitting issue</option>
                  <option value="MEDIUM">🟡 Medium - Requires inspection before next voyage</option>
                  <option value="HIGH">🟠 High - Engine / steering problem</option>
                  <option value="CRITICAL">🔴 Critical - Grounded / Immediate repair needed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Issue Description & Remarks *</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the defect, noise, leak, or required maintenance..."
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-submit-maintenance" disabled={loading}>
              {loading ? "Submitting Report..." : "🚩 Submit Report & Mark Boat Unavailable"}
            </button>
          </form>
        </div>

        {/* Maintenance Log Table */}
        <div className="maintenance-card log-section">
          <h3>📋 Maintenance Logs & Active Tickets</h3>
          {issues.length === 0 ? (
            <p className="no-records">No maintenance issues recorded.</p>
          ) : (
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Boat</th>
                  <th>Reporter</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th>Reported Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td><strong>{item.boatName || `Boat #${item.boatId}`}</strong></td>
                    <td>{item.guideName}</td>
                    <td>
                      <span className={`severity-badge ${item.severity?.toLowerCase()}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="desc-cell">{item.description}</td>
                    <td>{item.reportedAt ? new Date(item.reportedAt).toLocaleString() : "-"}</td>
                    <td>
                      <span className={`status-badge ${item.status?.toLowerCase()}`}>
                        {item.status === "OPEN" ? "⚠️ UNDER MAINTENANCE" : "✅ RESOLVED"}
                      </span>
                    </td>
                    <td>
                      {item.status === "OPEN" && (
                        <button
                          className="btn-resolve"
                          onClick={() => handleResolve(item.id)}
                        >
                          Resolve & Reactivate Boat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaintenanceReport;
