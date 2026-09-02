"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppShell } from "../contexts/app-shell-context";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, cart, checkoutCart } = useAppShell();

  if (!isAuthenticated || !user) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#12141a",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#fff", marginBottom: 10 }}>Please sign in</h2>
          <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 18 }}>
            Sign in to proceed with checkout.
          </p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#12141a",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#fff", marginBottom: 10 }}>
            Your cart is empty
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 18 }}>
            Add some beats to get started.
          </p>
          <button
            onClick={() => router.push("/beat")}
            style={{
              background: "#d4820a",
              color: "#000",
              border: "none",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Browse Beats
          </button>
        </div>
      </div>
    );
  }

  return (
    <CheckoutForm cart={cart} user={user} onCheckoutComplete={checkoutCart} />
  );
}

function CheckoutForm({ cart, user, onCheckoutComplete }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(user?.fullName || "");

  const total = cart.reduce(
    (sum: number, item: any) => sum + (item.price || 0),
    0,
  );
  const totalInPaise = Math.round(total * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.BACKEND_PUBLIC_URL ||
        "http://localhost:5005";
      const response = await fetch(
        `${API_BASE}/api/payments/create-checkout-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalInPaise,
            currency: "INR",
            email,
            beats: cart.map((b: any) => ({
              id: b.id,
              title: b.title,
              price: b.price,
            })),
          }),
        },
      );

      const paymentData = await response.json();

      if (!response.ok) {
        throw new Error(
          paymentData?.error?.message ||
            paymentData?.error ||
            "Payment processing failed",
        );
      }

      // Only mark checkout complete after payment success. Do not clear cart before opening Razorpay.
      if (typeof window !== "undefined" && paymentData.keyId) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          const Razorpay = (window as any).Razorpay;
          const options = {
            key: paymentData.keyId,
            amount: paymentData.amount,
            currency: paymentData.currency || "INR",
            name: "Prabh Musik",
            description: "Beat purchase",
            order_id: paymentData.orderId,
            handler: (response: any) => {
              // Successful payment handler from Razorpay
              try {
                onCheckoutComplete();
              } catch (e) {
                // ignore errors from checkout completion side-effects
              }
              // Redirect to profile after marking purchase
              window.location.href = "/profile?payment=success";
            },
            // Optional: handle payment failures to show message without redirect
            modal: {
              ondismiss: () => {
                // user dismissed the widget; keep cart intact
              },
            },
            prefill: {
              email,
              name,
            },
            theme: {
              color: "#d4820a",
            },
          };
          const rzp = new Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        // Fallback redirect flow (no client-side Razorpay key provided)
        window.location.href = paymentData.url || "/profile?payment=success";
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-wrapper">
        <div className="checkout-grid">
          {/* Left: Checkout Form */}
          <div>
            <h1 className="checkout-h1">Checkout</h1>

            <form onSubmit={handleSubmit} className="checkout-form">
              {/* Contact Info */}
              <section className="card">
                <h2 className="section-title">Contact Information</h2>
                <div className="form-row">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="checkout-input"
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="checkout-input"
                  />
                </div>
              </section>

              {/* Payment Info */}
              <section className="card">
                <h2 className="section-title">Payment Details</h2>
                <div
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: 14,
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: 1.5,
                  }}
                >
                  You will be redirected to Razorpay where you can pay with
                  cards, UPI, wallets, and other supported methods.
                </div>
              </section>

              {error && (
                <div
                  style={{
                    background: "rgba(255,68,68,0.1)",
                    border: "1px solid rgba(255,68,68,0.3)",
                    borderRadius: 8,
                    padding: 12,
                    color: "#ff8888",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Mobile inline order summary shown above the Pay button */}
              <div className="order-summary-mobile card">
                <h3
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    margin: 0,
                    marginBottom: 8,
                  }}
                >
                  Order Summary
                </h3>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {cart.map((item: any) => (
                    <div
                      key={item.id}
                      className="cart-item"
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <img src={item.cover} alt={item.title} />
                      <div style={{ flex: 1 }}>
                        <div className="title">{item.title}</div>
                        <div className="meta">{item.producer || "Unknown"}</div>
                      </div>
                      <div style={{ color: "#fbbf24", fontWeight: 700 }}>
                        ₹{item.price?.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 13,
                    }}
                  >
                    <span>Subtotal</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="checkout-pay-button"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading
                  ? "Processing..."
                  : `Pay ₹${total.toLocaleString("en-IN")}`}
              </button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="order-summary-wrapper">
            <div className="order-summary-inner card">
              <h2
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Order Summary
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  maxHeight: 300,
                  overflowY: "auto",
                }}
              >
                {cart.map((item: any) => (
                  <div
                    key={item.id}
                    className="cart-item"
                    style={{
                      display: "flex",
                      gap: 12,
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      paddingBottom: 12,
                    }}
                  >
                    <img
                      src={item.cover}
                      alt={item.title}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}
                      >
                        {item.producer}
                      </div>
                    </div>
                    <div
                      style={{
                        color: "#fbbf24",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      ₹{item.price?.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 13,
                  }}
                >
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 13,
                  }}
                >
                  <span>Tax (0%)</span>
                  <span>₹0</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    paddingTop: 8,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(212,130,10,0.1)",
                  border: "1px solid rgba(212,130,10,0.2)",
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 12,
                  color: "#fbbf24",
                }}
              >
                💡 Razorpay will show supported methods like cards, UPI,
                wallets, and more based on your region and Razorpay account
                setup.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
