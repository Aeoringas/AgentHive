import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectPath, setProjectPath] = useState("");

  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => setStep(2), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  async function handleCreateAdmin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "创建失败");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
          repo_path: projectPath,
          is_source: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "创建失败");
      }

      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-container">
      <div className="glass-card" style={{ width: 440, padding: 40 }}>
        <h1 style={{ textAlign: "center", fontSize: 28, marginBottom: 8, color: "#1e1b4b" }}>
          AgentHive
        </h1>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                background: s <= step ? "#4f46e5" : "#e5e7eb",
                color: s <= step ? "#fff" : "#9ca3af",
                transition: "all 0.3s",
              }}
            >
              {s}
            </div>
          ))}
        </div>

        {error && (
          <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 16, textAlign: "center" }}>
            {error}
          </p>
        )}

        {step === 1 && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <p style={{ fontSize: 16, color: "#374151" }}>环境检查通过</p>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleCreateAdmin}>
            <h2 style={{ fontSize: 18, marginBottom: 20, color: "#374151" }}>创建管理员账号</h2>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="用户名"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <input
                type="password"
                placeholder="密码"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "创建中..." : "创建账号"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleCreateProject}>
            <h2 style={{ fontSize: 18, marginBottom: 20, color: "#374151" }}>创建源项目</h2>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="项目名称"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="项目描述"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <input
                type="text"
                placeholder="主仓库路径"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "创建中..." : "创建项目"}
            </button>
          </form>
        )}

        {step === 4 && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <p style={{ fontSize: 18, color: "#374151", marginBottom: 24 }}>初始化完成</p>
            <button className="btn-primary" onClick={() => navigate("/")}>
              进入蜂巢空间
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
