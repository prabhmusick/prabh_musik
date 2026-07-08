"use client";

import Link from "next/link";
import { useAppShell } from "../contexts/app-shell-context";

export default function ProfilePage() {
  const { user, isAuthenticated, logout, purchasedBeats, wishlist, cart } = useAppShell();

  if (!isAuthenticated || !user) {
    return (
      <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, width: "100%", background: "#12141a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, textAlign: "center" }}>
          <h2 style={{ color: "#fff", marginBottom: 10 }}>Please sign in</h2>
          <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 18 }}>Create an account or log in to view your profile and saved beats.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <Link href="/login" style={{ background: "#d4820a", color: "#000", textDecoration: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 700 }}>Log in</Link>
            <Link href="/signup" style={{ background: "transparent", color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)", padding: "10px 16px", borderRadius: 8, fontWeight: 700 }}>Sign up</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "70vh", padding: "24px 20px 48px", background: "linear-gradient(180deg,#0b0d12 0%,#12141a 100%)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 20 }}>
        <section style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <img src={user.avatar || "https://api.dicebear.com/7.x/thumbs/svg?seed=producer"} alt={user.fullName} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }} />
            <div>
              <h1 style={{ color: "#fff", margin: 0 }}>{user.fullName}</h1>
              <p style={{ color: "rgba(255,255,255,0.65)", margin: "4px 0 0" }}>@{user.username}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", margin: "4px 0 0" }}>{user.email}</p>
            </div>
          </div>
          <button onClick={logout} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 999, padding: "10px 16px", cursor: "pointer" }}>Log out</button>
        </section>

        <section style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
            <h3 style={{ color: "#fff", marginTop: 0 }}>Purchased beats</h3>
            {purchasedBeats.length === 0 ? <p style={{ color: "rgba(255,255,255,0.6)" }}>No purchases yet.</p> : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{purchasedBeats.map((beat) => <div key={beat.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#fff" }}><span>{beat.title}</span><span style={{ color: "#fbbf24" }}>{beat.price ? `₹${beat.price.toLocaleString("en-IN")}` : "Free"}</span></div>)}</div>}
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
            <h3 style={{ color: "#fff", marginTop: 0 }}>Wishlist</h3>
            {wishlist.length === 0 ? <p style={{ color: "rgba(255,255,255,0.6)" }}>No saved beats.</p> : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{wishlist.map((beat) => <div key={beat.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#fff" }}><span>{beat.title}</span><span style={{ color: "#fbbf24" }}>{beat.price ? `₹${beat.price.toLocaleString("en-IN")}` : "Free"}</span></div>)}</div>}
          </div>
        </section>

        <section style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
          <h3 style={{ color: "#fff", marginTop: 0 }}>Cart summary</h3>
          <p style={{ color: "rgba(255,255,255,0.65)" }}>{cart.length} beats ready for checkout.</p>
        </section>
      </div>
    </div>
  );
}
