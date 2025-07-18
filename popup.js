document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startButton");
  const stopBtn = document.getElementById("stopButton");

  startBtn?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "startCapture" });
  });

  stopBtn?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "stopCapture" });
  });
});
