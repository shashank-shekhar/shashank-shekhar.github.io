/**
 * Monadic Search - Powered by Fuse.js
 */

(function () {
	'use strict';

	// Configuration (from theme config via window.MONADIC_SEARCH_CONFIG)
	const CONFIG = window.MONADIC_SEARCH_CONFIG || {
		indexUrl: '/search-index.json',
		maxResults: 10,
		threshold: 0.3,
		keys: [
			{ name: 'title', weight: 3 },
			{ name: 'excerpt', weight: 1 },
			{ name: 'tags', weight: 2 },
		],
	};
	// Ensure indexUrl has a fallback (template sets the correct prefixed value)
	CONFIG.indexUrl = CONFIG.indexUrl || '/search-index.json';

	// State
	let fuse = null;
	let searchIndex = [];
	let selectedIndex = -1;

	// DOM elements
	const searchTrigger = document.getElementById('search-trigger');
	const searchModal = document.getElementById('search-modal');
	const searchModalBackdrop = document.getElementById('search-modal-backdrop');
	const searchClose = document.getElementById('search-close');
	const searchInput = document.getElementById('search-input');
	const searchResults = document.getElementById('search-results');
	const searchStatus = document.getElementById('search-status');

	/**
	 * Initialize search
	 */
	async function init() {
		// Check if all required elements exist
		if (!searchTrigger || !searchModal || !searchInput || !searchResults || !searchStatus) {
			console.warn('Monadic Search: Required DOM elements not found');
			return;
		}

		// Load search index
		try {
			const response = await fetch(CONFIG.indexUrl);
			if (!response.ok) {
				throw new Error(`Failed to load search index: ${response.status}`);
			}
			searchIndex = await response.json();

			// Check if Fuse.js is loaded
			if (typeof Fuse === 'undefined') {
				throw new Error('Fuse.js library not loaded');
			}

			// Initialize Fuse.js
			fuse = new Fuse(searchIndex, {
				keys: CONFIG.keys,
				threshold: CONFIG.threshold,
				includeScore: true,
				includeMatches: true,
				minMatchCharLength: 2,
			});

			console.log(`Monadic Search initialized: ${searchIndex.length} posts indexed`);
		} catch (error) {
			console.error('Failed to initialize search:', error);
			showError('Failed to load search. Please refresh the page.');
			return;
		}

		// Event listeners
		searchTrigger.addEventListener('click', openSearch);
		searchClose.addEventListener('click', closeSearch);
		searchModalBackdrop.addEventListener('click', closeSearch);
		searchInput.addEventListener('input', handleSearch);
		searchInput.addEventListener('keydown', handleKeyDown);

		// Keyboard shortcut: Press "/" to open search
		document.addEventListener('keydown', (e) => {
			if (e.key === '/' && !isInputFocused()) {
				e.preventDefault();
				openSearch();
			}
		});
	}

	/**
	 * Open search modal
	 */
	function openSearch() {
		searchModal.setAttribute('aria-hidden', 'false');
		searchModal.classList.add('active');
		document.body.style.overflow = 'hidden'; // Prevent background scroll
		searchInput.focus();
		updateStatus('Start typing to search...');
	}

	/**
	 * Close search modal
	 */
	function closeSearch() {
		searchModal.setAttribute('aria-hidden', 'true');
		searchModal.classList.remove('active');
		document.body.style.overflow = '';
		searchInput.value = '';
		searchResults.innerHTML = '';
		selectedIndex = -1;
	}

	/**
	 * Handle search input
	 */
	function handleSearch(e) {
		const query = e.target.value.trim();

		if (query.length === 0) {
			searchResults.innerHTML = '';
			updateStatus('Start typing to search...');
			selectedIndex = -1;
			return;
		}

		if (query.length < 2) {
			updateStatus('Type at least 2 characters...');
			return;
		}

		// Perform search
		const results = fuse.search(query);
		const limitedResults = results.slice(0, CONFIG.maxResults);

		// Display results
		displayResults(limitedResults, query);

		// Update status
		if (results.length === 0) {
			updateStatus(`No posts found for "${query}"`);
		} else if (results.length > CONFIG.maxResults) {
			updateStatus(`Showing ${CONFIG.maxResults} of ${results.length} results`);
		} else {
			updateStatus(`Found ${results.length} ${results.length === 1 ? 'post' : 'posts'}`);
		}

		selectedIndex = -1;
	}

	/**
	 * Display search results (XSS-safe using DOM methods)
	 */
	function displayResults(results, query) {
		// Clear previous results
		searchResults.innerHTML = '';

		if (results.length === 0) {
			const noResults = document.createElement('div');
			noResults.className = 'search-no-results';

			const p1 = document.createElement('p');
			p1.textContent = `No posts found for "${query}"`;

			const p2 = document.createElement('p');
			p2.className = 'search-suggestion';
			p2.textContent = 'Try different keywords or check your spelling';

			noResults.appendChild(p1);
			noResults.appendChild(p2);
			searchResults.appendChild(noResults);
			return;
		}

		// Create result items using DOM methods (XSS-safe)
		results.forEach((result, index) => {
			const item = result.item;

			// Validate URL to prevent javascript: or data: URLs
			if (!isValidUrl(item.url)) {
				console.warn('Skipping invalid URL:', item.url);
				return;
			}

			// Create result link
			const resultLink = document.createElement('a');
			resultLink.href = item.url;
			resultLink.className = 'search-result-item';
			resultLink.setAttribute('data-index', index.toString());
			resultLink.setAttribute('role', 'option');
			resultLink.setAttribute('aria-selected', 'false');

			// Title with highlights
			const titleDiv = document.createElement('div');
			titleDiv.className = 'search-result-title';
			appendHighlightedText(titleDiv, item.title, result.matches, 'title');

			// Meta section
			const metaDiv = document.createElement('div');
			metaDiv.className = 'search-result-meta';

			if (item.date) {
				const dateSpan = document.createElement('span');
				dateSpan.className = 'search-result-date';
				dateSpan.textContent = formatDate(item.date);
				metaDiv.appendChild(dateSpan);
			}

			if (item.tags && item.tags.length > 0) {
				const tagsSpan = document.createElement('span');
				tagsSpan.className = 'search-result-tags';
				tagsSpan.textContent = item.tags.map((tag) => `#${tag}`).join(' ');
				metaDiv.appendChild(tagsSpan);
			}

			// Excerpt with highlights
			const excerptDiv = document.createElement('div');
			excerptDiv.className = 'search-result-excerpt';
			appendHighlightedText(excerptDiv, item.excerpt, result.matches, 'excerpt');

			// Assemble result item
			resultLink.appendChild(titleDiv);
			resultLink.appendChild(metaDiv);
			resultLink.appendChild(excerptDiv);
			searchResults.appendChild(resultLink);
		});
	}

	/**
	 * Append highlighted text to parent element (XSS-safe using DOM methods)
	 * @param {HTMLElement} parent - Parent element to append to
	 * @param {string} text - Text to display
	 * @param {Array} matches - Fuse.js match data
	 * @param {string} key - Field key to match against
	 */
	function appendHighlightedText(parent, text, matches, key) {
		if (!text) {
			return;
		}

		if (!matches || matches.length === 0) {
			parent.textContent = text;
			return;
		}

		const relevantMatches = matches.filter((m) => m.key === key);
		if (relevantMatches.length === 0) {
			parent.textContent = text;
			return;
		}

		// Highlight first match
		const firstMatch = relevantMatches[0];
		if (firstMatch.indices && firstMatch.indices.length > 0) {
			const [start, end] = firstMatch.indices[0];

			// Text before match
			if (start > 0) {
				const beforeText = document.createTextNode(text.substring(0, start));
				parent.appendChild(beforeText);
			}

			// Highlighted match
			const mark = document.createElement('mark');
			mark.textContent = text.substring(start, end + 1);
			parent.appendChild(mark);

			// Text after match
			if (end + 1 < text.length) {
				const afterText = document.createTextNode(text.substring(end + 1));
				parent.appendChild(afterText);
			}
		} else {
			parent.textContent = text;
		}
	}

	/**
	 * Validate URL to prevent XSS via javascript: or data: URLs
	 * @param {string} url - URL to validate
	 * @returns {boolean} - True if URL is safe
	 */
	function isValidUrl(url) {
		if (!url || typeof url !== 'string') {
			return false;
		}

		// Only allow http, https, and relative URLs
		const urlLower = url.toLowerCase().trim();

		// Reject dangerous protocols
		if (
			urlLower.startsWith('javascript:') ||
			urlLower.startsWith('data:') ||
			urlLower.startsWith('vbscript:') ||
			urlLower.startsWith('file:')
		) {
			return false;
		}

		// Allow http, https, and relative URLs
		return (
			urlLower.startsWith('http://') ||
			urlLower.startsWith('https://') ||
			urlLower.startsWith('/') ||
			urlLower.startsWith('./') ||
			urlLower.startsWith('../')
		);
	}

	/**
	 * Handle keyboard navigation
	 */
	function handleKeyDown(e) {
		const results = searchResults.querySelectorAll('.search-result-item');

		if (results.length === 0) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
				updateSelectedResult(results);
				break;

			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				updateSelectedResult(results);
				break;

			case 'Enter':
				e.preventDefault();
				if (selectedIndex >= 0) {
					results[selectedIndex].click();
				}
				break;

			case 'Escape':
				e.preventDefault();
				closeSearch();
				break;
		}
	}

	/**
	 * Update selected result visual state
	 */
	function updateSelectedResult(results) {
		results.forEach((result, index) => {
			if (index === selectedIndex) {
				result.classList.add('selected');
				result.setAttribute('aria-selected', 'true');
				result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			} else {
				result.classList.remove('selected');
				result.setAttribute('aria-selected', 'false');
			}
		});
	}

	/**
	 * Update status message
	 */
	function updateStatus(message) {
		if (searchStatus) {
			searchStatus.textContent = message;
		}
	}

	/**
	 * Show error message
	 */
	function showError(message) {
		searchResults.innerHTML = `
      <div class="search-error">
        <p>${escapeHtml(message)}</p>
      </div>
    `;
	}

	/**
	 * Format date for display
	 */
	function formatDate(dateString) {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		} catch (error) {
			return dateString;
		}
	}

	/**
	 * Escape HTML to prevent XSS
	 */
	function escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	/**
	 * Check if an input element is focused
	 */
	function isInputFocused() {
		const activeElement = document.activeElement;
		return (
			activeElement &&
			(activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)
		);
	}

	// Initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
