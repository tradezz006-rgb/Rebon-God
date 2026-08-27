import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";

const rootEl = document.getElementById("root");

if (!rootEl) {
  document.body.innerHTML =
    '<p style="font-family:sans-serif;padding:24px">Unable to start the app: missing #root element. Please refresh.</p>';
} else {
  createRoot(rootEl).render(
    <ErrorBoundary label="Rebon">
      <App />
    </ErrorBoundary>
  );
}
