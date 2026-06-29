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

function App() {
  useDirection();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevLocationRef = useRef(location);

  useEffect(() => {
    if (prevLocationRef.current !== location) {
      setIsTransitioning(true);
      const timeout = setTimeout(() => setIsTransitioning(false), 300);
      prevLocationRef.current = location;
      return () => clearTimeout(timeout);
    }
  }, [location]);

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
