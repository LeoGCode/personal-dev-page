(function () {
  try {
    var t = localStorage.getItem("theme");
    var d = t === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", d === "dark");
    document.documentElement.style.colorScheme = d;
  } catch (e) {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }
})();
