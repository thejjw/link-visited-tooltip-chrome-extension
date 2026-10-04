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
let tooltip_opacity = 0.2; // Default opacity
let autohide_enabled = false; // Default OFF
let autohide_secs = 5; // Default timeout in seconds
let autohide_timer = null;
let last_mouse = { x: 0, y: 0 };

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
    } else if (changes.tooltip_opacity && areaName === 'sync') {
        tooltip_opacity = changes.tooltip_opacity.newValue || 0.2;
        // Reset tooltip div so it recreates with new opacity
        if (tooltip_div) {
            tooltip_div.remove();
            tooltip_div = null;
        }
    } else if (changes.tooltip_autohide_enabled && areaName === 'sync') {
        autohide_enabled = !!changes.tooltip_autohide_enabled.newValue;
        if (!autohide_enabled) {
            clearAutohide();
        } else if (tooltip_div && tooltip_div.style.display === "block") {
            scheduleAutohide();
        }
    } else if (changes.tooltip_autohide_secs && areaName === 'sync') {
        autohide_secs = clampAutohideSecs(changes.tooltip_autohide_secs.newValue);
        if (tooltip_div && tooltip_div.style.display === "block") {
            scheduleAutohide();
        }
    }
});

// Clamp autohide timeout to a sane range (seconds)
function clampAutohideSecs(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 5;
    return Math.min(10, Math.max(1, Math.round(n)));
}

// Clear any pending autohide timer
function clearAutohide() {
    if (autohide_timer !== null) {
        clearTimeout(autohide_timer);
        autohide_timer = null;
    }
}

// Schedule tooltip autohide after the configured timeout
function scheduleAutohide() {
    clearAutohide();
    if (!autohide_enabled) return;
    autohide_timer = setTimeout(onAutohideTimeout, autohide_secs * 1000);
}

// Check if the mouse pointer still points to the previous link
function isStillHoveringAnchor() {
    if (!anchor || !anchor.isConnected) return false;
    try {
        if (typeof anchor.matches === "function" && anchor.matches(":hover")) {
            return true;
        }
    } catch (e) {
        // Ignore invalid selector errors and fall through to elementFromPoint
    }
    try {
        const el = document.elementFromPoint(last_mouse.x, last_mouse.y);
        if (!el) return false;
        if (typeof anchor.contains === "function" && anchor.contains(el)) return true;
        if (typeof el.closest === "function" && el.closest("a, area") === anchor) return true;
        return false;
    } catch (e) {
        return false;
    }
}

// Autohide timeout handler: clear stale tooltips (e.g. page changed under cursor)
function onAutohideTimeout() {
    autohide_timer = null;
    if (!autohide_enabled) return;
    // Keep tooltip while the pointer still points to the same link
    if (isStillHoveringAnchor()) {
        scheduleAutohide();
        return;
    }
    anchor = null;
    hide_tooltip();
}

// Initialize extension state
async function initializeExtension() {
    // Check disabled state
    try {
        const data = await browser.storage.local.get('lvt_disabled');
        lvt_disabled = !!data.lvt_disabled;
    } catch (error) {
        console.warn('Failed to get disabled state:', error);
    }
    
    // Check opacity setting
    try {
        const opacityData = await storage.get('tooltip_opacity');
        // Default to 0.2 (transparent) if no setting exists
        tooltip_opacity = opacityData !== undefined ? opacityData : 0.2;
    } catch (error) {
        console.warn('Failed to get opacity setting:', error);
        // Default to transparent on error
        tooltip_opacity = 0.2;
    }

    // Check autohide settings (default OFF, 5 seconds)
    try {
        const autohideEnabled = await storage.get('tooltip_autohide_enabled');
        autohide_enabled = !!autohideEnabled;
        const autohideSecs = await storage.get('tooltip_autohide_secs');
        autohide_secs = autohideSecs !== undefined ? clampAutohideSecs(autohideSecs) : 5;
    } catch (error) {
        console.warn('Failed to get autohide settings:', error);
        autohide_enabled = false;
        autohide_secs = 5;
    }
    
    // Check domain exclusions
    await checkDomainExclusion();
}

// Initialize when content script loads
initializeExtension();

function show_tooltip(text, x, y) {
    if (lvt_disabled || domain_excluded) return;
    last_mouse = { x, y };
    if (!tooltip_div) {
        tooltip_div = document.createElement("div");
        tooltip_div.style.position = "fixed";
        // Use the current opacity setting
        tooltip_div.style.background = `rgba(0,0,0,${tooltip_opacity})`;
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
    scheduleAutohide();
}

function hide_tooltip() {
    clearAutohide();
    if (tooltip_div) {
        tooltip_div.style.display = "none";
    }
}

document.addEventListener("mouseover", function(e) {
    if (lvt_disabled || domain_excluded) return;
    last_mouse = { x: e.clientX, y: e.clientY };
    let a;
    for (a = e.target; a !== null; a = a.parentElement) {
        if (a.tagName === "A" || a.tagName === "AREA") {
            break;
        }
    }
    if (a === anchor) {
        // Still over the same link: refresh autohide timer
        if (a !== null && tooltip_div && tooltip_div.style.display === "block") {
            scheduleAutohide();
        }
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

document.addEventListener("mousemove", function(e) {
    last_mouse = { x: e.clientX, y: e.clientY };
}, true);

document.addEventListener("mouseout", function(e) {
    if (anchor !== null) {
        hide_tooltip();
        anchor = null;
    }
}, true);
