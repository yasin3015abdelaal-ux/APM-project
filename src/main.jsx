import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./utils/i18n";
import { routers } from "./routers/routers";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={routers} />
    </AuthProvider>
  </StrictMode>
);