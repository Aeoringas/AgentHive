import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { hexPath } from "../utils/hex";
import styles from "./Setup.module.css";

const LOGO_SIZE = 84;
const STEP_HEX_SIZE = 10;
const TOTAL_STEPS = 4;

function StepIndicator({ current }: { current: number }) {
  const stepPath = hexPath(STEP_HEX_SIZE);
  const viewSize = STEP_HEX_SIZE * 2 + 2;

  return (
    <div className={styles.steps}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const s = i + 1;
        let fill: string;
        let stroke: string | undefined;
        if (s < current) {
          fill = "var(--status-completed)";
          stroke = undefined;
        } else if (s === current) {
          fill = "var(--honey-500)";
          stroke = undefined;
        } else {
          fill = "transparent";
          stroke = "var(--wax)";
        }

        return (
          <div key={s} style={{ display: "contents" }}>
            {i > 0 && <div className={styles.stepLine} />}
            <svg
              className={styles.stepHex}
              width={STEP_HEX_SIZE * Math.sqrt(3)}
              height={viewSize}
              viewBox={`${-viewSize / 2} ${-viewSize / 2} ${viewSize} ${viewSize}`}
            >
              <path
                d={stepPath}
                fill={fill}
                stroke={stroke}
                strokeWidth={stroke ? 1.5 : 0}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

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
      <div className={`glass-card ${styles.card}`}>
        <svg
          className={styles.logo}
          width={LOGO_SIZE * Math.sqrt(3)}
          height={LOGO_SIZE * 2}
          viewBox={`${-LOGO_SIZE * Math.sqrt(3) / 2} ${-LOGO_SIZE} ${LOGO_SIZE * Math.sqrt(3)} ${LOGO_SIZE * 2}`}
        >
          <defs>
            <radialGradient id="setupLogoGrad">
              <stop offset="0%" stopColor="var(--honey-500)" />
              <stop offset="100%" stopColor="var(--honey-700)" />
            </radialGradient>
          </defs>
          <path d={hexPath(LOGO_SIZE)} fill="url(#setupLogoGrad)" />
        </svg>

        <h1 className={styles.title}>AgentHive</h1>

        <StepIndicator current={step} />

        {error && <p className={styles.error}>{error}</p>}

        {step === 1 && (
          <div className={styles.checkContent}>
            <p className={`${styles.checkText} ${styles.checkRunning}`}>环境检查中...</p>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleCreateAdmin}>
            <h2 className={styles.stepTitle}>创建管理员账号</h2>
            <div className={styles.field}>
              <input
                type="text"
                placeholder="用户名"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldLast}>
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
            <h2 className={styles.stepTitle}>创建源项目</h2>
            <div className={styles.field}>
              <input
                type="text"
                placeholder="项目名称"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <input
                type="text"
                placeholder="项目描述"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
              />
            </div>
            <div className={styles.fieldLast}>
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
          <div className={styles.completeContent}>
            <p className={styles.completeText}>初始化完成</p>
            <button className="btn-primary" onClick={() => navigate("/")}>
              进入蜂巢空间
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
