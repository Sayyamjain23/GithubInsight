import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.title = "GitHub Repository Analyzer";

createRoot(document.getElementById("root")!).render(<App />);
