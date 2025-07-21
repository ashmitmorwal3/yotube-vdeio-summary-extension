// Reader mode logic
function enableReaderMode(summaryText) {
  // Set body and html background to black for a dark mode experience
  document.body.style.setProperty("background", "black", "important");
  document.documentElement.style.setProperty(
    "background",
    "black",
    "important"
  );

  // Hide specific YouTube UI elements
  const hideSelectors = [
    "#masthead-container", // Main header at the top
    "ytd-topbar-renderer", // Top bar itself, includes search
    "#secondary", // Right sidebar with recommendations
    "ytd-comments", // Comments section
    "ytd-merch-shelf-renderer", // Merch shelf
    "ytd-promoted-sparkles-web-renderer", // Ads
    "ytd-ad-slot-renderer", // More ad slots
    "ytd-player-legacy-desktop-watch-ads-renderer", // Player ads
    "ytd-action-panel-renderer", // Action panels below video
    "ytd-info-panel-container", // Info panels often seen for breaking news etc.
    "ytd-watch-metadata", // Contains video title, views, date, description preview
    "ytd-slim-video-metadata-renderer", // Slim version of metadata
    "ytd-video-owner-renderer", // Channel info, subscribe button
    "ytd-video-primary-info-renderer", // Main title and like/share buttons block
    "ytd-two-column-watch-next-results", // Main container for right sidebar and comments on desktop
    "#related", // "Up Next" section (related videos)
    "#panels", // Panels like transcript, chapters (if not open)
    "#chat", // Live chat panel
    "#menu-container", // Container for "..." menu button
    "#actions", // Container for like/dislike/share buttons below title
    "#top-row.ytd-watch-metadata", // Top row of metadata
    "#bottom-row.ytd-watch-metadata", // Bottom row of metadata
    ".ytp-chrome-bottom", // Player controls overlay
    ".ytp-chrome-top", // Player top bar overlay
    "ytd-popup-container", // Any popups that might appear
    "yt-confirm-dialog-renderer",
    "ytd-engagement-panel-section-list-renderer",
    "#contents.ytd-rich-grid-renderer", // For non-video pages (e.g. homepage grid)
    "#page-manager.ytd-app",
    "ytd-playlist-panel-renderer", // Playlists on side
    "ytd-searchbox", // Search bar
    "ytd-compact-radio-renderer",
    "ytd-compact-playlist-renderer",
    "ytd-comments-section-renderer",
    "yt-chip-cloud-renderer",
    "ytd-guide-renderer", // Left navigation guide
    "#guide-button", // Guide button
    "#yt-alert",
    "#yt-player-legacy",
    "#yt-masthead",
    "#yt-url-endpoint",
    "#yt-app-promo",
    "#yt-related",
    "#yt-sidebar",
    "#yt-navigation-panel",
    "#yt-app-tray",
    "#yt-page-skeleton",
    "#player-full-bleed-container",
    "#content-container",
    "#chips-wrapper",
    "#info-contents",
    "#expander",
    "#header",
    "#sections",
    "#primary-inner",
    "#meta",
    "#info",
    "#panels",
    "#chat",
    "#menu",
    "#actions",
    "#top-row",
    "#bottom-row",
    "#comments",
    "#secondary",
    "#primary",
    "#player-ads",
    "#player-ads-container",
  ];

  // Store original display styles to revert later.
  window.originalYouTubeDisplayStyles =
    window.originalYouTubeDisplayStyles || new Map();

  hideSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      // Prevent hiding the actual video player or its immediate parents that are crucial for display
      if (el.id === "player" || el.classList.contains("html5-video-player"))
        return;

      // Check if the element is an ancestor of the player or part of primary video container
      let current = el;
      let isPlayerRelatedContainer = false;
      while (current) {
        if (
          current.id === "player" ||
          current.id === "player-container" ||
          current.id === "primary" ||
          current.classList.contains("html5-video-player") ||
          current.classList.contains("ytd-watch-flexy")
        ) {
          isPlayerRelatedContainer = true;
          break;
        }
        current = current.parentNode;
      }

      // If it's a player-related container, don't hide it unless it's a specific control overlay
      if (
        isPlayerRelatedContainer &&
        !(
          el.classList.contains("ytp-chrome-bottom") ||
          el.classList.contains("ytp-chrome-top")
        )
      ) {
        return; // Do not hide essential player containers
      }

      // Store original style before hiding
      if (el.style.display && el.style.display !== "none") {
        window.originalYouTubeDisplayStyles.set(el, el.style.display);
      } else {
        window.originalYouTubeDisplayStyles.set(el, null); // Mark as originally not having inline display or was hidden
      }
      el.style.setProperty("display", "none", "important"); // Use !important to ensure override
    });
  });

  // Explicitly ensure the video player and its containers are visible and styled for black background
  const primaryContainer =
    document.querySelector("ytd-watch-flexy #primary") ||
    document.querySelector("#primary");
  if (primaryContainer) {
    primaryContainer.style.setProperty("background", "black", "important");
    primaryContainer.style.setProperty("color", "white", "important");
    primaryContainer.style.setProperty("padding", "0", "important");
    primaryContainer.style.setProperty("margin", "0 auto", "important");
    primaryContainer.style.setProperty("max-width", "100%", "important");
    primaryContainer.style.setProperty("display", "block", "important");
  }

  const playerContainerOuter = document.getElementById(
    "player-container-outer"
  );
  if (playerContainerOuter) {
    playerContainerOuter.style.setProperty("background", "black", "important");
    playerContainerOuter.style.setProperty("display", "block", "important");
    playerContainerOuter.style.setProperty("width", "100%", "important");
    playerContainerOuter.style.setProperty("max-width", "unset", "important");
  }

  const videoContainer = document.getElementById("player-container");
  if (videoContainer) {
    videoContainer.style.setProperty("max-width", "900px", "important"); // Limit video player width
    videoContainer.style.setProperty("margin", "20px auto", "important");
    videoContainer.style.setProperty("background", "black", "important");
    videoContainer.style.setProperty("display", "block", "important");
  }

  const player = document.getElementById("player"); // The actual video player element
  if (player) {
    player.style.setProperty("margin", "0 auto", "important"); // Center the video within its container
    player.style.setProperty("display", "block", "important");
    player.style.setProperty("max-width", "100%", "important");
    player.style.setProperty("width", "100%", "important"); // Make player responsive within its max-width
    player.style.setProperty("height", "auto", "important"); // Maintain aspect ratio
    player.style.setProperty("z-index", "1000", "important");
    player.style.setProperty("background", "black", "important"); // Background for the player area itself
  }

  // Add summary box and disable button after the video player
  let summaryAndButtonContainer = document.getElementById(
    "yt-reader-elements-container"
  );
  if (!summaryAndButtonContainer) {
    summaryAndButtonContainer = document.createElement("div");
    summaryAndButtonContainer.id = "yt-reader-elements-container";
    summaryAndButtonContainer.style.cssText = `
          max-width: 900px;
          margin: 20px auto;
          padding: 20px;
          background: #1a1a1a;
          color: #f0f0f0;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          font-size: 1.1em;
          position: relative;
          z-index: 9999;
          display: block;
      `;
    // Insert after the primary content area if possible, or directly to body as fallback
    if (primaryContainer) {
      primaryContainer.appendChild(summaryAndButtonContainer);
    } else if (player) {
      player.parentNode?.insertBefore(
        summaryAndButtonContainer,
        player.nextSibling
      );
    } else {
      document.body.appendChild(summaryAndButtonContainer); // Final fallback
    }
  }

  let summaryBox = document.getElementById("yt-summary-box");
  if (!summaryBox) {
    summaryBox = document.createElement("div");
    summaryBox.id = "yt-summary-box";
    summaryAndButtonContainer.appendChild(summaryBox);
  }
  summaryBox.innerText = summaryText || "No summary available.";

  let disableBtn = document.getElementById("yt-reader-disable-button");
  if (!disableBtn) {
    disableBtn = document.createElement("button");
    disableBtn.id = "yt-reader-disable-button";
    disableBtn.innerText = "Disable Reader Mode";
    disableBtn.style.cssText = `
          background: #444;
          color: #fff;
          border: none;
          border-radius: 5px;
          padding: 8px 15px;
          cursor: pointer;
          font-size: 0.95em;
          margin-top: 15px;
          display: block;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
          transition: background 0.3s ease;
      `;
    disableBtn.onmouseover = () => (disableBtn.style.background = "#666");
    disableBtn.onmouseout = () => (disableBtn.style.background = "#444");
    summaryAndButtonContainer.appendChild(disableBtn);
    disableBtn.onclick = () => {
      disableReaderMode();
      chrome.runtime.sendMessage({ type: "READER_MODE_DISABLED" });
    };
  }
}

