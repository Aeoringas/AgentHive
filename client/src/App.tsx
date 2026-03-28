import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Login } from "./routes/Login";
import { Setup } from "./routes/Setup";
import { Canvas } from "./routes/Canvas";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function InitCheck({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "initialized" | "uninitialized">("loading");

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.initialized ? "initialized" : "uninitialized");
      })
      .catch(() => {
        setStatus("initialized");
      });
  }, []);

  if (status === "loading") return null;
  if (status === "uninitialized") return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
        <Route
          path="/"
          element={
            <InitCheck>
              <AuthGuard>
                <Canvas />
              </AuthGuard>
            </InitCheck>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
