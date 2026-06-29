import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useDirection } from "./hooks/useDirection";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Streams from "./pages/Streams";
import Consumers from "./pages/Consumers";
import Connections from "./pages/Connections";
import Security from "./pages/Security";
import Subjects from "./pages/Subjects";
import StreamDetail from "./pages/StreamDetail";
import ConsumerDetail from "./pages/ConsumerDetail";
import Messages from "./pages/Messages";
import KVStore from "./pages/KVStore";
import Cluster from "./pages/Cluster";
import Alerts from "./pages/Alerts";
import Metrics from "./pages/Metrics";
import History from "./pages/History";
import Tenancy from "./pages/Tenancy";
import VisualStreamGraph from "./pages/VisualStreamGraph";
import SetupWizard from "./pages/setup/SetupWizard";

function App() {
  useDirection();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);
  const prevLocationRef = useRef(location);

  // Check setup status on mount
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch("/api/config/setup");
        if (res.ok) {
          const data = await res.json();
          setSetupCompleted(data.setup_completed);
        } else {
          // If endpoint doesn't exist, assume setup is completed (backward compat)
          setSetupCompleted(true);
        }
      } catch {
        // If can't reach API, assume setup is completed
        setSetupCompleted(true);
      }
    };
    checkSetup();
  }, []);

  useEffect(() => {
    if (prevLocationRef.current !== location) {
      setIsTransitioning(true);
      const timeout = setTimeout(() => setIsTransitioning(false), 300);
      prevLocationRef.current = location;
      return () => clearTimeout(timeout);
    }
  }, [location]);

  // Show loading while checking setup
  if (setupCompleted === null) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show setup wizard if not completed
  if (!setupCompleted) {
    return <SetupWizard />;
  }

  return (
    <Layout>
      <div
        className={`transition-all duration-300 ease-out ${
          isTransitioning
            ? "opacity-0 translate-y-4"
            : "opacity-100 translate-y-0"
        }`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/streams" element={<Streams />} />
          <Route path="/streams/:name" element={<StreamDetail />} />
          <Route path="/consumers" element={<Consumers />} />
          <Route path="/consumers/:name" element={<ConsumerDetail />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/messages" element={<Messages />} />
          <Route
            path="/core-messaging"
            element={<Navigate to="/messages" replace />}
          />
          <Route path="/kv-store" element={<KVStore />} />
          <Route path="/cluster" element={<Cluster />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/visual-stream-graph" element={<VisualStreamGraph />} />
          <Route path="/history" element={<History />} />
          <Route path="/security" element={<Security />} />
          <Route path="/tenancy" element={<Tenancy />} />
        </Routes>
      </div>
    </Layout>
  );
}

export default App;
