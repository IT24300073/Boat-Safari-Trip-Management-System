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

  // Fetch booking details
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

  // Print invoice locally
  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Invoice_${id}`,
  });

  // Download from backend as PDF
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
    return <p className="loading-text">Loading invoice...</p>;
  }

  if (!booking) {
    return <p className="error-text">Booking not found.</p>;
  }

  return (
    <div className="invoice-container">
      <div className="invoice-box" ref={invoiceRef}>
        {/* Close Button Top Right */}
        <button className="close-btn-top" onClick={() => navigate("/booktrip")}>
          ✖
        </button>

        <div className="invoice-header">
          <h1 className="invoice-title">Boat Safari Invoice</h1>
          <p className="invoice-date">{new Date(booking.safariDate).toLocaleDateString()}</p>
        </div>

        <hr className="divider" />

        <div className="invoice-section">
          <h2>Customer Details</h2>
          <p><strong>Name:</strong> {booking.name}</p>
          <p><strong>Email:</strong> {booking.email}</p>
        </div>

        <div className="invoice-section">
          <h2>Booking Details</h2>
          <p><strong>Invoice ID:</strong> {booking.id}</p>
          <p><strong>Boat:</strong> {booking.boat?.name || "N/A"}</p>
          <p><strong>Trip:</strong> {booking.trip?.name || "N/A"}</p>
          <p><strong>Adults:</strong> {booking.adults}</p>
          <p><strong>Children:</strong> {booking.children}</p>
          <p><strong>Total Price:</strong> LKR {Number(booking.totalPrice).toFixed(2)}</p>
        </div>

        <hr className="divider" />

        <p className="invoice-footer">
          Thank you for booking with <span className="highlight">Boat Safari</span>!
        </p>

        <div className="invoice-actions">
          <button className="action-btn" onClick={handlePrint}>
            Print Preview
          </button>

          <button
            className="action-btn"
            onClick={handleDownloadBackend}
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>

      {downloadError && (
        <p className="error-text">Error: {downloadError}</p>
      )}
    </div>
  );
}

export default Invoice;
