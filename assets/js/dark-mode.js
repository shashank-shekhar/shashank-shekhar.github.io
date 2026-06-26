/**
 * Mono One Theme - Dark Mode Toggle
 * Handles dark mode switching and persistence
 */

(function () {
	'use strict';

	const STORAGE_KEY = 'monadic-theme';
	const THEME_TOGGLE_ID = 'theme-toggle';

	// Initialize dark mode when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	function init() {
		// Check for saved theme preference or default to system preference
		const savedTheme = localStorage.getItem(STORAGE_KEY);
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const theme = savedTheme || (prefersDark ? 'dark' : 'light');

		// Apply the theme
		applyTheme(theme);

		// Set up toggle button
		const toggleButton = document.getElementById(THEME_TOGGLE_ID);
		if (toggleButton) {
			toggleButton.addEventListener('click', toggleTheme);
		}

		// Listen for system theme changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			if (!localStorage.getItem(STORAGE_KEY)) {
				applyTheme(e.matches ? 'dark' : 'light');
			}
		});
	}

	function applyTheme(theme) {
		// Set data-color-scheme attribute for tests and CSS
		document.documentElement.setAttribute('data-color-scheme', theme);

		// Also set class for backward compatibility
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function toggleTheme() {
		const isDark = document.documentElement.classList.contains('dark');
		const newTheme = isDark ? 'light' : 'dark';

		applyTheme(newTheme);
		localStorage.setItem(STORAGE_KEY, newTheme);
	}
})();
