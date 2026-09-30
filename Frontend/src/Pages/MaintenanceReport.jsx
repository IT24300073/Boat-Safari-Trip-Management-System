import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Styles/MaintenanceReport.css";

function MaintenanceReport() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "ADMIN" && window.location.pathname === "/maintenance") {
      navigate("/admin?tab=maintenance", { replace: true });
    }
  }, [user, navigate]);
  const [activeTab, setActiveTab] = useState("HISTORY"); // "HISTORY" or "INCIDENTS"
  const [boats, setBoats] = useState([]);
  const [issues, setIssues] = useState([]);
  const [fleetSummary, setFleetSummary] = useState([]);
  const [selectedBoatId, setSelectedBoatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Decommission modal state
  const [decommissioningBoat, setDecommissioningBoat] = useState(null);
  const [decommissionReason, setDecommissionReason] = useState("");
  const [decommissionLoading, setDecommissionLoading] = useState(false);

  // History filtering
  const [historySeverityFilter, setHistorySeverityFilter] = useState("ALL");

  const printRef = useRef();

  const [formData, setFormData] = useState({
    boatId: "",
    guideName: user?.name || "",
    description: "",
    severity: "MEDIUM",
  });

  const fetchBoatsAndIssues = () => {
    axios
      .get("http://localhost:8080/api/boats")
      .then((res) => {
        const boatList = res.data || [];
        setBoats(boatList);
        if (!selectedBoatId && boatList.length > 0) {
          setSelectedBoatId(boatList[0].id);
        }
      })
      .catch((err) => console.error("Error fetching boats:", err));

    axios
      .get("http://localhost:8080/api/maintenance")
      .then((res) => setIssues(res.data || []))
      .catch((err) => console.error("Error fetching maintenance issues:", err));

    axios
      .get("http://localhost:8080/api/maintenance/fleet-summary")
      .then((res) => setFleetSummary(res.data || []))
      .catch((err) => console.error("Error fetching fleet maintenance summary:", err));
  };

  useEffect(() => {
    fetchBoatsAndIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setMessage("✅ Maintenance issue marked RESOLVED. Boat status restored to active service if all issues cleared!");
      fetchBoatsAndIssues();
    } catch (err) {
      console.error(err);
      setError("Failed to resolve maintenance issue.");
    }
  };

  const handleDecommissionConfirm = async (e) => {
    e.preventDefault();
    if (!decommissioningBoat) return;
    setDecommissionLoading(true);
    try {
      await axios.put(`http://localhost:8080/api/maintenance/boat/${decommissioningBoat.boatId}/decommission`, {
        reason: decommissionReason.trim() || "Decommissioned based on accumulated structural wear & maintenance history.",
      });
      setMessage(`🛑 Boat "${decommissioningBoat.boatName}" has been formally DECOMMISSIONED and retired from commercial operations.`);
      setDecommissioningBoat(null);
      setDecommissionReason("");
      fetchBoatsAndIssues();
    } catch (err) {
      console.error(err);
      setError("Failed to decommission boat.");
    } finally {
      setDecommissionLoading(false);
    }
  };

  const handleRestoreBoat = async (boatId, boatName) => {
    if (!window.confirm(`Are you sure you want to restore vessel "${boatName}" back to active commercial service?`)) return;
    try {
      await axios.put(`http://localhost:8080/api/maintenance/boat/${boatId}/restore`);
      setMessage(`✅ Vessel "${boatName}" recertified and restored to AVAILABLE commercial service!`);
      fetchBoatsAndIssues();
    } catch (err) {
      console.error(err);
      setError("Failed to restore vessel.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Profile of the currently inspected boat
  const selectedProfile = fleetSummary.find((p) => p.boatId === selectedBoatId) || null;

  // Filter issues for the inspected boat based on severity
  const filteredBoatIssues = (selectedProfile?.issues || []).filter((i) => {
    if (historySeverityFilter === "ALL") return true;
    return i.severity?.toUpperCase() === historySeverityFilter;
  });

  return (
    <div className="maintenance-page-wrapper">
      <div className="maintenance-container">
        {/* Header Bar */}
        <div className="maintenance-header">
          <div className="maintenance-badge">🛠️ FLEET HEALTH & VESSEL AUDIT</div>
          <h2>Boat Maintenance History & Fleet Decommissioning Portal</h2>
          <p>
            Audit full chronological maintenance profiles for each boat to make data-driven decisions on preventive repair, drydock overhaul, or fleet decommissioning.
          </p>
        </div>

        {message && <div className="alert-box success">{message}</div>}
        {error && <div className="alert-box error">{error}</div>}

        {/* Tab Navigation */}
        <div className="maintenance-tabs">
          <button
            type="button"
            className={`maintenance-tab-btn ${activeTab === "HISTORY" ? "active" : ""}`}
            onClick={() => setActiveTab("HISTORY")}
          >
            📊 Boat Maintenance History & Decommissioning Advisory
          </button>
          <button
            type="button"
            className={`maintenance-tab-btn ${activeTab === "INCIDENTS" ? "active" : ""}`}
            onClick={() => setActiveTab("INCIDENTS")}
          >
            📝 Report Issue & Active Work Orders
          </button>
        </div>

        {/* ========================================================
            TAB 1: BOAT MAINTENANCE HISTORY & DECOMMISSIONING REPORT
            ======================================================== */}
        {activeTab === "HISTORY" && (
          <div className="history-tab-content">
            {/* Fleet Vessels Grid / Selector */}
            <div className="maintenance-card">
              <div className="fleet-selector-header">
                <div>
                  <h3>🚤 Safari Fleet Vessels ({fleetSummary.length})</h3>
                  <span className="section-subtext">Click on any vessel to inspect its detailed maintenance dossier and decommission advisory.</span>
                </div>
                <button type="button" className="btn-print-dossier" onClick={handlePrint}>
                  🖨️ Print Maintenance Dossier
                </button>
              </div>

              <div className="fleet-boats-grid">
                {fleetSummary.map((b) => {
                  const isSelected = b.boatId === selectedBoatId;
                  const isDecommissioned = b.status === "DECOMMISSIONED";
                  return (
                    <div
                      key={b.boatId}
                      className={`fleet-boat-card ${isSelected ? "selected" : ""} ${isDecommissioned ? "decommissioned" : ""}`}
                      onClick={() => setSelectedBoatId(b.boatId)}
                    >
                      <div className="boat-card-header">
                        <span className="boat-card-icon">🚤</span>
                        <div className="boat-card-title-group">
                          <span className="boat-card-name">{b.boatName}</span>
                          <span className="boat-card-type">{b.boatType} • Cap: {b.capacity}</span>
                        </div>
                      </div>

                      <div className="boat-card-status-row">
                        <span className={`boat-status-tag ${b.status?.toLowerCase()}`}>
                          {b.status}
                        </span>
                        <span className="boat-incidents-count">
                          {b.totalIncidents} {b.totalIncidents === 1 ? "Incident" : "Incidents"}
                        </span>
                      </div>

                      {/* Decommission Advisory Indicator */}
                      <div className="boat-advisory-badge-row">
                        <span className={`advisory-pill ${b.recommendationCode?.toLowerCase()}`}>
                          {b.advisoryBadge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Boat Comprehensive Maintenance Dossier */}
            {selectedProfile ? (
              <div className="maintenance-card profile-dossier-card" ref={printRef}>
                {/* Profile Header */}
                <div className="dossier-header-bar">
                  <div>
                    <span className="dossier-vessel-tag">VESSEL PROFILE #{selectedProfile.boatId}</span>
                    <h2 className="dossier-vessel-name">{selectedProfile.boatName}</h2>
                    <span className="dossier-meta">
                      Type: <strong>{selectedProfile.boatType}</strong> • Capacity: <strong>{selectedProfile.capacity} Passengers</strong> • Operational Status:{" "}
                      <strong className={`status-highlight ${selectedProfile.status?.toLowerCase()}`}>
                        {selectedProfile.status}
                      </strong>
                    </span>
                  </div>

                  {/* Decision Action Buttons for Administrator */}
                  <div className="dossier-actions-group">
                    {selectedProfile.status === "DECOMMISSIONED" ? (
                      <button
                        type="button"
                        className="btn-restore-vessel"
                        onClick={() => handleRestoreBoat(selectedProfile.boatId, selectedProfile.boatName)}
                      >
                        ✅ Re-commission / Restore Vessel
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-decommission-vessel"
                        onClick={() => setDecommissioningBoat(selectedProfile)}
                      >
                        🛑 Decommission Vessel
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Metrics Summary Row */}
                <div className="dossier-kpi-grid">
                  <div className="dossier-kpi-card">
                    <span className="kpi-label">Total Recorded Incidents</span>
                    <span className="kpi-value">{selectedProfile.totalIncidents}</span>
                    <span className="kpi-sub">Lifetime maintenance events</span>
                  </div>
                  <div className="dossier-kpi-card critical">
                    <span className="kpi-label">Critical & High Failures</span>
                    <span className="kpi-value">{selectedProfile.criticalCount + selectedProfile.highCount}</span>
                    <span className="kpi-sub">{selectedProfile.criticalCount} Critical • {selectedProfile.highCount} High</span>
                  </div>
                  <div className="dossier-kpi-card">
                    <span className="kpi-label">Open vs Resolved</span>
                    <span className="kpi-value">{selectedProfile.openCount} / {selectedProfile.resolvedCount}</span>
                    <span className="kpi-sub">{selectedProfile.openCount > 0 ? "⚠️ Active repairs pending" : "All issues resolved"}</span>
                  </div>
                  <div className="dossier-kpi-card risk">
                    <span className="kpi-label">Decommission Wear Score</span>
                    <div className="risk-score-display">
                      <span className="kpi-value">{selectedProfile.decommissionRiskScore}%</span>
                      <div className="risk-gauge-bar">
                        <div
                          className="risk-gauge-fill"
                          style={{
                            width: `${selectedProfile.decommissionRiskScore}%`,
                            background:
                              selectedProfile.decommissionRiskScore >= 70
                                ? "linear-gradient(90deg, #ef4444, #b91c1c)"
                                : selectedProfile.decommissionRiskScore >= 45
                                ? "linear-gradient(90deg, #f59e0b, #d97706)"
                                : "linear-gradient(90deg, #10b981, #059669)",
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="kpi-sub">Cumulative mechanical wear rating</span>
                  </div>
                </div>

                {/* Operational Decommissioning & Repair Advisory Card */}
                <div className={`decommission-advisory-box ${selectedProfile.recommendationCode?.toLowerCase()}`}>
                  <div className="advisory-icon">
                    {selectedProfile.status === "DECOMMISSIONED"
                      ? "⚫"
                      : selectedProfile.decommissionRiskScore >= 70
                      ? "🚨"
                      : selectedProfile.decommissionRiskScore >= 45
                      ? "🛠️"
                      : "✅"}
                  </div>
                  <div className="advisory-content">
                    <div className="advisory-title-line">
                      <span className="advisory-badge-label">{selectedProfile.advisoryBadge}</span>
                      <span className="advisory-code-tag">FLEET ADVISORY AUDIT</span>
                    </div>
                    <p className="advisory-text-body">{selectedProfile.advisoryText}</p>
                  </div>
                </div>

                {/* Chronological Maintenance Event History Log */}
                <div className="history-table-section">
                  <div className="history-table-header">
                    <h4>📋 Chronological Maintenance History Log ({filteredBoatIssues.length})</h4>
                    <div className="severity-filter-pills">
                      {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          className={`sev-pill ${historySeverityFilter === lvl ? "active" : ""}`}
                          onClick={() => setHistorySeverityFilter(lvl)}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredBoatIssues.length === 0 ? (
                    <div className="empty-history-box">
                      <p>No maintenance incidents recorded matching the selected criteria for this vessel.</p>
                    </div>
                  ) : (
                    <div className="table-responsive-wrapper">
                      <table className="maintenance-table">
                        <thead>
                          <tr>
                            <th>Incident Ref</th>
                            <th>Reported Date</th>
                            <th>Reporter / Guide</th>
                            <th>Severity</th>
                            <th>Defect Description & Remarks</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBoatIssues.map((issue) => (
                            <tr key={issue.id}>
                              <td><span className="ref-tag">#{issue.id}</span></td>
                              <td>{issue.reportedAt ? new Date(issue.reportedAt).toLocaleString() : "-"}</td>
                              <td><strong>{issue.guideName}</strong></td>
                              <td>
                                <span className={`severity-badge ${issue.severity?.toLowerCase()}`}>
                                  {issue.severity}
                                </span>
                              </td>
                              <td className="desc-cell">{issue.description}</td>
                              <td>
                                <span className={`status-badge ${issue.status?.toLowerCase()}`}>
                                  {issue.status === "OPEN" ? "⚠️ UNDER REPAIR" : "✅ RESOLVED"}
                                </span>
                              </td>
                              <td>
                                {issue.status === "OPEN" && (
                                  <button
                                    className="btn-resolve"
                                    onClick={() => handleResolve(issue.id)}
                                  >
                                    Mark Resolved
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state-box">
                <p>Select a boat from the fleet above to view its maintenance history report.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: INCIDENT ENTRY & ACTIVE TICKETS (STAFF / GUIDES)
            ======================================================== */}
        {activeTab === "INCIDENTS" && (
          <div className="incidents-tab-content">
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
                          {b.name} ({b.boatType}) - Status: {b.status || "AVAILABLE"}
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
                      placeholder="e.g. Captain Sunimal Fernando"
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
                      <option value="LOW">🟢 Low - Minor cosmetic / fitting issue</option>
                      <option value="MEDIUM">🟡 Medium - Requires inspection before next voyage</option>
                      <option value="HIGH">🟠 High - Engine / steering problem</option>
                      <option value="CRITICAL">🔴 Critical - Grounded / Immediate repair needed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Issue Description & Defect Remarks *</label>
                  <textarea
                    id="description"
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the defect, noise, vibration, leak, or required repair in detail..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn-submit-maintenance" disabled={loading}>
                  {loading ? "Submitting Report..." : "🚩 Submit Report & Mark Boat Under Maintenance"}
                </button>
              </form>
            </div>

            {/* Active Tickets List */}
            <div className="maintenance-card log-section">
              <h3>📋 Active Fleet Maintenance Tickets</h3>
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
        )}

        {/* Decommission Modal */}
        {decommissioningBoat && (
          <div
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDecommissioningBoat(null);
            }}
          >
            <div className="decommission-modal">
              <div className="decommission-modal-header">
                <span className="decommission-alert-badge">FORMAL VESSEL DECOMMISSION</span>
                <h3>Decommission Boat: {decommissioningBoat.boatName}</h3>
                <p>
                  Decommissioning will permanently mark this vessel as retired from commercial safari service and block all future trip allocations.
                </p>
              </div>

              <div className="decommission-summary-box">
                <div><strong>Vessel:</strong> {decommissioningBoat.boatName} ({decommissioningBoat.boatType})</div>
                <div><strong>Total Incidents:</strong> {decommissioningBoat.totalIncidents}</div>
                <div><strong>Critical Incidents:</strong> {decommissioningBoat.criticalCount}</div>
                <div><strong>Decommission Wear Rating:</strong> {decommissioningBoat.decommissionRiskScore}%</div>
              </div>

              <form onSubmit={handleDecommissionConfirm} className="decommission-form">
                <div className="form-group">
                  <label htmlFor="decommissionReason">Decommission Justification / Reason *</label>
                  <textarea
                    id="decommissionReason"
                    rows="3"
                    placeholder="Enter maritime survey details, engine retirement rationale, or decommissioning reason..."
                    value={decommissionReason}
                    onChange={(e) => setDecommissionReason(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="modal-actions-row">
                  <button
                    type="submit"
                    className="btn-confirm-decommission"
                    disabled={decommissionLoading || !decommissionReason.trim()}
                  >
                    {decommissionLoading ? "Decommissioning..." : "🛑 Confirm Vessel Decommission"}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-modal"
                    onClick={() => setDecommissioningBoat(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaintenanceReport;
