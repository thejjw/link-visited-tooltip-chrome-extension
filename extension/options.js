// Options page JavaScript for Link Visited Tooltip extension

// Version constant - update this when releasing new versions
const EXTENSION_VERSION = '1.4.1';

// Storage helper functions
const storage = {
    async get(key) {
        const result = await chrome.storage.sync.get(key);
        return result[key];
    },
    
    async set(key, value) {
        await chrome.storage.sync.set({ [key]: value });
    },
    
    // Log storage usage for debugging/troubleshooting
    logStorageUsage() {
        chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
            console.log(`[Link Visited Tooltip] Current storage usage: ${bytesInUse} bytes (${Math.round(bytesInUse/1024*100)/100} KB)`);
        });
    }
};

// Domain exclusion functionality
class DomainExclusions {
    constructor() {
        this.exclusions = [];
        this.init();
    }

    async init() {
        await this.loadExclusions();
        this.setupEventListeners();
        this.renderExclusions();
        this.updateStorageStatus();
    }

    async loadExclusions() {
        try {
            this.exclusions = (await storage.get('domain_exclusions')) || [];
        } catch (error) {
            console.error('Failed to load exclusions:', error);
            this.showStatus('Failed to load exclusions', 'error');
        }
    }

    async saveExclusions() {
        try {
            await storage.set('domain_exclusions', this.exclusions);
            this.showStatus('Settings saved successfully', 'success');
            this.updateStorageStatus(); // Update storage status after save
        } catch (error) {
            console.error('Failed to save exclusions:', error);
            this.showStatus('Failed to save settings', 'error');
        }
    }

    setupEventListeners() {
        const domainInput = document.getElementById('domain-input');
        const addBtn = document.getElementById('add-btn');

        // Add domain on button click
        addBtn.addEventListener('click', () => {
            this.addDomain(domainInput.value.trim());
        });

        // Add domain on Enter key
        domainInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.addDomain(domainInput.value.trim());
            }
        });

        // Enable/disable add button based on input
        domainInput.addEventListener('input', () => {
            const value = domainInput.value.trim();
            addBtn.disabled = !value || this.exclusions.includes(value);
        });
    }

    validateDomain(domain) {
        if (!domain) {
            return { valid: false, error: 'Domain cannot be empty' };
        }

        // Basic domain validation
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!domainRegex.test(domain)) {
            return { valid: false, error: 'Invalid domain format' };
        }

        if (this.exclusions.includes(domain)) {
            return { valid: false, error: 'Domain already excluded' };
        }

        return { valid: true };
    }

    async addDomain(domain) {
        const validation = this.validateDomain(domain);
        
        if (!validation.valid) {
            this.showStatus(validation.error, 'error');
            return;
        }

        this.exclusions.push(domain);
        await this.saveExclusions();
        this.renderExclusions();
        
        // Clear input
        document.getElementById('domain-input').value = '';
        document.getElementById('add-btn').disabled = true;
    }

    async removeDomain(domain) {
        const index = this.exclusions.indexOf(domain);
        if (index > -1) {
            this.exclusions.splice(index, 1);
            await this.saveExclusions();
            this.renderExclusions();
        }
    }

    renderExclusions() {
        const container = document.getElementById('exclusions-container');
        const noExclusions = document.getElementById('no-exclusions');
        
        // Clear existing domain items
        const existingItems = container.querySelectorAll('.domain-item');
        existingItems.forEach(item => item.remove());

        if (this.exclusions.length === 0) {
            noExclusions.style.display = 'block';
        } else {
            noExclusions.style.display = 'none';
            
            this.exclusions.forEach(domain => {
                const domainItem = document.createElement('div');
                domainItem.className = 'domain-item';
                
                domainItem.innerHTML = `
                    <span class="domain-text">${this.escapeHtml(domain)}</span>
                    <button class="remove-btn" data-domain="${this.escapeHtml(domain)}">Remove</button>
                `;
                
                // Add remove functionality
                const removeBtn = domainItem.querySelector('.remove-btn');
                removeBtn.addEventListener('click', () => {
                    this.removeDomain(domain);
                });
                
                container.appendChild(domainItem);
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStorageStatus() {
        const storageElement = document.getElementById('storage-type');
        if (!storageElement) return;
        
        storageElement.textContent = '☁️ Settings will be synced to your Google account if you are logged in';
        storageElement.className = 'storage-status sync';
        
        // Log storage usage for debugging
        storage.logStorageUsage();
    }

    showStatus(message, type = 'info') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        
        // Clear status after 3 seconds
        setTimeout(() => {
            status.textContent = '';
            status.className = 'status';
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Populate version in footer
    const versionElement = document.getElementById('version');
    if (versionElement) {
        versionElement.textContent = `v${EXTENSION_VERSION}`;
    }
    
    // Initialize domain exclusions
    new DomainExclusions();
});
