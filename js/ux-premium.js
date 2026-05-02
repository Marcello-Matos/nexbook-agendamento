/* ============================================================
   UX PREMIUM JS - Nexbook
   Ripple, Counter Animation, Skeleton, Scroll Reveal
   ============================================================ */
(function() {
    'use strict';

    /* ── RIPPLE EFFECT ──────────────────────────────────────── */
    function createRipple(e) {
        var btn = e.currentTarget;
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        var ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.cssText = 'width:' + size + 'px;height:' + size + 'px;'
            + 'left:' + (e.clientX - rect.left - size / 2) + 'px;'
            + 'top:' + (e.clientY - rect.top - size / 2) + 'px;';
        btn.classList.add('ripple-host');
        btn.appendChild(ripple);
        setTimeout(function() { ripple.remove(); }, 700);
    }

    function applyRipple(root) {
        var btns = (root || document).querySelectorAll(
            '.btn-primary,.btn-secondary,.btn-danger,.nav-item'
        );
        btns.forEach(function(btn) {
            if (!btn._rippleReady) {
                btn._rippleReady = true;
                btn.addEventListener('click', createRipple);
            }
        });
    }

    /* ── COUNTER ANIMATION ──────────────────────────────────── */
    function animateCounter(el, target) {
        if (isNaN(target) || !el) return;
        var start = 0;
        var duration = 1100;
        var startTime = null;
        function step(now) {
            if (!startTime) startTime = now;
            var p = Math.min((now - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(start + (target - start) * eased);
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target;
        }
        requestAnimationFrame(step);
    }

    window.uxAnimateStats = function() {
        ['todayCount','clientsValue','attendanceValue'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                var val = parseInt(el.textContent, 10);
                if (!isNaN(val)) animateCounter(el, val);
            }
        });
    };

    /* ── SKELETON LOADER ────────────────────────────────────── */
    function skeletonItem() {
        return '<div style="padding:14px 16px;display:flex;gap:12px;align-items:center">'
            + '<div class="skeleton" style="width:40px;height:40px;border-radius:50%;flex-shrink:0"></div>'
            + '<div style="flex:1;display:flex;flex-direction:column;gap:8px">'
            + '<div class="skeleton" style="height:13px;width:55%"></div>'
            + '<div class="skeleton" style="height:11px;width:38%"></div>'
            + '</div>'
            + '<div class="skeleton" style="width:72px;height:22px;border-radius:20px"></div>'
            + '</div>';
    }

    window.uxShowSkeleton = function(containerId, count) {
        var el = document.getElementById(containerId);
        if (!el) return;
        var html = '';
        for (var i = 0; i < (count || 3); i++) html += skeletonItem();
        el.innerHTML = html;
    };

    /* ── SCROLL REVEAL ──────────────────────────────────────── */
    function initScrollReveal() {
        if (!window.IntersectionObserver) return;
        var io = new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.08 });

        document.querySelectorAll('.stat-card').forEach(function(card, i) {
            card.classList.add('reveal');
            card.style.transitionDelay = (i * 80) + 'ms';
            io.observe(card);
        });
    }

    /* ── CURRENCY FORMAT NICE ───────────────────────────────── */
    window.uxFormatCurrency = function(val) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency', currency: 'BRL'
        }).format(val || 0);
    };

    /* ── MUTATION OBSERVER — reaplica ripple ────────────────── */
    if (window.MutationObserver) {
        var mo = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(n) {
                    if (n.nodeType === 1) applyRipple(n);
                });
            });
        });
        document.addEventListener('DOMContentLoaded', function() {
            mo.observe(document.body, { childList: true, subtree: true });
        });
    }

    /* ── INIT ─────────────────────────────────────────────────── */
    function init() {
        applyRipple();
        initScrollReveal();

        /* Skeleton na lista de agendamentos ao abrir */
        if (document.getElementById('appointmentsList')) {
            var list = document.getElementById('appointmentsList');
            if (list && list.querySelector('.loading-state')) {
                window.uxShowSkeleton('appointmentsList', 4);
            }
        }

        /* Anima counters apos dados carregarem */
        var _origUpdate = window.updateDashboardUI;
        if (typeof _origUpdate === 'function') {
            window.updateDashboardUI = function(data) {
                _origUpdate(data);
                setTimeout(window.uxAnimateStats, 50);
            };
        } else {
            /* fallback: aguarda 1.5s e anima */
            setTimeout(window.uxAnimateStats, 1500);
        }

        /* Reaplica ripple pos-render */
        setTimeout(applyRipple, 800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
