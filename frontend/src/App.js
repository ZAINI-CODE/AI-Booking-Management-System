import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/react";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Bookings from "@/pages/Bookings";
import BookingEdit from "@/pages/BookingEdit";
import AIBooking from "@/pages/AIBooking";
import CalendarPage from "@/pages/Calendar";
import Receipt from "@/pages/Receipt";
import Settings from "@/pages/Settings";
import Backup from "@/pages/Backup";
import { Analytics } from '@vercel/analytics/next';
import { BookingProvider } from "@/context/BookingContext";
import { SettingsProvider } from "@/context/SettingsContext";

function App() {
  return (
    <div className="App">
      <SettingsProvider>
        <BookingProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/bookings/new" element={<BookingEdit />} />
                <Route path="/bookings/:id/edit" element={<BookingEdit />} />
                <Route path="/ai-booking" element={<AIBooking />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/backup" element={<Backup />} />
              </Route>
              {/* Receipt is a standalone print-friendly page (no sidebar) */}
              <Route path="/receipt/:id" element={<Receipt />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
                <Analytics />
        </BookingProvider>
      </SettingsProvider>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#1F2937",
            border: "1px solid #374151",
            color: "#F9FAFB",
          },
        }}
      />
      <SpeedInsights />
    </div>
  );
}

export default App;
