document.addEventListener("DOMContentLoaded", () => {
  fetch("header.html")
    .then(res => {
      if (!res.ok) throw new Error("header.html not found");
      return res.text();
    })
    .then(html => {
      const mount = document.getElementById("header");
      if (mount) mount.innerHTML = html;
    })
    .catch(err => console.error(err));
});