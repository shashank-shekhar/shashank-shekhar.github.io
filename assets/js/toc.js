/**
 * TOC scroll-spy — highlights the active heading link as user scrolls
 */
(function () {
	const tocLinks = document.querySelectorAll('.toc-link');
	if (tocLinks.length === 0) return;

	const headingIds = Array.from(tocLinks).map((link) => (link.getAttribute('href') || '').replace('#', ''));

	let activeId = headingIds[0] || null;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					activeId = entry.target.id;
				}
			});
			tocLinks.forEach((link) => {
				const href = link.getAttribute('href') || '';
				link.classList.toggle('toc-active', href === '#' + activeId);
			});
		},
		{
			rootMargin: '0px 0px -70% 0px',
			threshold: 0,
		},
	);

	headingIds.forEach((id) => {
		const el = document.getElementById(id);
		if (el) observer.observe(el);
	});
})();
