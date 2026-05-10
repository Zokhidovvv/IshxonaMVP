const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
  window.location.hostname === "[::1]" ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if (!("serviceWorker" in navigator)) return;

  const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
  if (publicUrl.origin !== window.location.origin) return;

  window.addEventListener("load", () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    if (isLocalhost) {
      checkValidServiceWorker(swUrl, config);
      navigator.serviceWorker.ready.then(() => {
        console.log("[SW] Localhost da ishlayapti.");
      });
    } else {
      registerValidSW(swUrl, config);
    }
  });
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      registration.onupdatefound = () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.onstatechange = () => {
          if (installing.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.log("[SW] Yangi versiya mavjud.");
              if (config && config.onUpdate) config.onUpdate(registration);
            } else {
              console.log("[SW] Offline uchun saqlandi.");
              if (config && config.onSuccess) config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch(err => console.error("[SW] Xato:", err));
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { "Service-Worker": "script" } })
    .then(response => {
      const contentType = response.headers.get("content-type");
      if (
        response.status === 404 ||
        (contentType && !contentType.includes("javascript"))
      ) {
        navigator.serviceWorker.ready.then(reg => {
          reg.unregister().then(() => window.location.reload());
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log("[SW] Offline rejimda ishlayapti.");
    });
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then(reg => reg.unregister())
      .catch(err => console.error(err.message));
  }
}
