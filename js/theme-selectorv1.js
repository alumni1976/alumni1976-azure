
const themeSelector = document.getElementById("themeSelector");
const themeStylesheet = document.getElementById("themeStylesheet");

const savedTheme = localStorage.getItem("alumniTheme");

if (savedTheme && themeStylesheet) {
  themeStylesheet.href = savedTheme;
  if (themeSelector) themeSelector.value = savedTheme;
}

themeSelector?.addEventListener("change", () => {
  const selectedTheme = themeSelector.value;
  themeStylesheet.href = selectedTheme;
  localStorage.setItem("alumniTheme", selectedTheme);
});
