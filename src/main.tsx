import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("Main.tsx loading...");

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("Root element found, mounting React app...");
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found!");
}
