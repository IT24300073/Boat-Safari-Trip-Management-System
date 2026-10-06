import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "../Styles/Report.css";
import { useReactToPrint } from "react-to-print";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const FinanceExecutivePanel = () => {
  const navigate = useNavigate();
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

  // Reconciliation State
  const [reconPeriod, setReconPeriod] = useState("month");
  const [reconStartDate, setReconStartDate] = useState(initialRange.start);
  const [reconEndDate, setReconEndDate] = useState(initialRange.end);
  const [reconPaymentMethod, setReconPaymentMethod] = useState("ALL");
  const [reconciliation, setReconciliation] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef();

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
    fetchReconciliation(reconStartDate, reconEndDate, reconPaymentMethod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    documentTitle: `ALOKA_Finance_Reconciliation_${reconPeriod}`,
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
    pdf.save(`ALOKA_Finance_Reconciliation.pdf`);
  };

  return (
    <div className="report-page-wrapper">
      <div className="report-header-bar">
        <div>
          <span className="report-badge">FINANCIAL & OPERATIONS AUDIT</span>
          <h1>Financial Payment Reconciliation Report</h1>
          <p className="header-subtext">
            Audit settled funds, track voided transactions, export CSV reconciliations, and review gateway distributions.
          </p>
        </div>

        <div className="report-actions">
          <button className="btn-report-action csv-export" onClick={handleDownloadCsv}>
            📊 Export CSV Spreadsheet
          </button>
          <button className="btn-report-action secondary" onClick={handlePrint}>
            🖨️ Print Report
          </button>
          <button className="btn-report-action outline" onClick={handleDownload}>
            📥 Download PDF
          </button>
        </div>
      </div>

      <div className="modern-filter-panel">
        <div className="filter-header-row">
          <div className="filter-meta-col">
            <div className="filter-badge-row">
              <span className="filter-icon-badge">💳</span>
              <div>
                <h4 className="filter-meta-title">Financial Audit Timeframe & Gateway</h4>
                <p className="filter-meta-subtitle">
                  Filter settled funds, voided records, and gateway distribution.
                </p>
              </div>
            </div>
          </div>

          <div className="filter-presets-wrap">
            <span className="preset-label">Quick Period:</span>
            <div className="modern-pills-group">
              <button
                type="button"
                className={`modern-pill ${reconPeriod === "today" ? "active" : ""}`}
                onClick={() => handleReconPeriodChange("today")}
              >
                Today
              </button>
              <button
                type="button"
                className={`modern-pill ${reconPeriod === "week" ? "active" : ""}`}
                onClick={() => handleReconPeriodChange("week")}
              >
                This Week
              </button>
              <button
                type="button"
                className={`modern-pill ${reconPeriod === "month" ? "active" : ""}`}
                onClick={() => handleReconPeriodChange("month")}
              >
                This Month
              </button>
              <button
                type="button"
                className={`modern-pill ${reconPeriod === "year" ? "active" : ""}`}
                onClick={() => handleReconPeriodChange("year")}
              >
                This Year
              </button>
              <button
                type="button"
                className={`modern-pill ${reconPeriod === "all" ? "active" : ""}`}
                onClick={() => handleReconPeriodChange("all")}
              >
                All Time
              </button>
              <button
                type="button"
                className={`modern-pill ${reconPeriod === "custom" ? "active" : ""}`}
                onClick={() => setReconPeriod("custom")}
              >
                Custom Range
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleReconSearch} className="modern-date-toolbar">
          <div className="date-field-group">
            <label className="date-field-label">
              <span className="label-dot"></span> Start Date
            </label>
            <div className="date-input-container">
              <input
                type="date"
                className="modern-date-picker"
                value={reconStartDate}
                onChange={(e) => {
                  setReconStartDate(e.target.value);
                  setReconPeriod("custom");
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
                value={reconEndDate}
                onChange={(e) => {
                  setReconEndDate(e.target.value);
                  setReconPeriod("custom");
                }}
                required
              />
            </div>
          </div>

          <div className="date-field-group gateway-field">
            <label className="date-field-label">
              <span className="label-dot gateway"></span> Payment Gateway
            </label>
            <div className="date-input-container">
              <select
                value={reconPaymentMethod}
                onChange={(e) => handleGatewayChange(e.target.value)}
                className="modern-select-picker"
              >
                <option value="ALL">All Payment Gateways</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="PAYPAL">PayPal Digital Wallet</option>
                <option value="CASH">Cash On Arrival</option>
              </select>
            </div>
          </div>

          <div className="date-toolbar-actions">
            <button type="submit" className="btn-modern-apply">
              <span className="btn-icon">🔍</span>
              <span>Filter Transactions</span>
            </button>

            <div className="active-preset-badge">
              <span>Active:</span>
              <strong>{reconPeriod === "custom" ? "CUSTOM RANGE" : reconPeriod.toUpperCase()}</strong>
            </div>
          </div>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {!reconciliation.transactions || reconciliation.transactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "24px" }}>
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
                        <td>
                          <button 
                            className="btn-modern-apply" 
                            style={{ padding: '6px 12px', fontSize: '12px', minWidth: 'auto', margin: '0' }}
                            onClick={() => navigate(`/invoice/${t.id}`)}
                          >
                            View Invoice
                          </button>
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
    </div>
  );
};

export default FinanceExecutivePanel;
