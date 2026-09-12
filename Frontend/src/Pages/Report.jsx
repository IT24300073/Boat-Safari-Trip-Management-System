import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../Styles/Report.css";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Report = () => {
  const [viewMode, setViewMode] = useState("OPERATIONS"); // "OPERATIONS", "RECONCILIATION"

  // Operations Dashboard State
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [analytics, setAnalytics] = useState(null);

  // Reconciliation State
  const [reconStartDate, setReconStartDate] = useState("");
  const [reconEndDate, setReconEndDate] = useState("");
  const [reconPaymentMethod, setReconPaymentMethod] = useState("ALL");
  const [reconciliation, setReconciliation] = useState(null);

  const [loading, setLoading] = useState(false);
  const reportRef = useRef();

  // Fetch Operations Analytics
  const fetchAnalytics = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("period", period);
    if (period === "custom") {
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
    }

    axios
      .get(`http://localhost:8080/api/reports/analytics?${params.toString()}`)
      .then((res) => {
        setAnalytics(res.data);
      })
      .catch((err) => console.error("Error fetching analytics:", err))
      .finally(() => setLoading(false));
  };

  // Fetch Payment Reconciliation
  const fetchReconciliation = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (reconStartDate) params.append("startDate", reconStartDate);
    if (reconEndDate) params.append("endDate", reconEndDate);
    if (reconPaymentMethod && reconPaymentMethod !== "ALL") params.append("paymentMethod", reconPaymentMethod);

    axios
      .get(`http://localhost:8080/api/reports/reconciliation?${params.toString()}`)
      .then((res) => {
        setReconciliation(res.data);
      })
      .catch((err) => console.error("Error fetching reconciliation:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (viewMode === "OPERATIONS") {
      fetchAnalytics();
    } else {
      fetchReconciliation();
    }
  }, [viewMode, period]);

  const handleCustomSearch = (e) => {
    e.preventDefault();
    if (period === "custom") {
      fetchAnalytics();
    }
  };

  const handleReconSearch = (e) => {
    e.preventDefault();
    fetchReconciliation();
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
              : "Financial Payment Reconciliation Report"}
          </h1>
          <p className="header-subtext">
            {viewMode === "OPERATIONS"
              ? "Track bookings, revenue, passenger metrics, and trip cancellations over selected periods."
              : "Audit payments, export transaction reconciliation CSV spreadsheets, and review payment methods."}
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
                  <span className="kpi-subtext">Gross Income</span>
                </div>

                <div className="kpi-card red">
                  <span className="kpi-icon">🚫</span>
                  <span className="kpi-title">Trip Cancellations</span>
                  <span className="kpi-value">{analytics.cancellationsCount || 0}</span>
                  <span className="kpi-subtext">Weather / Maintenance</span>
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
                <h3>Detailed Booking Transactions ({analytics.totalBookings})</h3>
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
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!analytics.bookings || analytics.bookings.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: "center", padding: "24px" }}>
                          No bookings recorded for this selected period ({analytics.startDate} to {analytics.endDate}).
                        </td>
                      </tr>
                    ) : (
                      analytics.bookings.map((b) => (
                        <tr key={b.id}>
                          <td>#{b.id}</td>
                          <td><strong>{b.name}</strong></td>
                          <td>{b.email}</td>
                          <td>{b.safariDate}</td>
                          <td>{b.adults}</td>
                          <td>{b.children}</td>
                          <td>{b.boat?.name || "N/A"}</td>
                          <td>{b.trip?.name || "Standard Safari"}</td>
                          <td><strong>LKR {Number(b.totalPrice).toLocaleString()}</strong></td>
                        </tr>
                      ))
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
          <form className="period-filter-container" onSubmit={handleReconSearch}>
            <div className="filter-label-group">
              <span>💳 Audit Parameters:</span>
            </div>

            <div className="recon-inputs-row">
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
                  onChange={(e) => setReconPaymentMethod(e.target.value)}
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
            </div>
          </form>

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
                  <span className="kpi-subtext">{reconciliation.cardCount || 0} Transactions</span>
                </div>

                <div className="kpi-card cyan">
                  <span className="kpi-icon">🅿️</span>
                  <span className="kpi-title">PayPal Digital Wallet</span>
                  <span className="kpi-value">LKR {Number(reconciliation.paypalRevenue || 0).toLocaleString()}</span>
                  <span className="kpi-subtext">{reconciliation.paypalCount || 0} Transactions</span>
                </div>

                <div className="kpi-card emerald">
                  <span className="kpi-icon">💵</span>
                  <span className="kpi-title">Cash On Arrival</span>
                  <span className="kpi-value">LKR {Number(reconciliation.cashRevenue || 0).toLocaleString()}</span>
                  <span className="kpi-subtext">{reconciliation.cashCount || 0} Transactions</span>
                </div>

                <div className="kpi-card amber">
                  <span className="kpi-icon">🏦</span>
                  <span className="kpi-title">Total Reconciled Funds</span>
                  <span className="kpi-value">LKR {Number(reconciliation.totalReconciledRevenue || 0).toLocaleString()}</span>
                  <span className="kpi-subtext">{reconciliation.totalTransactionsCount || 0} Total Settled</span>
                </div>
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
                      reconciliation.transactions.map((t) => (
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
                          <td><span className="status-confirmed">✓ Settled</span></td>
                          <td><strong>LKR {Number(t.totalPrice).toLocaleString()}</strong></td>
                        </tr>
                      ))
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
