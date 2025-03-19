document.addEventListener("DOMContentLoaded", function () {
  // Get settings directly from localStorage
  let settings;
  try {
    settings = JSON.parse(localStorage.getItem("settings")) || {};
  } catch (e) {
    settings = {};
  }

  // Apply theme
  if (settings.theme === "dark") {
    document.body.classList.add("dark-theme");
  }

  // Apply font size
  if (settings.fontSize) {
    document.documentElement.style.fontSize =
      settings.fontSize === "small"
        ? "14px"
        : settings.fontSize === "large"
        ? "18px"
        : "16px";
  }

  // Apply color accent
  if (settings.colorAccent) {
    let primaryColor;
    switch (settings.colorAccent) {
      case "blue":
        primaryColor = "#4e73df";
        break;
      case "green":
        primaryColor = "#1cc88a";
        break;
      case "purple":
        primaryColor = "#6f42c1";
        break;
      case "orange":
        primaryColor = "#fd7e14";
        break;
      case "teal":
        primaryColor = "#20c9a6";
        break;
      default:
        primaryColor = "#4e73df";
    }
    document.documentElement.style.setProperty("--primary-color", primaryColor);
  }
});