function disableReaderMode() {
  document.body.style.background = "";
  document.documentElement.style.background = "";

  const originalDisplayStyles =
    window.originalYouTubeDisplayStyles || new Map();

  originalDisplayStyles.forEach((originalDisplay, el) => {
    if (el && el.style) {
      el.style.display = originalDisplay === null ? "" : originalDisplay;
    }
  });

  document.getElementById("yt-reader-elements-container")?.remove();

  const player = document.getElementById("player");
  if (player) {
    player.style.margin = "";
    player.style.maxWidth = "";
    player.style.width = "";
    player.style.height = "";
    player.style.zIndex = "";
    player.style.background = "";
  }
  const videoContainer = document.getElementById("player-container");
  if (videoContainer) {
    videoContainer.style.maxWidth = "";
    videoContainer.style.margin = "";
    videoContainer.style.background = "";
    videoContainer.style.display = "";
  }
  const primaryContainer =
    document.querySelector("ytd-watch-flexy #primary") ||
    document.querySelector("#primary");
  if (primaryContainer) {
    primaryContainer.style.background = "";
    primaryContainer.style.color = "";
    primaryContainer.style.padding = "";
    primaryContainer.style.margin = "";
    primaryContainer.style.maxWidth = "";
    primaryContainer.style.display = "";
  }
  window.originalYouTubeDisplayStyles = null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ENABLE_READER_MODE") {
    enableReaderMode(msg.summary);
  } else if (msg.type === "DISABLE_READER_MODE") {
    disableReaderMode();
  } else if (msg.type === "PING") {
    // New: Respond to PING from popup
    sendResponse({ status: "PONG" });
    return true; // Indicates asynchronous response
  }
});
