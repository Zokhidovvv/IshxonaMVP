export function register() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    navigator.serviceWorker.register(swUrl)
      .then(reg => {
        console.log("[SW] Ro'yxatdan o'tdi:", reg.scope);
        reg.onupdatefound = () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.onstatechange = () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[SW] Yangi versiya mavjud");
            }
          };
        };
      })
      .catch(err => console.log("[SW] Xato:", err));
  });
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then(reg => reg.unregister())
      .catch(() => {});
  }
}
