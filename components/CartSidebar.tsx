"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAppShell } from "../app/contexts/app-shell-context";

export function CartSidebar() {
  const router = useRouter();
  const { cart, cartOpen, closeCart, removeFromCart, clearCart } = useAppShell();

  const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  const itemCount = cart.length;

  if (!cartOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 120,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={closeCart}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(450px, 100%)",
          height: "100%",
          background: "linear-gradient(180deg, #0f1117 0%, #0b0d12 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "-16px 0 45px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>
              Your Cart
            </h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
              {itemCount} {itemCount === 1 ? "beat" : "beats"} selected
            </p>
          </div>
          <button
            onClick={closeCart}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 24,
              padding: 0,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {itemCount === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
                padding: "40px 20px",
              }}
            >
              <div>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
                <p style={{ margin: 0, fontSize: 14 }}>Your cart is empty</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  Browse beats and add them to your cart
                </p>
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  gap: "12px",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                }}
              >
                {/* Image */}
                <img
                  src={item.cover}
                  alt={item.title}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "8px",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 12,
                      marginBottom: 6,
                    }}
                  >
                    by {item.producer}
                  </div>
                  {item.genre && (
                    <div
                      style={{
                        display: "inline-block",
                        background: "rgba(212,130,10,0.15)",
                        color: "#fbbf24",
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {item.genre}
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      color: "#fbbf24",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    ₹{item.price?.toLocaleString("en-IN")}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{
                      background: "rgba(255,68,68,0.1)",
                      border: "1px solid rgba(255,68,68,0.2)",
                      color: "#ff8888",
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,68,68,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,68,68,0.1)";
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {itemCount > 0 && (
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "16px 24px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Summary */}
            <div
              style={{
                background: "rgba(212,130,10,0.08)",
                border: "1px solid rgba(212,130,10,0.15)",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 12,
                  marginBottom: 6,
                }}
              >
                <span>Subtotal</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 12,
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom: "1px solid rgba(212,130,10,0.2)",
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
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                <span>Total</span>
                <span style={{ color: "#fbbf24" }}>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => {
                router.push("/checkout");
                closeCart();
              }}
              style={{
                background: "#d4820a",
                border: "none",
                color: "#000",
                fontWeight: 700,
                borderRadius: "8px",
                padding: "12px 16px",
                cursor: "pointer",
                fontSize: 14,
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#e8920a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#d4820a";
              }}
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
                borderRadius: "8px",
                padding: "10px 16px",
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
