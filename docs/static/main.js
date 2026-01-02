//
// THEME
//

const Theme = {
  Dark: "dark",
  Light: "light",
};

const THEME_ATTR = "data-theme";
const THEME_STORAGE_KEY = "@zeta/theme";

function getThemeFromStorage() {
  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  if (Object.values(Theme).includes(theme)) return theme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? Theme.Dark
    : Theme.Light;
}

function updateTheme() {
  if (theme === Theme.Dark)
    document.documentElement.setAttribute(THEME_ATTR, "dark");
  else document.documentElement.removeAttribute(THEME_ATTR);
}
function saveTheme() {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
let theme = getThemeFromStorage();
updateTheme();

const themeButton = document.querySelector(".theme-button");

themeButton.addEventListener("click", () => {
  theme = theme === Theme.Dark ? Theme.Light : Theme.Dark;
  updateTheme();
  saveTheme();
});

//
// SPA Navigation
//

// document.addEventListener("click", (event) => {
//   let anchor = event.target.closest("a");
//   if (anchor) event.preventDefault();
//
//   if (anchor.href === location.href) return;
//   history.pushState(null, null, anchor.href);
// });

//
// Update Active Nav Bar Link
//

const activeTargets = document.querySelectorAll("*[data-active-target]");
activeTargets.forEach((target) => {
  const requireExact = target.getAttribute("data-active-target") === "exact";
  const link = target.tagName === "A" ? target : target.querySelector("a");
  const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
  const currentPath = location.pathname.replace(/\/$/, "");
  console.log({ isExact: requireExact, linkPath, currentPath });
  if (requireExact) {
    if (currentPath === linkPath) target.classList.add("active");
  } else {
    if (currentPath.startsWith(linkPath)) target.classList.add("active");
  }
});
