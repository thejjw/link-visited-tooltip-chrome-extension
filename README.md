# Link Visited Tooltip

A minimal Chrome extension that shows a tooltip when you hover over a link, indicating when you last visited that link.

## Features

- **Simple tooltip:** On hovering any link, a small black tooltip appears near the cursor if you have visited the link before or if it's bookmarked.
- **Visit time:** The tooltip displays how long ago you last visited the link (e.g., "Visited 2 hours, 5 mins ago").
- **Bookmark indicator:** Links that are saved in your bookmarks show a ★ symbol in the tooltip.
- **Privacy-friendly:** No data is sent anywhere; all history and bookmark checks are local.
- **Chrome-only:** Designed for Google Chrome (Manifest V3).
- **Enable/disable:** Click the extension icon to disable or enable the tooltip feature. When disabled, the icon shows an 'OFF' badge. The change takes effect for any new pages you load. (no `tabs` permission) For tabs that are already open, you will need to reload them for the setting to apply.

## Installation

1. Download or clone this repository.
2. Go to `chrome://extensions` in your Chrome browser.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select the `extension` folder.

**Alternatively, install from the [Chrome Web Store](https://chromewebstore.google.com/detail/link-visited-tooltip/eknakfmjakcfjkemkanekcakbnjfkbnc)**  
_(Note: The Chrome Web Store version may not always have the latest updates.)_

## Usage

- Hover your mouse over any link on a webpage.
- If you have visited the link before, a tooltip will appear showing when you last visited it.
- If the link is bookmarked, a ★ symbol will appear at the beginning of the tooltip.
- For bookmarked links that haven't been visited, the tooltip shows "★ Bookmarked".
- For links that are both bookmarked and visited, the tooltip shows "★ Visited X ago".
- If you have not visited the link and it's not bookmarked, no tooltip is shown.

## License
See [LICENSE](LICENSE).

## Attribution

This extension is a minimal, Chrome-focused rewrite inspired by [Link Status Redux](https://github.com/jaatroko/link-status-redux) by Juha Aatrokoski.  
Original project: [Link Status Redux on GitHub](https://github.com/jaatroko/link-status-redux)

---

## Author
- Jaewoo Jeon [@thejjw](https://github.com/thejjw)