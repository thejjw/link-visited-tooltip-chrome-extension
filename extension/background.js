// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Minimal background script for Chrome tooltip extension

// Helper: update badge
function updateBadge(disabled) {
    if (disabled) {
        chrome.action.setBadgeText({ text: 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: '#d00' });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

// On install, set enabled by default
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ lvt_disabled: false });
    updateBadge(false);
});

// Toggle enabled/disabled on icon click
chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get('lvt_disabled', (data) => {
        const disabled = !data.lvt_disabled;
        chrome.storage.local.set({ lvt_disabled: disabled });
        updateBadge(disabled);
    });
});

// Respond to content script queries
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.type === "lsr:check_visited") {
        // Check both history and bookmarks
        Promise.all([
            // Check history
            new Promise((resolve) => {
                chrome.history.getVisits({ url: msg.url }, function(results) {
                    if (chrome.runtime.lastError || !results || results.length === 0) {
                        resolve({ visited: false });
                        return;
                    }
                    // Find most recent visit
                    let lastVisit = results[0].visitTime;
                    for (let v of results) if (v.visitTime > lastVisit) lastVisit = v.visitTime;
                    let elapsed = (Date.now() - lastVisit) / 1000;
                    resolve({ visited: true, elapsed });
                });
            }),
            // Check bookmarks
            new Promise((resolve) => {
                chrome.bookmarks.search({ url: msg.url }, function(results) {
                    if (chrome.runtime.lastError) {
                        resolve({ bookmarked: false });
                        return;
                    }
                    resolve({ bookmarked: results && results.length > 0 });
                });
            })
        ]).then(([historyResult, bookmarkResult]) => {
            sendResponse({
                visited: historyResult.visited,
                elapsed: historyResult.elapsed,
                bookmarked: bookmarkResult.bookmarked
            });
        }).catch(() => {
            sendResponse({ visited: false, bookmarked: false });
        });
        
        return true; // async
    }
});

// On startup, set badge state
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get('lvt_disabled', (data) => {
        updateBadge(!!data.lvt_disabled);
    });
});
