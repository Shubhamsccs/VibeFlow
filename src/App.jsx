import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import TasksBoard from "./pages/TasksBoard";
import Analytics from "./pages/Analytics";
import Timeline from "./pages/Timeline";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Commercial Landing Page at root */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />

        {/* Private / Interactive Workspace Shell */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TasksBoard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        {/* Fallback to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
