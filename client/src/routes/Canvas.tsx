import { useNavigate } from "react-router-dom";

export function Canvas() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1e1b4b" }}>AgentHive</span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: 14,
            padding: "4px 12px",
            borderRadius: 6,
          }}
        >
          退出
        </button>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 48,
        }}
      >
        <p style={{ fontSize: 18, color: "#9ca3af" }}>蜂巢空间 - 开发中</p>
      </main>
    </div>
  );
}
