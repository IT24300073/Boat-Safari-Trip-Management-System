import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "../Styles/Report.css";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AdminNavbar from "../components/AdminNavbar";

const Report = () => {
  const [viewMode, setViewMode] = useState("OPERATIONS"); // "OPERATIONS", "RECONCILIATION"

  // Operations Dashboard State
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [analytics, setAnalytics] = useState(null);

  // Reconciliation State
  const [reconPeriod, setReconPeriod] = useState("month");
  const [reconStartDate, setReconStartDate] = useState("");
  const [reconEndDate, setReconEndDate] = useState("");
  const [reconPaymentMethod, setReconPaymentMethod] = useState("ALL");
  const [reconciliation, setReconciliation] = useState(null);

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

  useEffect(() => {
    if (viewMode === "OPERATIONS") {
      fetchAnalytics(period, startDate, endDate);
    } else {
      fetchReconciliation(reconStartDate, reconEndDate, reconPaymentMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, period]);

  const handleCustomSearch = (e) => {
    e.preventDefault();
    if (period === "custom") {
      fetchAnalytics("custom", startDate, endDate);
    }
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
      <AdminNavbar activeTab="reports" />
      <div className="report-header-bar">
        <div>
          <span className="report-badge">FINANCIAL & OPERATIONS AUDIT</span>
          <h1>
            {viewMode === "OPERATIONS"
              ? "Business Performance & Revenue Dashboard"
              : "Financial Payment Reconciliation Report"}
          </h1>
          <p className="header-subtext">
            {viewMode === "OPERATIONS"
              ? "Track confirmed bookings, gross revenue, passenger metrics, and trip cancellations in real time."
              : "Audit settled funds, track voided transactions, export CSV reconciliations, and review gateway distributions."}
          </p>
        </div>

        <div className="report-actions">
          {viewMode === "RECONCILIATION" && (
            <button className="btn-report-action csv-export" onClick={handleDownloadCsv}>
              📊 Export CSV Spreadsheet
            </button>
          )}
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
          className={`mode-tab-btn ${viewMode === "RECONCILIATION" ? "active" : ""}`}
          onClick={() => setViewMode("RECONCILIATION")}
        >
          💳 Payment Reconciliation & Audit
        </button>
      </div>

      {/* ==================== VIEW MODE 1: OPERATIONS DASHBOARD ==================== */}
      {viewMode === "OPERATIONS" && (
        <>
          {/* Period Filter Bar */}
          <div className="period-filter-container">
            <div className="filter-label-group">
              <span>📅 Select Time Period:</span>
            </div>

            <div className="period-pills-row">
              <button
                className={`period-pill ${period === "today" ? "active" : ""}`}
                onClick={() => setPeriod("today")}
              >
                Today
              </button>
              <button
                className={`period-pill ${period === "week" ? "active" : ""}`}
                onClick={() => setPeriod("week")}
              >
                This Week
              </button>
              <button
                className={`period-pill ${period === "month" ? "active" : ""}`}
                onClick={() => setPeriod("month")}
              >
                This Month
              </button>
              <button
                className={`period-pill ${period === "year" ? "active" : ""}`}
                onClick={() => setPeriod("year")}
              >
                This Year
              </button>
              <button
                className={`period-pill ${period === "custom" ? "active" : ""}`}
                onClick={() => setPeriod("custom")}
              >
                Custom Range
              </button>
            </div>

            {period === "custom" && (
              <form className="custom-range-inputs" onSubmit={handleCustomSearch}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-picker-input"
                  required
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-picker-input"
                  required
                />
                <button type="submit" className="btn-apply-range">
                  Apply Filter
                </button>
              </form>
            )}
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

      {/* ==================== VIEW MODE 2: PAYMENT RECONCILIATION ==================== */}
      {viewMode === "RECONCILIATION" && (
        <>
          {/* Reconciliation Filter Bar */}
          <div className="period-filter-container">
            <div className="filter-label-group">
              <span>💳 Quick Period:</span>
            </div>

            <div className="period-pills-row">
              <button
                className={`period-pill ${reconPeriod === "today" ? "active" : ""}`}
                onClick={() => handleReconPeriodChange("today")}
              >
                Today
              </button>
              <button
                className={`period-pill ${reconPeriod === "week" ? "active" : ""}`}
                onClick={() => handleReconPeriodChange("week")}
              >
                This Week
              </button>
              <button
                className={`period-pill ${reconPeriod === "month" ? "active" : ""}`}
                onClick={() => handleReconPeriodChange("month")}
              >
                This Month
              </button>
              <button
                className={`period-pill ${reconPeriod === "year" ? "active" : ""}`}
                onClick={() => handleReconPeriodChange("year")}
              >
                This Year
              </button>
              <button
                className={`period-pill ${reconPeriod === "all" ? "active" : ""}`}
                onClick={() => handleReconPeriodChange("all")}
              >
                All Time
              </button>
              <button
                className={`period-pill ${reconPeriod === "custom" ? "active" : ""}`}
                onClick={() => setReconPeriod("custom")}
              >
                Custom Range
              </button>
            </div>

            <form className="recon-inputs-row" onSubmit={handleReconSearch} style={{ marginTop: "14px" }}>
              <div className="input-with-label">
                <label>Start Date</label>
                <input
                  type="date"
                  value={reconStartDate}
                  onChange={(e) => setReconStartDate(e.target.value)}
                  className="date-picker-input"
                />
              </div>

              <div className="input-with-label">
                <label>End Date</label>
                <input
                  type="date"
                  value={reconEndDate}
                  onChange={(e) => setReconEndDate(e.target.value)}
                  className="date-picker-input"
                />
              </div>

              <div className="input-with-label">
                <label>Payment Gateway</label>
                <select
                  value={reconPaymentMethod}
                  onChange={(e) => handleGatewayChange(e.target.value)}
                  className="select-filter-input"
                >
                  <option value="ALL">All Payment Gateways</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="PAYPAL">PayPal Digital Wallet</option>
                  <option value="CASH">Cash On Arrival</option>
                </select>
              </div>

              <button type="submit" className="btn-apply-range">
                🔍 Filter Transactions
              </button>
            </form>
          </div>

          {loading ? (
            <div className="report-loading-state">
              <div className="spinner"></div>
              <p>Reconciling transaction records & verifying financial ledger...</p>
            </div>
          ) : reconciliation ? (
            <div className="report-document-card" ref={reportRef}>
              <div className="doc-header">
                <div>
                  <h2>FINANCE EXECUTIVE RECONCILIATION AUDIT</h2>
                  <p className="doc-title">
                    Official Payment Reconciliation Statement ({reconciliation.startDate} to {reconciliation.endDate})
                  </p>
                </div>
                <div className="doc-timestamp">
                  <span>Reconciliation Date:</span>
                  <strong>{new Date().toLocaleString()}</strong>
                </div>
              </div>

              {/* Payment Gateway Summary Cards */}
              <div className="report-kpi-grid">
                <div className="kpi-card blue">
                  <span className="kpi-icon">💳</span>
                  <span className="kpi-title">Credit / Debit Cards</span>
                  <span className="kpi-value">LKR {Number(reconciliation.cardRevenue || 0).toLocaleString()}</span>
                  <span className="kpi-subtext">{reconciliation.cardCount || 0} Settled Transactions</span>
                </div>

                <div className="kpi-card cyan">
                  <span className="kpi-icon">🅿️</span>
                  <span className="kpi-title">PayPal Digital Wallet</span>
                  <span className="kpi-value">LKR {Number(reconciliation.paypalRevenue || 0).toLocaleString()}</span>
                  <span className="kpi-subtext">{reconciliation.paypalCount || 0} Settled Transactions</span>
                </div>

                <div className="kpi-card emerald">
                  <span className="kpi-icon">💵</span>
                  <span className="kpi-title">Cash On Arrival</span>
                  <span className="kpi-value">LKR {Number(reconciliation.cashRevenue || 0).toLocaleString()}</span>
                  <span className="kpi-subtext">{reconciliation.cashCount || 0} Settled Transactions</span>
                </div>

                <div className="kpi-card amber">
                  <span className="kpi-icon">🏦</span>
                  <span className="kpi-title">Total Settled Funds</span>
                  <span className="kpi-value">LKR {Number(reconciliation.totalReconciledRevenue || 0).toLocaleString()}</span>
                  <span className="kpi-subtext">{reconciliation.totalSettledCount || 0} Cleared Funds</span>
                </div>

                {reconciliation.cancelledRevenue > 0 && (
                  <div className="kpi-card red">
                    <span className="kpi-icon">🚫</span>
                    <span className="kpi-title">Voided / Cancelled</span>
                    <span className="kpi-value">LKR {Number(reconciliation.cancelledRevenue || 0).toLocaleString()}</span>
                    <span className="kpi-subtext">{reconciliation.cancelledCount || 0} Void Transactions</span>
                  </div>
                )}
              </div>

              {/* Transaction Ledger Table */}
              <div className="report-table-section">
                <h3>Transaction Settlement Ledger ({reconciliation.totalTransactionsCount} Records)</h3>
                <table className="report-data-table">
                  <thead>
                    <tr>
                      <th>Transaction Ref</th>
                      <th>Invoice ID</th>
                      <th>Customer Name</th>
                      <th>Email</th>
                      <th>Safari Date</th>
                      <th>Gateway Method</th>
                      <th>Status</th>
                      <th>Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!reconciliation.transactions || reconciliation.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "24px" }}>
                          No payment transactions recorded for selected criteria ({reconciliation.startDate} to {reconciliation.endDate}).
                        </td>
                      </tr>
                    ) : (
                      reconciliation.transactions.map((t) => {
                        const isCancelled = t.bookingStatus === "CANCELLED" || t.paymentStatus === "REFUNDED";
                        return (
                          <tr key={t.id}>
                            <td>
                              <span className="txn-ref-badge">
                                {t.transactionReference || `TXN-${t.id}84920`}
                              </span>
                            </td>
                            <td>#{t.id}</td>
                            <td><strong>{t.name}</strong></td>
                            <td>{t.email}</td>
                            <td>{t.safariDate}</td>
                            <td>
                              <span className="gateway-badge">
                                {t.paymentMethod ? t.paymentMethod.toUpperCase() : "CARD"}
                              </span>
                            </td>
                            <td>
                              {isCancelled ? (
                                <div>
                                  <span className="status-cancelled">❌ Cancelled / Void</span>
                                  {t.cancelReason && (
                                    <div className="cancel-reason-note">{t.cancelReason}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="status-confirmed">✓ Settled</span>
                              )}
                            </td>
                            <td>
                              {isCancelled ? (
                                <span className="amount-void" title="Void transaction - excluded from settled funds">
                                  LKR {Number(t.totalPrice).toLocaleString()}
                                </span>
                              ) : (
                                <strong>LKR {Number(t.totalPrice).toLocaleString()}</strong>
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
                <p>Confidential Audit Document - Verified by ALOKA Boat Safari Financial Settlement Engine</p>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default Report;
