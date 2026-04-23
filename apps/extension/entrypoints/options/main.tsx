import "@carbon/styles/css/styles.css";
import "@reviselab/ui/styles.css";

import { createRoot } from "react-dom/client";

import { OptionsApp } from "../../src/components/options-app";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(<OptionsApp />);
}
