/**
 * Priority+ Navigation
 *
 * Reads the navbar as-is, creates a "More" overflow dropdown entirely in JS,
 * and moves items in/out based on available space. The template renders all
 * items normally — this script is fully self-contained with no template coupling.
 */
(function () {
	'use strict';

	function init() {
		var menu = document.querySelector('.navbar-menu');
		if (!menu) return;

		// Create the overflow "More" toggle (hidden until needed)
		var overflow = document.createElement('div');
		overflow.className = 'navbar-dropdown navbar-overflow';
		overflow.style.display = 'none';
		overflow.innerHTML =
			'<button class="navbar-link dropdown-toggle" aria-expanded="false" aria-haspopup="true">' +
			'More <svg class="dropdown-chevron" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">' +
			'<path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
			'</svg>' +
			'</button>' +
			'<div class="dropdown-menu"></div>';
		menu.appendChild(overflow);

		var overflowMenu = overflow.querySelector('.dropdown-menu');

		// Snapshot of all items (excluding the overflow toggle itself)
		var items = [];
		var children = menu.children;
		for (var i = 0; i < children.length - 1; i++) {
			items.push(children[i]);
		}

		function update() {
			// Restore all items to the menu so we can measure their natural widths
			overflow.style.display = 'none';
			for (var i = 0; i < items.length; i++) {
				items[i].style.display = '';
				// Move back to menu if it was in overflow
				if (items[i].parentNode !== menu) {
					menu.insertBefore(items[i], overflow);
				}
			}

			var menuWidth = menu.offsetWidth;
			var overflowWidth = getOverflowWidth();
			var available = menuWidth;
			var usedWidth = 0;
			var splitAt = items.length; // index of first item to move to overflow

			for (var i = 0; i < items.length; i++) {
				var itemWidth = items[i].offsetWidth;
				var needed = usedWidth + itemWidth;
				// If adding this item would overflow (accounting for "More" button), split here
				if (needed + overflowWidth > available && i < items.length) {
					splitAt = i;
					break;
				}
				usedWidth = needed;
			}

			// Move overflow items into the dropdown
			overflowMenu.innerHTML = '';
			for (var i = splitAt; i < items.length; i++) {
				items[i].style.display = 'none';
				overflowMenu.appendChild(cloneAsDropdownItem(items[i]));
			}

			overflow.style.display = splitAt < items.length ? '' : 'none';
		}

		// Measure the "More" button width without displaying it visibly
		function getOverflowWidth() {
			overflow.style.display = '';
			overflow.style.visibility = 'hidden';
			var w = overflow.offsetWidth;
			overflow.style.visibility = '';
			overflow.style.display = 'none';
			return w;
		}

		// Clone a nav item as dropdown item(s)
		function cloneAsDropdownItem(item) {
			var frag = document.createDocumentFragment();

			if (item.classList.contains('navbar-dropdown')) {
				// Item with children: render as group label + child links
				var toggle = item.querySelector('.dropdown-toggle');
				var label = document.createElement('span');
				label.className = 'dropdown-group-label';
				label.innerHTML = toggle ? toggle.innerHTML : '';
				frag.appendChild(label);

				var childLinks = item.querySelectorAll('.dropdown-item');
				for (var i = 0; i < childLinks.length; i++) {
					var clone = childLinks[i].cloneNode(true);
					clone.className = 'dropdown-item';
					frag.appendChild(clone);
				}
			} else {
				// Regular link
				var clone = item.cloneNode(true);
				clone.className = 'dropdown-item';
				clone.style.display = '';
				frag.appendChild(clone);
			}

			return frag;
		}

		// Run on load and on resize
		update();

		var timer;
		window.addEventListener('resize', function () {
			clearTimeout(timer);
			timer = setTimeout(update, 80);
		});

		setupDropdownToggles();
	}

	// Tap/click to open dropdowns. The menus otherwise open only via CSS :hover,
	// so on touch devices the "More" overflow (which can hold several nav
	// destinations) and any folder dropdown were unreachable. Delegated so it
	// covers both the JS-built overflow and template folder dropdowns, and keeps
	// aria-expanded in sync.
	function setupDropdownToggles() {
		function closeAll(except) {
			var open = document.querySelectorAll('.navbar-dropdown.is-open');
			for (var i = 0; i < open.length; i++) {
				if (open[i] === except) continue;
				open[i].classList.remove('is-open');
				var t = open[i].querySelector('.dropdown-toggle');
				if (t) t.setAttribute('aria-expanded', 'false');
			}
		}

		document.addEventListener('click', function (e) {
			var toggle = e.target.closest ? e.target.closest('.dropdown-toggle') : null;
			if (!toggle) {
				closeAll(null); // outside click closes everything
				return;
			}
			var dropdown = toggle.closest('.navbar-dropdown');
			if (!dropdown) return;
			// A folder toggle is a real link to that folder's own index (e.g.
			// "Blog" -> /blog/). Where :hover is real (mouse/trackpad), the CSS
			// above already reveals the dropdown on hover, so let the click
			// navigate through instead of trapping the folder's own page behind
			// a toggle-only interaction. Only intercept on touch/coarse pointers,
			// which have no hover and need the tap to open the menu instead.
			if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
				return;
			}
			e.preventDefault();
			var willOpen = !dropdown.classList.contains('is-open');
			closeAll(dropdown);
			dropdown.classList.toggle('is-open', willOpen);
			toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
		});

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') closeAll(null);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
