import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./utils/i18n";
import { routers } from "./routers/routers";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <AdminProvider>
        <RouterProvider router={routers} />
      </AdminProvider>
    </AuthProvider>
  </StrictMode>
);