// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Minimal background script for Chrome tooltip extension
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.type === "lsr:check_visited") {
        chrome.history.getVisits({ url: msg.url }, function(results) {
            if (chrome.runtime.lastError || !results || results.length === 0) {
                sendResponse({ visited: false });
                return;
            }
            // Find most recent visit
            let lastVisit = results[0].visitTime;
            for (let v of results) if (v.visitTime > lastVisit) lastVisit = v.visitTime;
            let elapsed = (Date.now() - lastVisit) / 1000;
            sendResponse({ visited: true, elapsed });
        });
        return true; // async
    }
});
