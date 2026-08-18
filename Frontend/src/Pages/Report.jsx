import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../Styles/Report.css";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Report = () => {
  const [report, setReport] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef();

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/bookings")
      .then((res) => {
        setBookings(res.data || []);
      })
      .catch((err) => console.error("Error fetching bookings:", err));
  }, []);

  const generateReport = () => {
    setLoading(true);
    axios
      .post("http://localhost:8080/api/reports/generate")
      .then((res) => {
        setReport(res.data);
      })
      .catch((err) => console.error("Error generating report:", err))
      .finally(() => setLoading(false));
  };

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: "Boat_Safari_Booking_Report",
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
    pdf.save("Boat_Safari_Booking_Report.pdf");
  };

  return (
    <div className="report-page-wrapper">
      <div className="report-header-bar">
        <div>
          <span className="report-badge">ANALYTICS & REPORTS</span>
          <h1>Boat Safari Revenue Report</h1>
        </div>

        <div className="report-actions">
          <button className="btn-report-action primary" onClick={generateReport} disabled={loading}>
            {loading ? "Generating..." : "⚡ Generate & Save Report"}
          </button>
          {report && (
            <>
              <button className="btn-report-action secondary" onClick={handlePrint}>
                🖨️ Print PDF
              </button>
              <button className="btn-report-action outline" onClick={handleDownload}>
                📥 Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {report ? (
        <div className="report-document-card" ref={reportRef}>
          {/* Document Header */}
          <div className="doc-header">
            <div>
              <h2>ALOKA SAFARI MANAGEMENT</h2>
              <p className="doc-title">Comprehensive Safari Booking Report</p>
            </div>
            <div className="doc-timestamp">
              <span>Generated At:</span>
              <strong>{new Date(report.generatedAt).toLocaleString()}</strong>
            </div>
          </div>

          {/* Summary Metric KPI Cards */}
          <div className="report-kpi-grid">
            <div className="kpi-card blue">
              <span className="kpi-title">Total Reservations</span>
              <span className="kpi-value">{report.totalBookings}</span>
            </div>
            <div className="kpi-card cyan">
              <span className="kpi-title">Adult Passengers</span>
              <span className="kpi-value">{report.totalAdults}</span>
            </div>
            <div className="kpi-card emerald">
              <span className="kpi-title">Child Passengers</span>
              <span className="kpi-value">{report.totalChildren}</span>
            </div>
            <div className="kpi-card amber">
              <span className="kpi-title">Total Revenue</span>
              <span className="kpi-value">LKR {report.totalRevenue.toFixed(2)}</span>
            </div>
          </div>

          {/* Detailed Data Table */}
          <div className="report-table-section">
            <h3>Detailed Booking Records</h3>
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Safari Date</th>
                  <th>Adults</th>
                  <th>Children</th>
                  <th>Total Price</th>
                  <th>Boat</th>
                  <th>Trip</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "24px" }}>
                      No bookings recorded in system database.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id}>
                      <td>#{b.id}</td>
                      <td><strong>{b.name}</strong></td>
                      <td>{b.email}</td>
                      <td>{b.safariDate}</td>
                      <td>{b.adults}</td>
                      <td>{b.children}</td>
                      <td>LKR {b.totalPrice}</td>
                      <td>{b.boat?.name || "N/A"}</td>
                      <td>{b.trip?.name || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="report-doc-footer">
            <p>Official report generated by ALOKA Boat Safari Admin System</p>
          </div>
        </div>
      ) : (
        <div className="report-empty-placeholder">
          <div className="placeholder-icon">📊</div>
          <h3>No Active Report Generated</h3>
          <p>Click the <strong>"Generate & Save Report"</strong> button above to calculate current revenue, guest metrics, and booking tallies.</p>
        </div>
      )}
    </div>
  );
};

export default Report;

