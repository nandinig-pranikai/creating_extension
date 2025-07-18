// // background.js

// let mediaRecorder;
// let mediaStream;
// let websocket;

// function connectWebSocket() {
//   websocket = new WebSocket("ws://localhost:8766");

//   websocket.onopen = () => {
//     console.log("WebSocket connected.");
//   };

//   websocket.onclose = () => {
//     console.log("WebSocket disconnected.");
//   };

//   websocket.onerror = (error) => {
//     console.error("WebSocket error:", error);
//   };
// }

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "startCapture") {
//     // Connect to the WebSocket server when capture starts
//     connectWebSocket();

//     if (!chrome.tabCapture || typeof chrome.tabCapture.capture !== 'function') {
//       console.error("The chrome.tabCapture.capture API is not available on this page. Please try on a standard webpage.");
//       return;
//     }

//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (tabs.length === 0) {
//         console.error("No active tab found.");
//         return;
//       }

//       chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
//         if (chrome.runtime.lastError || !stream) {
//           console.error("Capture failed:", chrome.runtime.lastError?.message || "No stream returned.");
//           return;
//         }

//         console.log("Audio stream started.");
//         mediaStream = stream;

//         mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

//         mediaRecorder.ondataavailable = (event) => {
//           if (event.data.size > 0 && websocket && websocket.readyState === WebSocket.OPEN) {
//             websocket.send(event.data);
//           }
//         };

//         mediaRecorder.onstop = () => {
//           console.log("Recording stopped.");
//           if (websocket && websocket.readyState === WebSocket.OPEN) {
//             websocket.close();
//           }
//         };

//         mediaRecorder.start(1000); // Send data every second
//       });
//     });
//     return true; // Indicates asynchronous response
//   }

//   if (message.action === "stopCapture") {
//     if (mediaRecorder && mediaRecorder.state === "recording") {
//       mediaRecorder.stop();
//     }
//     if (mediaStream) {
//       mediaStream.getTracks().forEach(track => track.stop());
//     }
//     return true;
//   }
// });

// background.js


let mediaRecorder;
let audioChunks = []; // Array to store audio chunks
let mediaStream;
let websocket;

function connectWebSocket() {
  websocket = new WebSocket("ws://localhost:8766");
  websocket.onopen = () => console.log("WebSocket connected.");
  websocket.onclose = () => console.log("WebSocket disconnected.");
  websocket.onerror = (error) => console.error("WebSocket error:", error);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startCapture") {
    connectWebSocket();

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;

      chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
        if (chrome.runtime.lastError || !stream) {
          console.error("Capture failed:", chrome.runtime.lastError?.message);
          return;
        }

        console.log("Audio stream started.");
        mediaStream = stream;
        audioChunks = []; // Reset chunks array

        // Specify a MIME type with a codec for better compatibility
        const options = { mimeType: "audio/webm;codecs=opus" };
        mediaRecorder = new MediaRecorder(stream, options);

        // When data is available, push it to our array
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        // When the recorder stops, package and send the data
        mediaRecorder.onstop = () => {
          console.log("Recording stopped. Sending final audio data.");
          // Combine all chunks into a single Blob
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

          // Send the complete audio file over the WebSocket
          if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(audioBlob);
          }
          
          // Clean up
          if (websocket) websocket.close();
          mediaStream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
      });
    });
    return true;
  }

  if (message.action === "stopCapture") {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop(); // This will trigger the 'onstop' event
    }
    return true;
  }
});