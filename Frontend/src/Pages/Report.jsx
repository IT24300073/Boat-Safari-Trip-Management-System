import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import "../Styles/Report.css";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Ship,
  Anchor,
  Users,
  Clock,
  TrendingUp,
  DollarSign,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Gauge,
  LayoutGrid,
  Table as TableIcon,
  Search,
  ArrowUpDown,
  Compass,
  Scale,
  Flame,
  Activity
} from "lucide-react";

const Report = () => {
  const [viewMode, setViewMode] = useState("OPERATIONS"); // "OPERATIONS", "RECONCILIATION", "UTILIZATION"

  const getInitialDateRange = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    return {
      start: `${y}-${m}-01`,
      end: `${y}-${m}-${String(lastDay).padStart(2, "0")}`
    };
  };

  const initialRange = getInitialDateRange();

  // Operations Dashboard State
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [analytics, setAnalytics] = useState(null);

  // Reconciliation State
  const [reconPeriod, setReconPeriod] = useState("month");
  const [reconStartDate, setReconStartDate] = useState(initialRange.start);
  const [reconEndDate, setReconEndDate] = useState(initialRange.end);
  const [reconPaymentMethod, setReconPaymentMethod] = useState("ALL");
  const [reconciliation, setReconciliation] = useState(null);

  // Boat Utilization State (Operations Manager)
  const [utilPeriod, setUtilPeriod] = useState("month");
  const [utilStartDate, setUtilStartDate] = useState(initialRange.start);
  const [utilEndDate, setUtilEndDate] = useState(initialRange.end);
  const [utilizationData, setUtilizationData] = useState(null);
  const [utilSortBy, setUtilSortBy] = useState("capacityUtil"); // "capacityUtil", "slotUtil", "revenue", "trips"
  const [utilSearch, setUtilSearch] = useState("");
  const [utilStatusFilter, setUtilStatusFilter] = useState("ALL"); // "ALL", "HIGH_DEMAND", "BALANCED", "UNDERUTILIZED"


  const [loading, setLoading] = useState(false);
  const reportRef = useRef();

  // Fetch Operations Analytics
  const fetchAnalytics = useCallback((activePeriod = period, sDate = startDate, eDate = endDate) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("period", activePeriod);
    if (activePeriod === "custom") {
      if (sDate) params.append("startDate", sDate);
      if (eDate) params.append("endDate", eDate);
    }

    axios
      .get(`http://localhost:8080/api/reports/analytics?${params.toString()}`)
      .then((res) => {
        setAnalytics(res.data);
      })
      .catch((err) => console.error("Error fetching analytics:", err))
      .finally(() => setLoading(false));
  }, [period, startDate, endDate]);

  // Fetch Payment Reconciliation
  const fetchReconciliation = useCallback((sDate = reconStartDate, eDate = reconEndDate, method = reconPaymentMethod) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sDate) params.append("startDate", sDate);
    if (eDate) params.append("endDate", eDate);
    if (method && method !== "ALL") params.append("paymentMethod", method);

    axios
      .get(`http://localhost:8080/api/reports/reconciliation?${params.toString()}`)
      .then((res) => {
        setReconciliation(res.data);
      })
      .catch((err) => console.error("Error fetching reconciliation:", err))
      .finally(() => setLoading(false));
  }, [reconStartDate, reconEndDate, reconPaymentMethod]);

  // Fetch Boat Utilization Analytics (Operations Manager)
  const fetchBoatUtilization = useCallback((activePeriod = utilPeriod, sDate = utilStartDate, eDate = utilEndDate) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("period", activePeriod);
    if (activePeriod === "custom") {
      if (sDate) params.append("startDate", sDate);
      if (eDate) params.append("endDate", eDate);
    }

    axios
      .get(`http://localhost:8080/api/reports/boat-utilization?${params.toString()}`)
      .then((res) => {
        setUtilizationData(res.data);
      })
      .catch((err) => console.error("Error fetching boat utilization:", err))
      .finally(() => setLoading(false));
  }, [utilPeriod, utilStartDate, utilEndDate]);

  useEffect(() => {
    if (viewMode === "OPERATIONS") {
      fetchAnalytics(period, startDate, endDate);
    } else if (viewMode === "RECONCILIATION") {
      fetchReconciliation(reconStartDate, reconEndDate, reconPaymentMethod);
    } else if (viewMode === "UTILIZATION") {
      fetchBoatUtilization(utilPeriod, utilStartDate, utilEndDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, period, utilPeriod]);

  const handlePeriodChange = (selectedPeriod) => {
    setPeriod(selectedPeriod);
    if (selectedPeriod === "custom") {
      return;
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");

    let s = "";
    let e = "";

    if (selectedPeriod === "today") {
      s = `${y}-${m}-${d}`;
      e = `${y}-${m}-${d}`;
    } else if (selectedPeriod === "week") {
      const day = now.getDay();
      const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(now);
      mon.setDate(diffToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      s = mon.toISOString().split("T")[0];
      e = sun.toISOString().split("T")[0];
    } else if (selectedPeriod === "month") {
      s = `${y}-${m}-01`;
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      e = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    } else if (selectedPeriod === "year") {
      s = `${y}-01-01`;
      e = `${y}-12-31`;
    }

    setStartDate(s);
    setEndDate(e);
    fetchAnalytics(selectedPeriod, s, e);
  };

  const handleUtilPeriodChange = (selectedPeriod) => {
    setUtilPeriod(selectedPeriod);
    if (selectedPeriod === "custom") {
      return;
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");

    let s = "";
    let e = "";

    if (selectedPeriod === "today") {
      s = `${y}-${m}-${d}`;
      e = `${y}-${m}-${d}`;
    } else if (selectedPeriod === "week") {
      const day = now.getDay();
      const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(now);
      mon.setDate(diffToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      s = mon.toISOString().split("T")[0];
      e = sun.toISOString().split("T")[0];
    } else if (selectedPeriod === "month") {
      s = `${y}-${m}-01`;
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      e = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    } else if (selectedPeriod === "year") {
      s = `${y}-01-01`;
      e = `${y}-12-31`;
    }

    setUtilStartDate(s);
    setUtilEndDate(e);
    fetchBoatUtilization(selectedPeriod, s, e);
  };

  const handleUtilCustomSearch = (e) => {
    e.preventDefault();
    setUtilPeriod("custom");
    fetchBoatUtilization("custom", utilStartDate, utilEndDate);
  };

  // Summary metrics for utilization
  const utilCounts = useMemo(() => {
    if (!utilizationData?.boatMetrics)
      return { total: 0, high: 0, balanced: 0, surplus: 0, maxPassUtil: 0, totalCapacity: 0 };
    const list = utilizationData.boatMetrics;
    const high = list.filter((b) => b.resourceStatus === "HIGH_DEMAND").length;
    const balanced = list.filter((b) => b.resourceStatus === "BALANCED").length;
    const surplus = list.filter((b) => b.resourceStatus === "UNDERUTILIZED").length;
    const maxPassUtil = Math.max(0, ...list.map((b) => b.passengerCapacityUtilizationRate || 0));
    const totalCapacity = list.reduce((acc, b) => acc + (Number(b.capacity) || 0), 0);
    return {
      total: list.length,
      high,
      balanced,
      surplus,
      maxPassUtil,
      totalCapacity,
    };
  }, [utilizationData]);

  // Sort and filter boat metrics for utilization table
  const sortedBoatMetrics = useMemo(() => {
    if (!utilizationData?.boatMetrics) return [];
    let list = utilizationData.boatMetrics.filter((b) => {
      if (utilStatusFilter !== "ALL" && b.resourceStatus !== utilStatusFilter) {
        return false;
      }
      if (!utilSearch.trim()) return true;
      const q = utilSearch.toLowerCase();
      return b.boatName?.toLowerCase().includes(q) || b.boatType?.toLowerCase().includes(q);
    });

    return [...list].sort((a, b) => {
      if (utilSortBy === "capacityUtil") {
        return (b.passengerCapacityUtilizationRate || 0) - (a.passengerCapacityUtilizationRate || 0);
      } else if (utilSortBy === "slotUtil") {
        return (b.slotUtilizationRate || 0) - (a.slotUtilizationRate || 0);
      } else if (utilSortBy === "revenue") {
        return (b.revenue || 0) - (a.revenue || 0);
      } else if (utilSortBy === "trips") {
        return (b.activeTrips || 0) - (a.activeTrips || 0);
      }
      return 0;
    });
  }, [utilizationData, utilSearch, utilSortBy, utilStatusFilter]);

  const handleCustomSearch = (e) => {
    e.preventDefault();
    setPeriod("custom");
    fetchAnalytics("custom", startDate, endDate);
  };

  const handleReconSearch = (e) => {
    e.preventDefault();
    setReconPeriod("custom");
    fetchReconciliation(reconStartDate, reconEndDate, reconPaymentMethod);
  };

  const handleReconPeriodChange = (selectedPeriod) => {
    setReconPeriod(selectedPeriod);
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");

    let s = "";
    let e = "";

    if (selectedPeriod === "today") {
      s = `${y}-${m}-${d}`;
      e = `${y}-${m}-${d}`;
    } else if (selectedPeriod === "week") {
      const day = now.getDay();
      const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(now);
      mon.setDate(diffToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      s = mon.toISOString().split("T")[0];
      e = sun.toISOString().split("T")[0];
    } else if (selectedPeriod === "month") {
      s = `${y}-${m}-01`;
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      e = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    } else if (selectedPeriod === "year") {
      s = `${y}-01-01`;
      e = `${y}-12-31`;
    } else if (selectedPeriod === "all") {
      s = "2020-01-01";
      e = `${y + 1}-12-31`;
    }

    setReconStartDate(s);
    setReconEndDate(e);
    fetchReconciliation(s, e, reconPaymentMethod);
  };

  const handleGatewayChange = (newMethod) => {
    setReconPaymentMethod(newMethod);
    fetchReconciliation(reconStartDate, reconEndDate, newMethod);
  };

  const handleDownloadCsv = () => {
    const params = new URLSearchParams();
    if (reconStartDate) params.append("startDate", reconStartDate);
    if (reconEndDate) params.append("endDate", reconEndDate);
    if (reconPaymentMethod && reconPaymentMethod !== "ALL") params.append("paymentMethod", reconPaymentMethod);

    fetch(`http://localhost:8080/api/reports/reconciliation/csv?${params.toString()}`)
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payment_reconciliation_${reconStartDate || "all"}_to_${reconEndDate || "all"}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => console.error("Error downloading CSV:", err));
  };

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `ALOKA_Safari_Report_${viewMode}_${period}`,
    onAfterPrint: () => alert("Report successfully exported!"),
  });

  const handleDownload = async () => {
    if (!reportRef.current) return;

    const input = reportRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`ALOKA_Safari_${viewMode}_Report.pdf`);
  };

  return (
    <div className="report-page-wrapper">
      <div className="report-header-bar">
        <div>
          <span className="report-badge">FINANCIAL & OPERATIONS AUDIT</span>
          <h1>
            {viewMode === "OPERATIONS"
              ? "Business Performance & Revenue Dashboard"
              : "Boat Utilization Rates & Fleet Capacity Analysis"}
          </h1>
          <p className="header-subtext">
            {viewMode === "OPERATIONS"
              ? "Track confirmed bookings, gross revenue, passenger metrics, and trip cancellations in real time."
              : "Analyze slot and passenger capacity utilization across all safari vessels to determine operational resource allocation and fleet expansion needs."}
          </p>
        </div>

        <div className="report-actions">
          <button 
            className="btn-report-action secondary" 
            style={{background: 'var(--emerald)', color: '#fff', borderColor: 'var(--emerald)'}}
            onClick={() => {
              axios.post("http://localhost:8080/api/reports/generate")
                .then(() => alert("Report data generated successfully! Please refresh or change filter to see updates."))
                .catch(err => console.error(err));
            }}
          >
            ⚡ Generate Latest Data
          </button>
          <button className="btn-report-action secondary" onClick={handlePrint}>
            🖨️ Print Report
          </button>
          <button className="btn-report-action outline" onClick={handleDownload}>
            📥 Download PDF
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="report-mode-tabs">
        <button
          className={`mode-tab-btn ${viewMode === "OPERATIONS" ? "active" : ""}`}
          onClick={() => setViewMode("OPERATIONS")}
        >
          📊 Operations Performance Dashboard
        </button>
        <button
          className={`mode-tab-btn ${viewMode === "UTILIZATION" ? "active" : ""}`}
          onClick={() => setViewMode("UTILIZATION")}
        >
          🚤 Fleet Boat Utilization & Capacity Analysis
        </button>
      </div>

      {/* ==================== VIEW MODE 1: OPERATIONS DASHBOARD ==================== */}
      {viewMode === "OPERATIONS" && (
        <>
          {/* Modernized Operations Period Filter Bar */}
          <div className="modern-filter-panel">
            <div className="filter-header-row">
              <div className="filter-meta-col">
                <div className="filter-badge-row">
                  <span className="filter-icon-badge">📊</span>
                  <div>
                    <h4 className="filter-meta-title">Operations Performance Timeframe</h4>
                    <p className="filter-meta-subtitle">
                      Filter booking revenue and passenger volume by standard periods or custom dates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="filter-presets-wrap">
                <span className="preset-label">Quick Period:</span>
                <div className="modern-pills-group">
                  <button
                    type="button"
                    className={`modern-pill ${period === "today" ? "active" : ""}`}
                    onClick={() => handlePeriodChange("today")}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`modern-pill ${period === "week" ? "active" : ""}`}
                    onClick={() => handlePeriodChange("week")}
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    className={`modern-pill ${period === "month" ? "active" : ""}`}
                    onClick={() => handlePeriodChange("month")}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    className={`modern-pill ${period === "year" ? "active" : ""}`}
                    onClick={() => handlePeriodChange("year")}
                  >
                    This Year
                  </button>
                  <button
                    type="button"
                    className={`modern-pill ${period === "custom" ? "active" : ""}`}
                    onClick={() => setPeriod("custom")}
                  >
                    Custom Range
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleCustomSearch} className="modern-date-toolbar">
              <div className="date-field-group">
                <label className="date-field-label">
                  <span className="label-dot"></span> Start Date
                </label>
                <div className="date-input-container">
                  <input
                    type="date"
                    className="modern-date-picker"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPeriod("custom");
                    }}
                    required
                  />
                </div>
              </div>

              <div className="date-range-connector">
                <span className="connector-badge">to</span>
              </div>

              <div className="date-field-group">
                <label className="date-field-label">
                  <span className="label-dot end"></span> End Date
                </label>
                <div className="date-input-container">
                  <input
                    type="date"
                    className="modern-date-picker"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPeriod("custom");
                    }}
                    required
                  />
                </div>
              </div>

              <div className="date-toolbar-actions">
                <button type="submit" className="btn-modern-apply">
                  <span className="btn-icon">⚡</span>
                  <span>Apply Filter</span>
                </button>

                <div className="active-preset-badge">
                  <span>Active:</span>
                  <strong>{period === "custom" ? "CUSTOM RANGE" : period.toUpperCase()}</strong>
                </div>
              </div>
            </form>
          </div>

          {loading ? (
            <div className="report-loading-state">
              <div className="spinner"></div>
              <p>Computing operational analytics & financial tallies...</p>
            </div>
          ) : analytics ? (
            <div className="report-document-card" ref={reportRef}>
              <div className="doc-header">
                <div>
                  <h2>ALOKA SAFARI MANAGEMENT</h2>
                  <p className="doc-title">
                    Executive Business Performance Report ({analytics.startDate} to {analytics.endDate})
                  </p>
                </div>
                <div className="doc-timestamp">
                  <span>Report Generated:</span>
                  <strong>{new Date().toLocaleString()}</strong>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="report-kpi-grid">
                <div className="kpi-card blue">
                  <span className="kpi-icon">📊</span>
                  <span className="kpi-title">Total Bookings</span>
                  <span className="kpi-value">{analytics.totalBookings}</span>
                  <span className="kpi-subtext">Confirmed Reservations</span>
                </div>

                <div className="kpi-card amber">
                  <span className="kpi-icon">💰</span>
                  <span className="kpi-title">Total Revenue</span>
                  <span className="kpi-value">LKR {Number(analytics.totalRevenue || 0).toLocaleString()}</span>
                  <span className="kpi-subtext">Gross Confirmed Income</span>
                </div>

                <div className="kpi-card red">
                  <span className="kpi-icon">🚫</span>
                  <span className="kpi-title">Trip Cancellations</span>
                  <span className="kpi-value">{analytics.cancellationsCount || 0}</span>
                  <span className="kpi-subtext">
                    {analytics.cancelledRevenue > 0
                      ? `LKR ${Number(analytics.cancelledRevenue).toLocaleString()} Voided`
                      : "Weather / Maintenance"}
                  </span>
                </div>

                <div className="kpi-card emerald">
                  <span className="kpi-icon">👥</span>
                  <span className="kpi-title">Total Passengers</span>
                  <span className="kpi-value">{analytics.totalPassengers || 0}</span>
                  <span className="kpi-subtext">
                    ({analytics.totalAdults} Adults, {analytics.totalChildren} Children)
                  </span>
                </div>
              </div>

              {/* Package Breakdown Table */}
              {analytics.packageBreakdown && Object.keys(analytics.packageBreakdown).length > 0 && (
                <div className="report-table-section">
                  <h3>📦 Performance Breakdown by Safari Package</h3>
                  <table className="report-data-table">
                    <thead>
                      <tr>
                        <th>Safari Package Name</th>
                        <th>Bookings Count</th>
                        <th>Total Passengers</th>
                        <th>Generated Revenue (LKR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analytics.packageBreakdown).map(([packageName, metrics]) => (
                        <tr key={packageName}>
                          <td><strong>{packageName}</strong></td>
                          <td>{metrics.count}</td>
                          <td>{metrics.passengers}</td>
                          <td>LKR {Number(metrics.revenue || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Detailed Transactions Table */}
              <div className="report-table-section">
                <h3>Detailed Booking Transactions ({analytics.bookings ? analytics.bookings.length : 0})</h3>
                <table className="report-data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer Name</th>
                      <th>Email</th>
                      <th>Safari Date</th>
                      <th>Adults</th>
                      <th>Children</th>
                      <th>Boat</th>
                      <th>Trip Package</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!analytics.bookings || analytics.bookings.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: "center", padding: "24px" }}>
                          No bookings recorded for this selected period ({analytics.startDate} to {analytics.endDate}).
                        </td>
                      </tr>
                    ) : (
                      analytics.bookings.map((b) => {
                        const isCancelled = b.bookingStatus === "CANCELLED";
                        return (
                          <tr key={b.id}>
                            <td>#{b.id}</td>
                            <td><strong>{b.name}</strong></td>
                            <td>{b.email}</td>
                            <td>{b.safariDate}</td>
                            <td>{b.adults}</td>
                            <td>{b.children}</td>
                            <td>{b.boat?.name || "N/A"}</td>
                            <td>{b.trip?.name || "Standard Safari"}</td>
                            <td>
                              {isCancelled ? (
                                <div>
                                  <span className="status-cancelled">🚫 Cancelled</span>
                                  {b.cancelReason && (
                                    <div className="cancel-reason-note">{b.cancelReason}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="status-confirmed">✓ Confirmed</span>
                              )}
                            </td>
                            <td>
                              {isCancelled ? (
                                <span className="amount-void" title="Cancelled booking - excluded from gross revenue">
                                  LKR {Number(b.totalPrice).toLocaleString()}
                                </span>
                              ) : (
                                <strong>LKR {Number(b.totalPrice).toLocaleString()}</strong>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="report-doc-footer">
                <p>Official Performance Analytics Document - Generated by ALOKA Boat Safari Operations Engine</p>
              </div>
            </div>
          ) : null}
        </>
      )}



      {/* ==================== VIEW MODE 3: BOAT UTILIZATION & CAPACITY ANALYSIS ==================== */}
      {viewMode === "UTILIZATION" && (
        <>
          {/* Modernized Period Filter Bar */}
          <div className="modern-filter-panel">
            <div className="filter-header-row">
              <div className="filter-meta-col">
                <div className="filter-badge-row">
                  <span className="filter-icon-badge">⛵</span>
                  <div>
                    <h4 className="filter-meta-title">Fleet Operating Audit Horizon</h4>
                    <p className="filter-meta-subtitle">
                      Filter vessel slot & passenger utilization across preset horizons or define custom date boundaries.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Period Presets */}
              <div className="filter-presets-wrap">
                <span className="preset-label">Quick Horizon:</span>
                <div className="modern-pills-group">
                  <button
                    type="button"
                    className={`modern-pill ${utilPeriod === "today" ? "active" : ""}`}
                    onClick={() => handleUtilPeriodChange("today")}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`modern-pill ${utilPeriod === "week" ? "active" : ""}`}
                    onClick={() => handleUtilPeriodChange("week")}
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    className={`modern-pill ${utilPeriod === "month" ? "active" : ""}`}
                    onClick={() => handleUtilPeriodChange("month")}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    className={`modern-pill ${utilPeriod === "year" ? "active" : ""}`}
                    onClick={() => handleUtilPeriodChange("year")}
                  >
                    This Year
                  </button>
                  <button
                    type="button"
                    className={`modern-pill ${utilPeriod === "custom" ? "active" : ""}`}
                    onClick={() => handleUtilPeriodChange("custom")}
                  >
                    Custom Range
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Range Form Toolbar */}
            <form onSubmit={handleUtilCustomSearch} className="modern-date-toolbar">
              <div className="date-field-group">
                <label className="date-field-label">
                  <span className="label-dot"></span> Start Date
                </label>
                <div className="date-input-container">
                  <input
                    type="date"
                    className="modern-date-picker"
                    value={utilStartDate}
                    onChange={(e) => {
                      setUtilStartDate(e.target.value);
                      setUtilPeriod("custom");
                    }}
                    required
                  />
                </div>
              </div>

              <div className="date-range-connector">
                <span className="connector-badge">to</span>
              </div>

              <div className="date-field-group">
                <label className="date-field-label">
                  <span className="label-dot end"></span> End Date
                </label>
                <div className="date-input-container">
                  <input
                    type="date"
                    className="modern-date-picker"
                    value={utilEndDate}
                    onChange={(e) => {
                      setUtilEndDate(e.target.value);
                      setUtilPeriod("custom");
                    }}
                    required
                  />
                </div>
              </div>

              <div className="date-toolbar-actions">
                <button type="submit" className="btn-modern-apply">
                  <span className="btn-icon">⚡</span>
                  <span>Filter Utilization</span>
                </button>

                <div className="active-preset-badge">
                  <span>Auditing:</span>
                  <strong>{utilPeriod === "custom" ? "CUSTOM RANGE" : utilPeriod.toUpperCase()}</strong>
                </div>
              </div>
            </form>
          </div>

          {loading ? (
            <div className="loading-card">
              <div className="spinner"></div>
              <p>Analyzing fleet vessel utilization rates and slot capacity...</p>
            </div>
          ) : utilizationData ? (
            <div className="report-document-card report-content-card" ref={reportRef}>
              <div className="report-doc-header">
                <div className="report-doc-title-group">
                  <span className="doc-type-badge">OPERATIONS RESOURCE AUDIT</span>
                  <h2>Boat Utilization Rates & Fleet Capacity Evaluation</h2>
                  <p className="doc-subtitle">
                    Period: <strong>{utilizationData.startDate}</strong> to <strong>{utilizationData.endDate}</strong> ({utilizationData.operatingDays} Operating Days • 4 Daily Departures per Vessel)
                  </p>
                </div>
                <div className="report-date-stamp">
                  <span>Generated:</span> <strong>{new Date().toLocaleDateString()}</strong>
                </div>
              </div>

              {/* Operations Manager Resource Decision Banner */}
              <div
                className={`operations-advisory-banner ${
                  utilizationData.needsAdditionalResources
                    ? "critical-need"
                    : utilCounts.surplus > utilCounts.high
                    ? "surplus-headroom"
                    : "balanced"
                }`}
              >
                <div className="advisory-icon-large">
                  {utilizationData.needsAdditionalResources ? "🚨" : utilCounts.surplus > utilCounts.high ? "💤" : "⚖️"}
                </div>
                <div className="advisory-body">
                  <div className="advisory-decision-title">
                    <span className="decision-tag">OPERATIONS MANAGER DECISION MATRIX</span>
                    <h3>
                      {utilizationData.needsAdditionalResources
                        ? "Additional Boat Resources Needed / Fleet Expansion Recommended"
                        : utilCounts.surplus > utilCounts.high
                        ? "Fleet Capacity Headroom Available / Marketing Promotion Advised"
                        : "Fleet Resource Capacity is Optimal & Well-Balanced"}
                    </h3>
                  </div>
                  <p className="advisory-decision-text">
                    {utilizationData.fleetAdvisory}
                  </p>
                </div>

                <div className="advisory-metrics-sidebar">
                  <div className="advisory-stat-chip">
                    <span className="chip-label">Peak Vessel Load</span>
                    <span className="chip-value">{utilCounts.maxPassUtil}%</span>
                  </div>
                  <div className="advisory-stat-chip">
                    <span className="chip-label">Fleet Strain</span>
                    <span className="chip-value">
                      {utilCounts.high} of {utilCounts.total} Vessels at Peak
                    </span>
                  </div>
                  <div className="advisory-stat-chip">
                    <span className="chip-label">Operational Scope</span>
                    <span className="chip-value">
                      {utilizationData.operatingDays * 4} Departures / Boat
                    </span>
                  </div>
                </div>
              </div>

              {/* Fleet Health & Demand Distribution Segmented Bar */}
              <div className="fleet-distribution-card">
                <div className="distribution-header">
                  <div className="distribution-title">
                    <span className="distribution-icon">📊</span>
                    <div>
                      <h4>Fleet Demand & Capacity Distribution</h4>
                      <p>Visual status distribution of all vessels in marina operations.</p>
                    </div>
                  </div>
                  <div className="distribution-legend">
                    <span className="legend-item high">
                      <span className="legend-dot"></span> High Demand: <strong>{utilCounts.high}</strong>
                    </span>
                    <span className="legend-item balanced">
                      <span className="legend-dot"></span> Balanced: <strong>{utilCounts.balanced}</strong>
                    </span>
                    <span className="legend-item surplus">
                      <span className="legend-dot"></span> Spare Capacity: <strong>{utilCounts.surplus}</strong>
                    </span>
                  </div>
                </div>

                {/* Segmented bar */}
                <div className="segmented-distribution-bar">
                  {utilCounts.total > 0 && (
                    <>
                      <div
                        className="seg-fill high"
                        style={{ width: `${(utilCounts.high / utilCounts.total) * 100}%` }}
                        title={`High Demand: ${utilCounts.high} vessels (${Math.round((utilCounts.high / utilCounts.total) * 100)}%)`}
                      ></div>
                      <div
                        className="seg-fill balanced"
                        style={{ width: `${(utilCounts.balanced / utilCounts.total) * 100}%` }}
                        title={`Balanced: ${utilCounts.balanced} vessels (${Math.round((utilCounts.balanced / utilCounts.total) * 100)}%)`}
                      ></div>
                      <div
                        className="seg-fill surplus"
                        style={{ width: `${(utilCounts.surplus / utilCounts.total) * 100}%` }}
                        title={`Surplus: ${utilCounts.surplus} vessels (${Math.round((utilCounts.surplus / utilCounts.total) * 100)}%)`}
                      ></div>
                    </>
                  )}
                </div>

                {/* Quick Demand Filter Pills */}
                <div className="demand-filter-pills-row">
                  <button
                    type="button"
                    className={`demand-filter-pill ${utilStatusFilter === "ALL" ? "active" : ""}`}
                    onClick={() => setUtilStatusFilter("ALL")}
                  >
                    All Vessels ({utilCounts.total})
                  </button>
                  <button
                    type="button"
                    className={`demand-filter-pill high ${utilStatusFilter === "HIGH_DEMAND" ? "active" : ""}`}
                    onClick={() => setUtilStatusFilter("HIGH_DEMAND")}
                  >
                    <Flame size={13} className="filter-pill-icon" /> Expansion Needed ({utilCounts.high})
                  </button>
                  <button
                    type="button"
                    className={`demand-filter-pill balanced ${utilStatusFilter === "BALANCED" ? "active" : ""}`}
                    onClick={() => setUtilStatusFilter("BALANCED")}
                  >
                    <Scale size={13} className="filter-pill-icon" /> Balanced Capacity ({utilCounts.balanced})
                  </button>
                  <button
                    type="button"
                    className={`demand-filter-pill surplus ${utilStatusFilter === "UNDERUTILIZED" ? "active" : ""}`}
                    onClick={() => setUtilStatusFilter("UNDERUTILIZED")}
                  >
                    <Anchor size={13} className="filter-pill-icon" /> Spare Capacity ({utilCounts.surplus})
                  </button>
                </div>
              </div>

              {/* Fleet Summary KPI Row */}
              <div className="util-kpi-grid">
                {/* 1. Average Seat Utilization */}
                <div className="util-kpi-card seat-fill">
                  <div className="util-kpi-header">
                    <span className="util-kpi-label">Average Seat Fill</span>
                    <div className="util-kpi-icon-badge sky">
                      <Gauge size={17} />
                    </div>
                  </div>
                  <div className="util-kpi-value-row">
                    <span className="util-kpi-value">{utilizationData.averagePassengerUtilization}%</span>
                  </div>
                  <div className="util-kpi-progress-wrapper">
                    <div className="util-kpi-progress-bar">
                      <div
                        className="util-kpi-progress-fill sky"
                        style={{ width: `${Math.min(100, utilizationData.averagePassengerUtilization)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="util-kpi-footer">
                    <span className="util-kpi-subtext">Overall fleet passenger seat fill rate</span>
                  </div>
                </div>

                {/* 2. Average Slot Utilization */}
                <div className="util-kpi-card slot-fill">
                  <div className="util-kpi-header">
                    <span className="util-kpi-label">Slot Utilization</span>
                    <div className="util-kpi-icon-badge amber">
                      <Clock size={17} />
                    </div>
                  </div>
                  <div className="util-kpi-value-row">
                    <span className="util-kpi-value">{utilizationData.averageSlotUtilization}%</span>
                  </div>
                  <div className="util-kpi-progress-wrapper">
                    <div className="util-kpi-progress-bar">
                      <div
                        className="util-kpi-progress-fill amber"
                        style={{ width: `${Math.min(100, utilizationData.averageSlotUtilization)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="util-kpi-footer">
                    <span className="util-kpi-subtext">4 daily departure slots baseline</span>
                  </div>
                </div>

                {/* 3. Expeditions Operated */}
                <div className="util-kpi-card expeditions">
                  <div className="util-kpi-header">
                    <span className="util-kpi-label">Fleet Expeditions</span>
                    <div className="util-kpi-icon-badge cyan">
                      <Ship size={17} />
                    </div>
                  </div>
                  <div className="util-kpi-value-row">
                    <span className="util-kpi-value">{utilizationData.fleetTotalTrips}</span>
                    <span className="util-kpi-unit">Voyages</span>
                  </div>
                  <div className="util-kpi-footer">
                    <span className="util-kpi-subtext">Confirmed & completed safari voyages</span>
                  </div>
                </div>

                {/* 4. Passengers Carried */}
                <div className="util-kpi-card passengers">
                  <div className="util-kpi-header">
                    <span className="util-kpi-label">Passengers Carried</span>
                    <div className="util-kpi-icon-badge purple">
                      <Users size={17} />
                    </div>
                  </div>
                  <div className="util-kpi-value-row">
                    <span className="util-kpi-value">{utilizationData.fleetTotalPassengers}</span>
                    <span className="util-kpi-unit">Guests</span>
                  </div>
                  <div className="util-kpi-footer">
                    <span className="util-kpi-subtext">Safari tourists transported safely</span>
                  </div>
                </div>

                {/* 5. Gross Vessel Revenue */}
                <div className="util-kpi-card revenue">
                  <div className="util-kpi-header">
                    <span className="util-kpi-label">Gross Vessel Revenue</span>
                    <div className="util-kpi-icon-badge gold">
                      <DollarSign size={17} />
                    </div>
                  </div>
                  <div className="util-kpi-value-row">
                    <span className="util-kpi-currency">LKR</span>
                    <span className="util-kpi-value gold">
                      {Number(utilizationData.fleetTotalRevenue).toLocaleString()}
                    </span>
                  </div>
                  <div className="util-kpi-footer">
                    <span className="util-kpi-subtext">Cumulative voyage earnings</span>
                  </div>
                </div>

                {/* 6. Active Operating Fleet */}
                <div className="util-kpi-card fleet">
                  <div className="util-kpi-header">
                    <span className="util-kpi-label">Active Operating Fleet</span>
                    <div className="util-kpi-icon-badge emerald">
                      <Anchor size={17} />
                    </div>
                  </div>
                  <div className="util-kpi-value-row">
                    <span className="util-kpi-value">{utilizationData.totalBoats}</span>
                    <span className="util-kpi-unit">Vessels</span>
                  </div>
                  <div className="util-kpi-footer">
                    <span className="util-kpi-subtext highlight-capacity">
                      {utilCounts.totalCapacity} Total Fleet Seats
                    </span>
                  </div>
                </div>
              </div>

              {/* Per-Boat Utilization Table & Visual Cards */}
              {/* Per-Boat Utilization Table & Visual Cards */}
              <div className="report-util-card" style={{ marginTop: "28px" }}>
                <div className="util-table-header-controls">
                  <div className="util-table-title-group">
                    <div className="table-title-badge-row">
                      <span className="table-title-icon-badge">
                        <Ship size={20} />
                      </span>
                      <div>
                        <h3>Individual Vessel Utilization & Capacity Breakdown</h3>
                        <span className="util-subtext">
                          Evaluate per-boat demand to identify bottlenecks, oversubscribed vessels, and underutilized assets.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="util-table-actions">
                    <div className="modern-search-box">
                      <Search size={15} className="search-icon-svg" />
                      <input
                        type="text"
                        placeholder="Search vessel by name, ID or type..."
                        value={utilSearch}
                        onChange={(e) => setUtilSearch(e.target.value)}
                        className="util-search-input"
                      />
                    </div>

                    <div className="sort-selector-wrapper">
                      <ArrowUpDown size={14} className="sort-icon-svg" />
                      <label htmlFor="utilSortSelect">Sort:</label>
                      <select
                        id="utilSortSelect"
                        value={utilSortBy}
                        onChange={(e) => setUtilSortBy(e.target.value)}
                        className="util-sort-select"
                      >
                        <option value="capacityUtil">Highest Seat Capacity Fill %</option>
                        <option value="slotUtil">Highest Time Slot Utilization %</option>
                        <option value="revenue">Highest Revenue Generated</option>
                        <option value="trips">Most Trips Operated</option>
                      </select>
                    </div>






















                  </div>
                </div>



















































































































































                {/* VIEW MODE B: VISUAL CARDS GRID */}

                  <div className="util-cards-grid">
                    {sortedBoatMetrics.length === 0 ? (
                      <div className="no-cards-placeholder">
                        🔍 No vessels match the selected filter criteria.
                      </div>
                    ) : (
                      sortedBoatMetrics.map((b) => (
                        <div key={b.boatId} className={`vessel-util-card ${b.resourceStatus?.toLowerCase()}`}>
                          <div className="vessel-card-header">
                            <div className="vessel-avatar-wrap">
                              <Ship size={20} className="vessel-card-svg" />
                            </div>
                            <div className="vessel-card-title-group">
                              <h4>{b.boatName}</h4>
                              <div className="vessel-tags-row">
                                <span className="vessel-id-badge">#{b.boatId}</span>
                                <span className="boat-type-chip">{b.boatType || "Standard"}</span>
                                <span className="capacity-pill">{b.capacity} Seats</span>
                              </div>
                            </div>
                            <span className={`status-badge ${b.status?.toLowerCase()}`}>
                              <span className="status-dot"></span>
                              {b.status || "AVAILABLE"}
                            </span>
                          </div>

                          {/* Gauge Metrics */}
                          <div className="card-gauges-section">
                            <div className="card-gauge-item">
                              <div className="gauge-label-row">
                                <span>Seat Capacity Fill Rate</span>
                                <strong className={`gauge-pct ${b.passengerCapacityUtilizationRate >= 75 ? "critical" : "optimal"}`}>
                                  {b.passengerCapacityUtilizationRate}%
                                </strong>
                              </div>
                              <div className="mini-progress-bar">
                                <div
                                  className={`mini-progress-fill ${
                                    b.passengerCapacityUtilizationRate >= 75
                                      ? "critical"
                                      : b.passengerCapacityUtilizationRate >= 40
                                      ? "optimal"
                                      : "surplus"
                                  }`}
                                  style={{ width: `${Math.min(100, b.passengerCapacityUtilizationRate)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="card-gauge-item">
                              <div className="gauge-label-row">
                                <span>Departure Slots Deployed</span>
                                <strong className="gauge-pct slot">
                                  {b.slotUtilizationRate}%
                                </strong>
                              </div>
                              <div className="mini-progress-bar">
                                <div
                                  className="mini-progress-fill slot"
                                  style={{ width: `${Math.min(100, b.slotUtilizationRate)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* Metric stats 3-grid */}
                          <div className="card-quick-stats-grid">
                            <div className="quick-stat-box">
                              <span className="qs-label">Expeditions</span>
                              <span className="qs-val">{b.activeTrips}</span>
                              {b.cancelledTrips > 0 && <span className="qs-sub">{b.cancelledTrips} can</span>}
                            </div>
                            <div className="quick-stat-box">
                              <span className="qs-label">Guests</span>
                              <span className="qs-val">{b.passengers}</span>
                              <span className="qs-sub">tourists</span>
                            </div>
                            <div className="quick-stat-box">
                              <span className="qs-label">Gross Revenue</span>
                              <span className="qs-val gold">LKR {Number(b.revenue).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="vessel-card-footer">
                            <div className="footer-status-row">
                              <span
                                className={`resource-badge ${
                                  b.resourceStatus === "HIGH_DEMAND"
                                    ? "high-demand"
                                    : b.resourceStatus === "BALANCED"
                                    ? "balanced"
                                    : "surplus"
                                }`}
                              >
                                {b.resourceStatus === "HIGH_DEMAND" ? (
                                  <Flame size={12} className="badge-icon-svg" />
                                ) : b.resourceStatus === "BALANCED" ? (
                                  <Scale size={12} className="badge-icon-svg" />
                                ) : (
                                  <Sparkles size={12} className="badge-icon-svg" />
                                )}
                                {b.resourceBadge}
                              </span>
                            </div>
                            <div className="recommendation-box card-rec">
                              {b.resourceStatus === "HIGH_DEMAND" ? (
                                <AlertTriangle size={15} className="rec-icon-svg high" />
                              ) : b.resourceStatus === "BALANCED" ? (
                                <CheckCircle2 size={15} className="rec-icon-svg balanced" />
                              ) : (
                                <Info size={15} className="rec-icon-svg surplus" />
                              )}
                              <span>{b.recommendation}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

              </div>

              <div className="report-doc-footer">
                <p>Confidential Operations Management Document - Fleet Capacity & Resource Allocation Analytics Engine</p>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default Report;
