# Permissions required

## Link Visited Tooltip Extension - Permission

This document provides detailed explanation for each permission requested by the Link Visited Tooltip extension.

---

## Host Permissions

### `<all_urls>`
**Justification:** The extension requests access to all URLs so it can display tooltips on any website you visit. Content scripts must be injected into all pages to detect link hover events and show visit history tooltips. Without this permission, the extension cannot function on user-visited websites.

**Technical necessity:** The core functionality requires monitoring mouse hover events over links across all websites to display visit history information.

---

## API Permissions

### `bookmarks`
**Justification:** Required to check if links are bookmarked and display the ★ symbol in tooltips. The extension enhances user experience by showing bookmark status alongside visit history.

**Technical necessity:** Uses `chrome.bookmarks.search()` to query bookmark status for each hovered link.

### `history`
**Justification:** Required to check when links were last visited and calculate "visited X ago" timestamps. This is the core functionality of the extension - showing visit history information.

**Technical necessity:** Uses `chrome.history.getVisits()` to retrieve visit timestamps and calculate elapsed time since last visit.

### `storage`
**Justification:** Required to store user preferences including domain exclusions and enable/disable state. Settings are synced across devices for better user experience.

**Technical necessity:** Uses `chrome.storage.sync` for domain exclusions (synced settings) and `chrome.storage.local` for per-installation enable/disable state.

### `contextMenus`
**Justification:** Required to add "Options" menu item when right-clicking the extension icon, providing easy access to configuration settings.

**Technical necessity:** Uses `chrome.contextMenus.create()` to add options access via right-click menu.

### `tabs`
Removed per Google Chrome Web Store request.