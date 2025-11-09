import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import HomePage from "../pages/HomePage/HomePage";
import Ads from "../pages/Ads/Ads";
import AdForm from "../pages/Ads/Form/adForm";
import Register from "../components/Register/Register";
import Login from "../components/Login/Login";
import { ProtectedRoute, PublicRoute } from "../RouteGuards";

export const routers = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { 
        index: true, 
        element: <HomePage /> 
      },
      {
        path: "login",
        element: (
          <PublicRoute restricted={true}>
            <Login />
          </PublicRoute>
        ),
      },
      {
        path: "register",
        element: (
          <PublicRoute restricted={true}>
            <Register />
          </PublicRoute>
        ),
      },
      { 
        path: "ads", 
        element: <Ads /> 
      },
      {
        path: "ads/create",
        element: (
          <ProtectedRoute>
            <AdForm mode="create" />
          </ProtectedRoute>
        ),
      },
      {
        path: "ads/:id/edit",
        element: (
          <ProtectedRoute>
            <AdForm mode="update" />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);