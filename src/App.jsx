import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIxQAyctGsIspuNJmT5sRa6C5R7u68ADw",
  authDomain: "mariage-gabriella-deogratias.firebaseapp.com",
  projectId: "mariage-gabriella-deogratias",
  storageBucket: "mariage-gabriella-deogratias.firebasestorage.app",
  messagingSenderId: "284964359203",
  appId: "1:284964359203:web:aaa381a2ea3e2d4d847596"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const C = {
  bg: "#0F1117",
  card: "#161822",
  cardHover: "#1E2030",
  gold: "#C9A84C",
  goldLight: "#E2D4A0",
  green: "#4CAF7A",
  red: "#E06B6B",
  blush: "#D4908A",
  text: "#E8E4DC",
  textSoft: "#8A8578",
  border: "#2A2D3A",
  accent1: "#C9A84C",
  accent2: "#4CAF7A",
  accent3: "#7B8FD4",
  accent4: "#D4908A",
  accent5: "#6BBFCF",
  accent6: "#C88ADB",
};

const PIE_COLORS = [C.accent1, C.accent2, C.accent3, C.accent4, C.accent5, C.accent6, "#E8A44A", "#5DB88A"];

function processData(responses, visits) {
  const allGuests = [];
  let acceptedCount = 0;
  let refusedCount = 0;
  const drinkMap = {};
  const allergenMap = {};
  const songs = [];

  responses.forEach((r) => {
    if (r.accepted) {
      acceptedCount += r.guests.length;
      r.guests.forEach((g) => {
        allGuests.push({ ...g, accepted: true, date: r.timestamp });
        g.drinks.forEach((d) => { drinkMap[d] = (drinkMap[d] || 0) + 1; });
        g.allergies.forEach((a) => { if (a !== "Aucune allergie") allergenMap[a] = (allergenMap[a] || 0) + 1; });
        if (g.song) songs.push({ name: g.name, song: g.song });
      });
    } else {
      refusedCount += r.guests?.length || 1;
      r.guests?.forEach((g) => allGuests.push({ ...g, accepted: false, date: r.timestamp }));
    }
  });

  const drinkData = Object.entries(drinkMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  const allergenData = Object.entries(allergenMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  const attendanceData = [
    { name: "Présents", value: acceptedCount },
    { name: "Absents", value: refusedCount },
  ];

  return { allGuests, acceptedCount, refusedCount, drinkData, allergenData, attendanceData, songs, totalResponses: responses.length, visits };
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      background: C.card, borderRadius: 16, padding: "24px 22px", border: `1px solid ${C.border}`,
      position: "relative", overflow: "hidden", flex: "1 1 180px", minWidth: 160,
    }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${color}12` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
        <div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: C.textSoft, margin: 0, letterSpacing: 1, textTransform: "uppercase" }}>{label}</p>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, color: color, margin: "2px 0 0", fontWeight: 400 }}>{value}</p>
          {sub && <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: C.textSoft, margin: "2px 0 0" }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: C.text, margin: 0 }}>
        <strong style={{ color: C.gold }}>{payload[0].name || payload[0].payload?.name}</strong> : {payload[0].value}
      </p>
    </div>
  );
}

function GuestTable({ guests }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? guests : guests.filter((g) => g.accepted === (filter === "yes"));

  return (
    <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 400, color: C.text, margin: 0 }}>Liste des invités</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ k: "all", l: "Tous" }, { k: "yes", l: "✓ Présents" }, { k: "no", l: "✕ Absents" }].map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              fontFamily: "'Cormorant Garamond',serif", fontSize: 13, padding: "6px 14px", borderRadius: 20,
              background: filter === f.k ? C.gold : "transparent", color: filter === f.k ? "#1E1E1E" : C.textSoft,
              border: `1px solid ${filter === f.k ? C.gold : C.border}`, cursor: "pointer", transition: "all .2s",
            }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Nom", "Présence", "Boissons", "Allergies", "Chanson"].map((h) => (
                <th key={h} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: C.textSoft, padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((g, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}22`, transition: "background .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: C.text }}>{g.name || "—"}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{
                    display: "inline-block", fontFamily: "'Cormorant Garamond',serif", fontSize: 13, padding: "4px 12px", borderRadius: 20,
                    background: g.accepted ? `${C.green}18` : `${C.red}18`, color: g.accepted ? C.green : C.red,
                  }}>
                    {g.accepted ? "✓ Présent" : "✕ Absent"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {g.drinks && g.drinks.length > 0 ? g.drinks.map((d) => (
                      <span key={d} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 12.5, background: `${C.gold}18`, color: C.gold, padding: "3px 9px", borderRadius: 12 }}>{d}</span>
                    )) : <span style={{ color: C.textSoft, fontSize: 13 }}>—</span>}
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {g.allergies && g.allergies.length > 0 ? g.allergies.map((a) => (
                      <span key={a} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 12.5, background: a === "Aucune allergie" ? `${C.green}18` : `${C.blush}18`, color: a === "Aucune allergie" ? C.green : C.blush, padding: "3px 9px", borderRadius: 12 }}>{a}</span>
                    )) : <span style={{ color: C.textSoft, fontSize: 13 }}>—</span>}
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: g.song ? C.goldLight : C.textSoft, fontStyle: g.song ? "italic" : "normal" }}>
                    {g.song ? `🎵 ${g.song}` : "—"}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: C.textSoft, fontFamily: "'Cormorant Garamond',serif", fontSize: 16 }}>Aucun invité dans cette catégorie</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Playlist({ songs }) {
  return (
    <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 400, color: C.text, margin: 0 }}>🎶 Playlist du jour J</h3>
      </div>
      <div style={{ padding: "8px 0" }}>
        {songs.length === 0 ? (
          <p style={{ textAlign: "center", color: C.textSoft, fontFamily: "'Cormorant Garamond',serif", fontSize: 16, padding: "24px 0" }}>Aucune chanson proposée pour le moment</p>
        ) : songs.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "13px 24px",
            borderBottom: i < songs.length - 1 ? `1px solid ${C.border}22` : "none",
            transition: "background .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C.gold}18`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 13, color: C.gold, flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: C.text, margin: 0 }}>{s.song}</p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: C.textSoft, margin: "2px 0 0" }}>proposé par {s.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Charger les réponses RSVP
        const rsvpSnapshot = await getDocs(collection(db, "rsvp-responses"));
        const responses = rsvpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Charger le nombre de visites
        let visits = 0;
        try {
          const visitDoc = await getDoc(doc(db, "stats", "visits"));
          if (visitDoc.exists()) {
            visits = visitDoc.data().count || 0;
          }
        } catch (e) {
          console.log("No visits data yet");
        }

        setData(processData(responses, visits));
        setLoading(false);
      } catch (e) {
        console.error("Firebase error:", e);
        setError(e.message);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.textSoft, fontFamily: "'Cormorant Garamond',serif", fontSize: 18 }}>Chargement des données…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 500, textAlign: "center" }}>
          <p style={{ color: C.red, fontFamily: "'Cormorant Garamond',serif", fontSize: 18, marginBottom: 12 }}>Erreur de chargement</p>
          <p style={{ color: C.textSoft, fontFamily: "'Cormorant Garamond',serif", fontSize: 15 }}>{error}</p>
        </div>
      </div>
    );
  }

  const { allGuests, acceptedCount, refusedCount, drinkData, allergenData, attendanceData, songs, totalResponses, visits } = data;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "32px 24px 60px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');`}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(24px,5vw,36px)", fontWeight: 400, color: C.text, margin: 0 }}>
              Dashboard — <span style={{ color: C.gold }}>Deogratias & Gabriella</span>
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: C.textSoft, margin: "6px 0 0" }}>Mariage le 10 Avril 2026 · Suivi des réponses en temps réel</p>
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: C.textSoft, background: `${C.border}`, padding: "6px 14px", borderRadius: 20 }}>
            Mis à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard icon="" label="Réponses reçues" value={totalResponses} sub={`${allGuests.length} personnes`} color={C.accent3} />
          <StatCard icon="" label="Présents" value={acceptedCount} sub="confirmés" color={C.green} />
          <StatCard icon="" label="Absents" value={refusedCount} sub="déclinés" color={C.red} />
          <StatCard icon="" label="Consultations URL" value={visits} sub="visites totales" color={C.gold} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 28 }}>
          <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: "24px 20px" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 400, color: C.text, margin: "0 0 20px", textAlign: "center" }}>Présence</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value" stroke="none">
                  {attendanceData.map((_, i) => <Cell key={i} fill={i === 0 ? C.green : C.red} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ color: C.textSoft, fontFamily: "'Cormorant Garamond',serif", fontSize: 14 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: "24px 20px" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 400, color: C.text, margin: "0 0 20px", textAlign: "center" }}>Boissons choisies</h3>
            {drinkData.length === 0 ? (
              <p style={{ textAlign: "center", color: C.textSoft, fontFamily: "'Cormorant Garamond',serif", fontSize: 15, marginTop: 60 }}>Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={drinkData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: C.textSoft, fontFamily: "'Cormorant Garamond',serif", fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                    {drinkData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: "24px 20px" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 400, color: C.text, margin: "0 0 20px", textAlign: "center" }}>⚠️ Allergies déclarées</h3>
            {allergenData.length === 0 ? (
              <p style={{ textAlign: "center", color: C.textSoft, fontFamily: "'Cormorant Garamond',serif", fontSize: 15, marginTop: 60 }}>Aucune allergie déclarée</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={allergenData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: C.textSoft, fontFamily: "'Cormorant Garamond',serif", fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18} fill={C.blush} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <GuestTable guests={allGuests} />
        </div>

        <Playlist songs={songs} />
      </div>
    </div>
  );
}
