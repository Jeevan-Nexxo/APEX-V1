import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PlatformSettingsProvider } from "./context/PlatformSettingsContext";
import ToastProvider from "./components/ui/Toast";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PlatformSettingsProvider>
          <AuthProvider>
            <ToastProvider />
            <App />
          </AuthProvider>
        </PlatformSettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
