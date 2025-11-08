import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage/HomePage";
import App from "../App";
import Ads from "../pages/Ads/Ads";
import AdForm from "../pages/Ads/Form/adForm";

export const routers = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "/ads", element: <Ads /> },
      { path: "/ads/create", element: <AdForm mode="create" /> },
      { path: "/ads/:id/edit", element: <AdForm mode="update" /> },
    ],
  },
]);
