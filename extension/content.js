// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Minimal content script for Chrome tooltip extension
if (typeof browser === "undefined") {
    var browser = chrome;
}

let anchor = null;
let tooltip_div = null;

function show_tooltip(text, x, y) {
    if (!tooltip_div) {
        tooltip_div = document.createElement("div");
        tooltip_div.style.position = "fixed";
        tooltip_div.style.background = "rgba(0,0,0,0.85)";
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
            if (result && result.visited && typeof result.elapsed === "number") {
                let ago = "";
                if (result.elapsed < 60) {
                    ago = "just now";
                } else if (result.elapsed < 3600) {
                    let minutes = Math.floor(result.elapsed / 60);
                    ago = `${minutes} min${minutes !== 1 ? "s" : ""}`;
                } else {
                    let hours = Math.floor(result.elapsed / 3600);
                    let minutes = Math.floor((result.elapsed % 3600) / 60);
                    ago = `${hours} hour${hours !== 1 ? "s" : ""}`;
                    if (minutes > 0) ago += `, ${minutes} min${minutes !== 1 ? "s" : ""}`;
                }
                show_tooltip(`Visited ${ago} ago`, e.clientX, e.clientY);
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
