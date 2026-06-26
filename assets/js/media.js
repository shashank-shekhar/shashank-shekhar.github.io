/**
 * Media JavaScript - Carousel Functionality
 * Handles carousel navigation, keyboard support, and touch gestures
 */

(function () {
	'use strict';

	// WeakMap to store cleanup functions for each carousel
	const carouselCleanup = new WeakMap();

	/**
	 * Initialize a single carousel
	 */
	function initCarousel(carousel) {
		// Skip if already initialized
		if (carouselCleanup.has(carousel)) {
			return;
		}

		const slides = carousel.querySelectorAll('.carousel-slide');
		const dots = carousel.querySelectorAll('.carousel-dot');
		const prevBtn = carousel.querySelector('[data-carousel-prev]');
		const nextBtn = carousel.querySelector('[data-carousel-next]');

		if (slides.length === 0) return;

		let currentIndex = 0;
		let touchStartX = 0;
		let touchEndX = 0;
		let autoPlayTimer = null;

		/**
		 * Show slide at given index
		 */
		function showSlide(index) {
			// Wrap around
			if (index < 0) {
				index = slides.length - 1;
			} else if (index >= slides.length) {
				index = 0;
			}

			currentIndex = index;

			// Update slides
			slides.forEach((slide, i) => {
				slide.classList.toggle('active', i === currentIndex);
			});

			// Update dots
			dots.forEach((dot, i) => {
				dot.classList.toggle('active', i === currentIndex);
			});
		}

		/**
		 * Go to next slide
		 */
		function nextSlide() {
			showSlide(currentIndex + 1);
		}

		/**
		 * Go to previous slide
		 */
		function prevSlide() {
			showSlide(currentIndex - 1);
		}

		// Button click handlers
		if (prevBtn) {
			prevBtn.addEventListener('click', prevSlide);
		}

		if (nextBtn) {
			nextBtn.addEventListener('click', nextSlide);
		}

		// Dot click handlers
		dots.forEach((dot, index) => {
			dot.addEventListener('click', () => showSlide(index));
		});

		// Keyboard navigation
		carousel.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowLeft') {
				prevSlide();
				e.preventDefault();
			} else if (e.key === 'ArrowRight') {
				nextSlide();
				e.preventDefault();
			}
		});

		// Touch gestures - store handlers for cleanup
		const touchStartHandler = (e) => {
			touchStartX = e.changedTouches[0].screenX;
		};

		const touchEndHandler = (e) => {
			touchEndX = e.changedTouches[0].screenX;
			handleSwipe();
		};

		function handleSwipe() {
			const swipeThreshold = 50;
			const diff = touchStartX - touchEndX;

			if (Math.abs(diff) > swipeThreshold) {
				if (diff > 0) {
					// Swiped left - next slide
					nextSlide();
				} else {
					// Swiped right - previous slide
					prevSlide();
				}
			}
		}

		carousel.addEventListener('touchstart', touchStartHandler, { passive: true });
		carousel.addEventListener('touchend', touchEndHandler, { passive: true });

		// Make carousel focusable for keyboard navigation
		carousel.setAttribute('tabindex', '0');

		// Auto-play if configured (optional)
		const autoPlay = carousel.dataset.autoplay === 'true';
		const pauseOnHover = () => {
			if (autoPlayTimer) {
				clearInterval(autoPlayTimer);
				autoPlayTimer = null;
			}
		};
		const resumeAutoPlay = () => {
			if (autoPlay && !autoPlayTimer) {
				const interval = parseInt(carousel.dataset.interval || '5000', 10);
				autoPlayTimer = setInterval(nextSlide, interval);
			}
		};
		const handleVisibilityChange = () => {
			if (document.hidden) {
				pauseOnHover();
			} else if (autoPlay) {
				resumeAutoPlay();
			}
		};

		if (autoPlay) {
			const interval = parseInt(carousel.dataset.interval || '5000', 10);
			autoPlayTimer = setInterval(nextSlide, interval);

			// Pause on hover
			carousel.addEventListener('mouseenter', pauseOnHover);
			carousel.addEventListener('mouseleave', resumeAutoPlay);

			// Pause when not visible
			document.addEventListener('visibilitychange', handleVisibilityChange);
		}

		// Store cleanup function
		carouselCleanup.set(carousel, () => {
			if (autoPlayTimer) {
				clearInterval(autoPlayTimer);
			}
			carousel.removeEventListener('mouseenter', pauseOnHover);
			carousel.removeEventListener('mouseleave', resumeAutoPlay);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			carousel.removeEventListener('touchstart', touchStartHandler);
			carousel.removeEventListener('touchend', touchEndHandler);
		});
	}

	/**
	 * Initialize video facade (lite embed) click-to-load
	 */
	function initVideoFacades() {
		document.querySelectorAll('.video-facade').forEach(function (container) {
			if (container.dataset.initialized) return;
			container.dataset.initialized = 'true';

			container.addEventListener('click', function () {
				var embedUrl = container.dataset.embedUrl;
				var title = container.dataset.videoTitle || 'Video';
				if (!embedUrl) return;

				var iframe = document.createElement('iframe');
				iframe.src = embedUrl + (embedUrl.indexOf('?') >= 0 ? '&' : '?') + 'autoplay=1';
				iframe.setAttribute('frameborder', '0');
				iframe.setAttribute(
					'allow',
					'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
				);
				iframe.setAttribute('allowfullscreen', '');
				iframe.setAttribute('title', title);
				iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none';

				while (container.firstChild) {
					container.removeChild(container.firstChild);
				}
				container.appendChild(iframe);
				container.classList.remove('video-facade');
			});
		});
	}

	/**
	 * Initialize all carousels on the page
	 */
	function initAllCarousels() {
		const carousels = document.querySelectorAll('[data-carousel]');
		carousels.forEach(initCarousel);
	}

	function initAll() {
		initAllCarousels();
		initVideoFacades();
	}

	// Initialize on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initAll);
	} else {
		initAll();
	}

	// Also initialize after dynamic content loads
	if (typeof window !== 'undefined') {
		window.initCarousels = initAllCarousels;
		window.initVideoFacades = initVideoFacades;
	}
})();
