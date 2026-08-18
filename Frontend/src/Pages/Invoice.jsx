import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import "../Styles/Invoice.css";

function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [downloadError, setDownloadError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const invoiceRef = useRef();

  useEffect(() => {
    setLoadingBooking(true);
    fetch(`http://localhost:8080/api/bookings/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Booking not found");
        return res.json();
      })
      .then((data) => setBooking(data))
      .catch((err) => console.error("Error fetching booking:", err))
      .finally(() => setLoadingBooking(false));
  }, [id]);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `ALOKA_Safari_Invoice_${id}`,
  });

  const handleDownloadBackend = () => {
    setDownloading(true);
    setDownloadError(null);

    fetch(`http://localhost:8080/api/invoices/download/${id}`)
      .then((response) => {
        if (!response.ok) {
          return response.text().then((msg) => {
            throw new Error(msg || "Failed to download invoice");
          });
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((error) => setDownloadError(error.message))
      .finally(() => setDownloading(false));
  };

  if (loadingBooking) {
    return (
      <div className="invoice-loading-screen">
        <div className="spinner"></div>
        <p>Generating your safari invoice...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="invoice-loading-screen">
        <div className="error-icon">❌</div>
        <p>Booking reservation record not found.</p>
        <button className="btn-return-home" onClick={() => navigate("/booktrip")}>
          Return to Safari Booking
        </button>
      </div>
    );
  }

  return (
    <div className="invoice-page-wrapper">
      <div className="invoice-card-container" ref={invoiceRef}>
        <button className="close-invoice-btn" onClick={() => navigate("/booktrip")} title="Close Invoice">
          ✕
        </button>

        {/* Invoice Header */}
        <div className="invoice-card-header">
          <div className="invoice-brand">
            <span className="brand-logo-icon">🚤</span>
            <div>
              <h2>ALOKA SAFARI</h2>
              <span className="brand-tagline">Official Booking Reservation Invoice</span>
            </div>
          </div>
          <div className="invoice-meta-badge">
            <span className="invoice-id-tag">INVOICE #{booking.id}</span>
            <span className="invoice-date-tag">Date: {new Date(booking.safariDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="invoice-divider"></div>

        {/* Customer & Trip Details Grid */}
        <div className="invoice-details-grid">
          <div className="details-box">
            <h3>👤 Customer Information</h3>
            <p><strong>Passenger Name:</strong> {booking.name}</p>
            <p><strong>Email Address:</strong> {booking.email}</p>
            <p><strong>Payment Status:</strong> <span className="status-paid">✓ Confirmed</span></p>
          </div>

          <div className="details-box">
            <h3>⚓ Reservation Specifications</h3>
            <p><strong>Boat Assigned:</strong> {booking.boat?.name || "Standard Boat"} ({booking.boat?.boatType || "Luxury"})</p>
            <p><strong>Trip Experience:</strong> {booking.trip?.name || "Custom Safari"}</p>
            <p><strong>Adult Passengers:</strong> {booking.adults}</p>
            <p><strong>Child Passengers:</strong> {booking.children}</p>
          </div>
        </div>

        {/* Total Price Banner */}
        <div className="invoice-total-card">
          <span className="total-label">Total Amount Paid</span>
          <span className="total-value">LKR {Number(booking.totalPrice).toFixed(2)}</span>
        </div>

        <div className="invoice-card-footer">
          <p>Thank you for choosing <strong className="highlight">ALOKA Safari</strong> for your water adventure!</p>
          <span className="footer-contact">For inquiries, present Invoice #{booking.id} to your captain.</span>
        </div>

        <div className="invoice-actions-bar">
          <button className="btn-invoice-action print" onClick={handlePrint}>
            🖨️ Print Invoice Preview
          </button>

          <button
            className="btn-invoice-action download"
            onClick={handleDownloadBackend}
            disabled={downloading}
          >
            {downloading ? "Downloading PDF..." : "📥 Download Official PDF"}
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="invoice-error-alert">Error: {downloadError}</div>
      )}
    </div>
  );
}

export default Invoice;

