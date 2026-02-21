document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("header.html?v=12", { cache: "no-store" });
    if (!res.ok) throw new Error("header.html not found");
    const html = await res.text();

    const mount = document.getElementById("header");
    if (mount) mount.innerHTML = html;
  } catch (err) {
    console.error(err);
  }
});