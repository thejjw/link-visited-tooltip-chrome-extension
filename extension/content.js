// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Minimal content script for Chrome tooltip extension
if (typeof browser === "undefined") {
    var browser = chrome;
}

let anchor = null;
let tooltip_div = null;
let lvt_disabled = false;
let domain_excluded = false;

// Storage helper functions
const storage = {
    async get(key) {
        try {
            // Try sync storage first, fall back to local
            const result = await browser.storage.sync.get(key);
            return result[key];
        } catch (error) {
            console.warn('Sync storage not available, using local storage:', error);
            const result = await browser.storage.local.get(key);
            return result[key];
        }
    }
};

// Domain exclusion checking
function isCurrentDomainExcluded(exclusions) {
    if (!exclusions || !Array.isArray(exclusions)) {
        return false;
    }
    
    const currentHostname = window.location.hostname.toLowerCase();
    
    for (const exclusion of exclusions) {
        const excludeDomain = exclusion.toLowerCase();
        
        // Exact match
        if (currentHostname === excludeDomain) {
            return true;
        }
        
        // Subdomain match - check if current domain ends with "." + exclude domain
        if (currentHostname.endsWith('.' + excludeDomain)) {
            return true;
        }
    }
    
    return false;
}

// Check if extension should run on current domain
async function checkDomainExclusion() {
    try {
        const exclusions = await storage.get('domain_exclusions');
        domain_excluded = isCurrentDomainExcluded(exclusions);
    } catch (error) {
        console.warn('Failed to check domain exclusions:', error);
        domain_excluded = false;
    }
}

// Listen for storage changes instead of messages
browser.storage.onChanged.addListener((changes, areaName) => {
    if (changes.lvt_disabled && areaName === 'local') {
        lvt_disabled = !!changes.lvt_disabled.newValue;
        if (lvt_disabled) hide_tooltip();
    } else if (changes.domain_exclusions && areaName === 'sync') {
        // Re-check domain exclusion status
        checkDomainExclusion().then(() => {
            if (domain_excluded) {
                hide_tooltip();
            }
        });
    }
});

// Initialize extension state
async function initializeExtension() {
    // Check disabled state
    try {
        const data = await browser.storage.local.get('lvt_disabled');
        lvt_disabled = !!data.lvt_disabled;
    } catch (error) {
        console.warn('Failed to get disabled state:', error);
    }
    
    // Check domain exclusions
    await checkDomainExclusion();
}

// Initialize when content script loads
initializeExtension();

function show_tooltip(text, x, y) {
    if (lvt_disabled || domain_excluded) return;
    if (!tooltip_div) {
        tooltip_div = document.createElement("div");
        tooltip_div.style.position = "fixed";
        tooltip_div.style.background = "rgba(0,0,0,0.2)";
        tooltip_div.style.color = "#fff";
        tooltip_div.style.padding = "6px 12px";
        tooltip_div.style.borderRadius = "6px";
        tooltip_div.style.fontSize = "14px";
        tooltip_div.style.zIndex = 2147483647;
        tooltip_div.style.pointerEvents = "none";
        tooltip_div.style.maxWidth = "400px";
        tooltip_div.style.whiteSpace = "pre-line";
        document.body.appendChild(tooltip_div);
    }
    tooltip_div.textContent = text;
    tooltip_div.style.left = (x + 12) + "px";
    tooltip_div.style.top = (y + 12) + "px";
    tooltip_div.style.display = "block";
}

function hide_tooltip() {
    if (tooltip_div) {
        tooltip_div.style.display = "none";
    }
}

document.addEventListener("mouseover", function(e) {
    if (lvt_disabled || domain_excluded) return;
    let a;
    for (a = e.target; a !== null; a = a.parentElement) {
        if (a.tagName === "A" || a.tagName === "AREA") {
            break;
        }
    }
    if (a === anchor) {
        return;
    }
    anchor = a;
    if (a === null) {
        hide_tooltip();
        return;
    }
    browser.runtime.sendMessage({ type: "lsr:check_visited", url: a.href })
        .then(result => {
            let tooltipText = "";
            
            // Add bookmark symbol if bookmarked
            if (result && result.bookmarked) {
                tooltipText += "★ ";
            }
            
            // Add visit information if visited
            if (result && result.visited && typeof result.elapsed === "number") {
                let ago = "";
                if (result.elapsed < 60) {
                    ago = "just now";
                } else if (result.elapsed < 3600) {
                    let minutes = Math.floor(result.elapsed / 60);
                    ago = `${minutes} min${minutes !== 1 ? "s" : ""}`;
                } else if (result.elapsed < 86400) { // less than a day
                    let hours = Math.floor(result.elapsed / 3600);
                    let minutes = Math.floor((result.elapsed % 3600) / 60);
                    ago = `${hours} hour${hours !== 1 ? "s" : ""}`;
                    if (minutes > 0) ago += `, ${minutes} min${minutes !== 1 ? "s" : ""}`;
                } else {
                    let days = Math.floor(result.elapsed / 86400);
                    ago = `${days} day${days !== 1 ? "s" : ""}`;
                }
                tooltipText += `Visited ${ago} ago`;
            } else if (result && result.bookmarked) {
                // If bookmarked but not visited, just show "Bookmarked"
                tooltipText += "Bookmarked";
            }
            
            // Show tooltip if we have any information to display
            if (tooltipText) {
                show_tooltip(tooltipText, e.clientX, e.clientY);
            } else {
                hide_tooltip();
            }
        })
        .catch(() => hide_tooltip());
}, true);

document.addEventListener("mouseout", function(e) {
    if (anchor !== null) {
        hide_tooltip();
        anchor = null;
    }
}, true);
