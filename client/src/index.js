import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { SnackbarProvider } from "./helpers/SnackbarContext";

// Set initial zoom level to 100%
const setInitialZoom = () => {
  // Method 1: CSS zoom (most reliable)
  document.documentElement.style.zoom = '1.0';
  
  // Method 2: Fallback using transform for browsers that don't support zoom
  if (!document.documentElement.style.zoom) {
    document.documentElement.style.transform = 'scale(1.0)';
    document.documentElement.style.transformOrigin = 'top left';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
  }
};

// Apply zoom immediately when the script loads
setInitialZoom();

ReactDOM.render(
  <React.StrictMode>
    <SnackbarProvider>
      <App />
    </SnackbarProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
