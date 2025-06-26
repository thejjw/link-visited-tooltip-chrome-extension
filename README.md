# Link Visited Tooltip

A minimal Chrome extension that shows a tooltip when you hover over a link, indicating when you last visited that link.

## Features

- **Simple tooltip:** On hovering any link, a small black tooltip appears near the cursor if you have visited the link before.
- **Visit time:** The tooltip displays how long ago you last visited the link (e.g., "Visited 2 hours, 5 mins ago").
- **Privacy-friendly:** No data is sent anywhere; all history checks are local.
- **Chrome-only:** Designed for Google Chrome (Manifest V3).
- **Enable/disable:** Click the extension icon to temporarily disable or enable the tooltip feature. When disabled, the icon shows an 'OFF' badge and no tooltips will appear.

## Installation

1. Download or clone this repository.
2. Go to `chrome://extensions` in your Chrome browser.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select the `extension` folder.

## Usage

- Hover your mouse over any link on a webpage.
- If you have visited the link before, a tooltip will appear showing when you last visited it.
- If you have not visited the link, no tooltip is shown.

## License
See [LICENSE](LICENSE).

## Attribution

This extension is a minimal, Chrome-focused rewrite inspired by [Link Status Redux](https://github.com/jaatroko/link-status-redux) by Juha Aatrokoski.  
Original project: [Link Status Redux on GitHub](https://github.com/jaatroko/link-status-redux)

---

## Author
- Jaewoo Jeon [@thejjw](https://github.com/thejjw)
