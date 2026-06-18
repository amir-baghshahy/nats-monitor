import { Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  return (
    <Layout>
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
        <Route path="/history" element={<History />} />
        <Route path="/security" element={<Security />} />
        <Route path="/tenancy" element={<Tenancy />} />
      </Routes>
    </Layout>
  );
}

export default App;
