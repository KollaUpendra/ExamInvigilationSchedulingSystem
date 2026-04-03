/**
 * @file src/hooks/useIntersectionObserver.js
 * @description Custom React hook that adds the `.visible` class to
 * elements with the `.reveal` class as soon as they enter the viewport.
 *
 * How to use:
 *  1. Apply className="reveal" (and optionally "reveal-delay-N") to any element.
 *  2. Call useIntersectionObserver() once in a parent component (e.g. App.jsx).
 *  3. When the element scrolls into view, the hook adds ".visible" triggering the CSS animation.
 *
 * Options passed to IntersectionObserver:
 *  threshold : 0.12 — element is 12% visible before triggering
 */

import { useEffect } from 'react';

const useIntersectionObserver = () => {
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
            { threshold: 0.12 }
        );

        // Select all elements that want scroll-reveal
        const targets = document.querySelectorAll('.reveal');
        targets.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);
};

export default useIntersectionObserver;
