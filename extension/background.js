// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Minimal background script for Chrome tooltip extension

// Helper: update badge for specific tab
function updateBadge(disabled, excluded = false, tabId = null) {
    const text = disabled ? 'OFF' : (excluded ? 'EXCL' : '');
    const color = disabled ? '#d00' : '#ff8c00';
    
    if (tabId) {
        chrome.action.setBadgeText({ text, tabId });
        if (text) {
            chrome.action.setBadgeBackgroundColor({ color, tabId });
        }
    } else {
        chrome.action.setBadgeText({ text });
        if (text) {
            chrome.action.setBadgeBackgroundColor({ color });
        }
    }
}

// On install, set enabled by default and create context menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ lvt_disabled: false });
    updateBadge(false, false);
    
    // Create context menu for options
    chrome.contextMenus.create({
        id: "lvt-options",
        title: "Options",
        contexts: ["action"]
    });
});

// Toggle enabled/disabled on icon click
chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get('lvt_disabled', (data) => {
        const disabled = !data.lvt_disabled;
        chrome.storage.local.set({ lvt_disabled: disabled });
        
        // Update badge for all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(t => {
                updateBadge(disabled, false, t.id);
            });
        });
        
        // Content scripts will detect the storage change automatically
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
    } else if (msg.type === "lvt:domain_status_changed") {
        // Update badge for the specific tab that sent this message
        const tabId = sender.tab?.id;
        if (tabId) {
            chrome.storage.local.get('lvt_disabled', (data) => {
                const disabled = !!data.lvt_disabled;
                const excluded = !!msg.excluded;
                updateBadge(disabled, excluded && !disabled, tabId);
            });
        }
    }
});

// On startup, set badge state for all tabs
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get('lvt_disabled', (data) => {
        const disabled = !!data.lvt_disabled;
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                updateBadge(disabled, false, tab.id);
            });
        });
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "lvt-options") {
        chrome.runtime.openOptionsPage();
    }
});
