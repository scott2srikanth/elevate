const label = document.getElementById("offline-status");
const download = document.getElementById("offline-download");
const check = document.getElementById("offline-check");
let worker,
  availableId,
  working = false,
  offlineReady = false;
function call(type, expected, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      reject(
        Error(
          "The operation timed out. Your previous offline copy is unchanged; check readiness and retry.",
        ),
      );
    }, 300000);
    channel.port1.onmessage = (event) => {
      if (event.data.progress !== undefined) {
        onProgress(event.data.progress);
        return;
      }
      clearTimeout(timer);
      channel.port1.close();
      event.data.error
        ? reject(Error(event.data.error))
        : resolve(event.data.result);
    };
    worker.postMessage({ type, expected }, [channel.port2]);
  });
}
function buttons(value) {
  working = value;
  download.disabled = value;
  check.disabled = value;
  document.getElementById("consent").disabled = value || !offlineReady;
  document.getElementById("file").disabled =
    value || !offlineReady || !document.getElementById("consent").checked;
}
function display(state) {
  offlineReady = state.ready;
  document.getElementById("consent").disabled = !offlineReady;
  label.textContent = state.ready
    ? `Offline ready · ${state.installed}`
    : "Set up offline analysis";
  download.textContent = state.ready
    ? "Repair / sync offline copy"
    : "Download for offline use";
}
try {
  if (
    !("serviceWorker" in navigator) ||
    !window.isSecureContext ||
    !window.caches
  )
    throw Error(
      "Offline storage needs HTTPS and a browser or Android WebView with service-worker support.",
    );
  const registration =
    (await navigator.serviceWorker.getRegistration("/")) ||
    (await navigator.serviceWorker.register("/elevate-offline-sw.js", {
      scope: "/",
      type: "module",
      updateViaCache: "none",
    }));
  const ready = await navigator.serviceWorker.ready;
  worker = ready.active || registration.active;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    worker = navigator.serviceWorker.controller || worker;
  });
  registration.update().catch(() => {});
  const initialState = await call("STATUS");
  display(initialState);
  document.getElementById("offline-settings").open = !initialState.ready;
  download.disabled = false;
  check.disabled = false;
} catch (error) {
  label.textContent = error.message;
}
check.onclick = async () => {
  if (working) return;
  if (
    document.getElementById("file").disabled &&
    document.getElementById("consent").checked
  ) {
    label.textContent =
      "Wait for media analysis to finish before checking updates.";
    return;
  }
  buttons(true);
  try {
    const state = await call("CHECK");
    availableId = state.availableId;
    display(state);
    label.textContent +=
      state.id === availableId
        ? " You have the latest published model."
        : ` Update available: ${state.available}. Choose Sync update to install it.`;
    download.textContent =
      state.id === availableId ? "Repair / sync offline copy" : "Sync update";
  } catch (error) {
    label.textContent = error.message;
  } finally {
    buttons(false);
  }
};
download.onclick = async () => {
  if (working) return;
  if (
    document.getElementById("file").disabled &&
    document.getElementById("consent").checked
  ) {
    label.textContent = "Wait for media analysis to finish before syncing.";
    return;
  }
  buttons(true);
  try {
    const persisted = await navigator.storage?.persist?.().catch(() => false);
    const state = await call("INSTALL", availableId, (progress) => {
      label.textContent = `Saving verified offline files… ${progress}%`;
    });
    display(state);
    label.textContent += persisted
      ? " Persistent storage granted."
      : " Storage is saved, but this browser may remove it under storage pressure.";
    if (
      state.updated ||
      (location.pathname.includes("/offline/") &&
        !location.pathname.includes(state.id))
    ) {
      label.textContent +=
        " Reloading the analyser with the installed version…";
      location.replace(
        "/observation/" +
          (document.documentElement.dataset.offlinePage || "") +
          "?session=" +
          encodeURIComponent(
            new URLSearchParams(location.search).get("session") || "",
          ),
      );
    }
  } catch (error) {
    label.textContent = error.message;
  } finally {
    buttons(false);
  }
};
