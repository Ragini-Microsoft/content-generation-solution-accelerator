import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FluentProvider, teamsLightTheme, teamsDarkTheme } from "@fluentui/react-components";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import "./styles/global.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

const ThemedApp = () => {
  const { isDarkMode } = useTheme();

  return (
    <FluentProvider theme={isDarkMode ? teamsDarkTheme : teamsLightTheme} style={{ height: "100vh" }}>
      <App />
    </FluentProvider>
  );
};

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  </React.StrictMode>
);
