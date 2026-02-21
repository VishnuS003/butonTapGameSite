document.addEventListener("DOMContentLoaded", function () {
  const mountPoint = document.getElementById("header");

  if (!mountPoint) {
    console.warn("Header mount point not found");
    return;
  }

  // Определяем путь к header.html
  // Если ты в html/shop/, то header.html лежит рядом
  const headerPath = "header.html";

  fetch(headerPath, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load header.html: " + response.status);
      }
      return response.text();
    })
    .then(function (data) {
      mountPoint.innerHTML = data;
    })
    .catch(function (error) {
      console.error("Header load error:", error);
    });
});