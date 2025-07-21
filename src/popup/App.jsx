// src/App.jsx
import React, { useState } from "react";
import "./popup.css";
import { summarizeText } from "../utils";

function App() {
  const [activeTab, setActiveTab] = useState("youtube");
  const [paragraph, setParagraph] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ytSummary, setYtSummary] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState("");
  const [readerMode, setReaderMode] = useState(false);

  // For YouTube: get transcript/description from content script
  const handleYouTubeSummarize = async () => {
    setYtLoading(true);
    setYtError("");
    setYtSummary("");
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      // Wait for user to open transcript manually
      // Now extract transcript or description
      const response = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Try to get transcript (updated selector)
          const transcript = document.querySelectorAll(
            "ytd-transcript-segment-renderer .segment-text"
          );
          if (transcript.length > 0) {
            return Array.from(transcript)
              .map((e) => e.textContent)
              .join(" ");
          }
          // Try to get description (robust selectors)
          const desc1 = document.querySelector(
            "ytd-video-secondary-info-renderer #description yt-formatted-string"
          );
          if (desc1 && desc1.innerText.length > 30) return desc1.innerText;
          const desc2 = document.querySelector("#description");
          if (desc2 && desc2.innerText.length > 30) return desc2.innerText;
          const desc3 = document.querySelector(
            "ytd-expander[collapsed] #description"
          );
          if (desc3 && desc3.innerText.length > 30) return desc3.innerText;
          const desc4 = document.querySelector("#description-inline-expander");
          if (desc4 && desc4.innerText.length > 30) return desc4.innerText;
          return "";
        },
      });
      const text = response[0]?.result || "";
      if (!text || text.length < 30) {
        setYtError(
          "Could not find a transcript or description long enough to summarize. Please click 'Show transcript' below the video before summarizing for best results."
        );
        setYtLoading(false);
        return;
      }
      const summary = await summarizeText(text);
      setYtSummary(summary);
    } catch (err) {
      setYtError("Failed to summarize video.");
    }
    setYtLoading(false);
  };

  const handleParagraphSummarize = async () => {
    setLoading(true);
    setError("");
    setSummary("");
    try {
      if (!paragraph || paragraph.length < 50) {
        throw new Error("Please enter a paragraph of at least 50 characters.");
      }
      const summary = await summarizeText(paragraph);
      setSummary(summary);
    } catch (err) {
      setError(err.message || "Failed to summarize paragraph.");
    }
    setLoading(false);
  };

  // Listen for messages from content script (e.g., when reader mode is disabled from the page)
  React.useEffect(() => {
    const messageListener = (request, sender, sendResponse) => {
      if (request.type === "READER_MODE_DISABLED") {
        setReaderMode(false); // Update popup state when reader mode is disabled on the page
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    // Cleanup listener on component unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Communicate with content script to enable/disable reader mode
  const toggleReaderMode = async (enable) => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        setYtError("No active tab found.");
        return;
      }

      // First, try a quick ping to see if content script is already listening.
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: "PING",
        });
        if (response && response.status === "PONG") {
          // Content script is active and responsive. Proceed.
        } else {
          // Unexpected response or no response, might need injection.
          throw new Error(
            "Content script did not respond to PING as expected."
          );
        }
      } catch (pingError) {
        // If PING fails (e.g., "Receiving end does not exist"), inject.
        if (
          pingError.message.includes("Receiving end does not exist") ||
          pingError.message.includes("Could not establish connection")
        ) {
          console.warn(
            "Content script not active or responsive, injecting now...",
            pingError
          );

          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"], // Inject content.js
          });

          // Add a small fixed delay after injection before sending the command
          await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
        } else {
          throw pingError; // Re-throw other unexpected errors from PING
        }
      }

      // Now send the actual command.
      await chrome.tabs.sendMessage(tab.id, {
        type: enable ? "ENABLE_READER_MODE" : "DISABLE_READER_MODE",
        summary: enable ? ytSummary : undefined,
      });

      setReaderMode(enable); // Update popup's internal state
    } catch (error) {
      console.error("Error toggling Reader Mode:", error);
      setReaderMode(false); // Revert UI state on error
      setYtError(
        "Failed to toggle Reader Mode. Please ensure you are on a YouTube video page and try again. (Error: " +
          error.message +
          ")"
      );
    }
  };

  return (
    <div className="popup-container">
      <h2>YouTube & Paragraph Summarizer</h2>
      <div className="tabs">
        <button
          className={activeTab === "youtube" ? "active" : ""}
          onClick={() => setActiveTab("youtube")}
        >
          YouTube Video
        </button>
        <button
          className={activeTab === "paragraph" ? "active" : ""}
          onClick={() => setActiveTab("paragraph")}
        >
          Paragraph
        </button>
      </div>
      {activeTab === "youtube" && (
        <div className="tab-content">
          <p>
            Summarize the current YouTube video (transcript or description).
          </p>
          <div className="yt-note">
            For best results,{" "}
            <b>manually click 'Show transcript' below the video</b> before
            summarizing. The extension will use the transcript if available,
            otherwise it will summarize the description.
          </div>
          <button
            onClick={handleYouTubeSummarize}
            disabled={ytLoading}
            className="summarize-btn"
          >
            {ytLoading ? "Summarizing..." : "Summarize Video"}
          </button>
          {ytSummary && (
            <button
              className={`reader-toggle-btn${readerMode ? " active" : ""}`}
              onClick={() => toggleReaderMode(!readerMode)}
            >
              {readerMode ? "Disable Reader Mode" : "Enable Reader Mode"}
            </button>
          )}
          {ytError && <div className="error">{ytError}</div>}
          {ytSummary && <div className="summary-box">{ytSummary}</div>}
        </div>
      )}
      {activeTab === "paragraph" && (
        <div className="tab-content">
          <textarea
            placeholder="Paste your paragraph here (min 50 characters)..."
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            rows={5}
            maxLength={4000}
            className="paragraph-input"
          />
          <p>{paragraph.length}/4000 characters</p>
          <button
            onClick={handleParagraphSummarize}
            disabled={loading}
            className="summarize-btn"
          >
            {loading ? "Summarizing..." : "Summarize Paragraph"}
          </button>
          {error && <div className="error">{error}</div>}
          {summary && <div className="summary-box">{summary}</div>}
        </div>
      )}
      <footer>
        <a
          href="https://huggingface.co/tasks/summarization"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by HuggingFace
        </a>
      </footer>
    </div>
  );
}

export default App;
