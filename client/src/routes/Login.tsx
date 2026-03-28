import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { hexPath } from "../utils/hex";
import styles from "./Login.module.css";

const LOGO_SIZE = 84;

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "登录失败");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-container">
      <div className={`glass-card ${styles.card}`}>
        <svg
          className={styles.logo}
          width={LOGO_SIZE * Math.sqrt(3)}
          height={LOGO_SIZE * 2}
          viewBox={`${-LOGO_SIZE * Math.sqrt(3) / 2} ${-LOGO_SIZE} ${LOGO_SIZE * Math.sqrt(3)} ${LOGO_SIZE * 2}`}
        >
          <defs>
            <radialGradient id="logoGrad">
              <stop offset="0%" stopColor="var(--honey-500)" />
              <stop offset="100%" stopColor="var(--honey-700)" />
            </radialGradient>
          </defs>
          <path d={hexPath(LOGO_SIZE)} fill="url(#logoGrad)" />
        </svg>

        <h1 className={styles.title}>AgentHive</h1>
        <p className={styles.subtitle}>蜂巢协作空间</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.fieldLast}>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
