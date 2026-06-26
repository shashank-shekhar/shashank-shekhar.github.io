/**
 * Mono One Theme - Core JavaScript
 * Handles copy button functionality for code blocks
 */

(function () {
	'use strict';

	// Initialize copy buttons when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initCopyButtons);
	} else {
		initCopyButtons();
	}

	function initCopyButtons() {
		// Check if copy button feature is enabled via CSS variable
		var copyButtonDisplay = getComputedStyle(document.documentElement).getPropertyValue('--monadic-copy-button').trim();
		if (copyButtonDisplay === 'none') return;

		// Inject copy buttons into all code blocks that have a <code> child
		var preElements = document.querySelectorAll('pre');
		preElements.forEach(function (pre) {
			if (!pre.querySelector('code')) return;
			if (pre.querySelector('.monadic-copy-button')) return;

			// Ensure pre has relative positioning for absolute button placement
			pre.style.position = 'relative';

			var button = document.createElement('button');
			button.className = 'monadic-copy-button';
			button.textContent = 'Copy';
			button.setAttribute('aria-label', 'Copy code to clipboard');
			pre.insertBefore(button, pre.firstChild);
		});

		// Attach click handlers to all copy buttons
		var copyButtons = document.querySelectorAll('.monadic-copy-button');

		copyButtons.forEach(function (button) {
			button.addEventListener('click', function () {
				var pre = this.closest('pre');
				if (!pre) return;

				var code = pre.querySelector('code');
				if (!code) return;

				// Extract text content from code lines
				var lines = code.querySelectorAll('.code-line');
				var text = '';

				if (lines.length > 0) {
					// Extract text from line spans (excluding line numbers)
					text = Array.from(lines)
						.map(function (line) {
							return line.textContent || '';
						})
						.join('\n');
				} else {
					// Fallback to full code text content
					text = code.textContent || '';
				}

				var btn = this;
				// Copy to clipboard
				navigator.clipboard
					.writeText(text)
					.then(function () {
						// Show success feedback
						var originalText = btn.textContent;
						btn.textContent = 'Copied!';
						btn.style.background = 'rgba(16, 185, 129, 0.2)';
						btn.style.color = 'rgb(16, 185, 129)';

						// Reset after 2 seconds
						setTimeout(function () {
							btn.textContent = originalText;
							btn.style.background = '';
							btn.style.color = '';
						}, 2000);
					})
					.catch(function (err) {
						console.error('Failed to copy text:', err);
						btn.textContent = 'Failed';

						setTimeout(function () {
							btn.textContent = 'Copy';
						}, 2000);
					});
			});
		});
	}
})();
