/**
 * @file src/hooks/useIntersectionObserver.js
 * @description Custom React hook that adds the `.visible` class to
 * elements matching `selector` as soon as they enter the viewport.
 *
 * How to use:
 *  1. Apply className="reveal" (and optionally "reveal-delay-N") to any element.
 *  2. Call useIntersectionObserver('.reveal', { threshold: 0.12 }) in a parent.
 *  3. When the element scrolls into view, the hook adds ".visible" triggering the CSS animation.
 *
 * @param {string} selector  - CSS selector for elements to observe (default: '.reveal')
 * @param {IntersectionObserverInit} options  - IntersectionObserver options (default: { threshold: 0.12 })
 */

import { useEffect } from 'react';

const useIntersectionObserver = (selector = '.reveal', options = { threshold: 0.12 }) => {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        // Unobserve after animating to prevent re-triggering
                        observer.unobserve(entry.target);
                    }
                });
            },
            options
        );

        // Select all elements that want scroll-reveal
        const targets = document.querySelectorAll(selector);
        targets.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    // The selector and options are treated as stable config — intentionally not in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};

export default useIntersectionObserver;
