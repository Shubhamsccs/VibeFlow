import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import TasksBoard from "./pages/TasksBoard";
import CalendarView from "./pages/CalendarView";
import Analytics from "./pages/Analytics";
import Timeline from "./pages/Timeline";
import TimeTracker from "./pages/TimeTracker";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<TasksBoard />} />
          <Route path="tracker" element={<TimeTracker />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
