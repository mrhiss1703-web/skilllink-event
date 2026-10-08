/**
 * SkillLink Event Agency - Minimal Instant Portal Redirect
 */

document.addEventListener('DOMContentLoaded', () => {
  try {
    const target = new URL(window.SKILLLINK_PORTAL_URL || window.location.origin);
    target.pathname = document.body.dataset.portalRoute || '/';
    target.search = '';
    target.hash = '';

    const link = document.getElementById('portal-link');
    if (link) link.href = target.href;

    // Chuyển hướng ngay lập tức sau hiệu ứng nhẹ 150ms
    setTimeout(() => {
      window.location.replace(target.href);
    }, 150);
  } catch (err) {
    const fallbackUrl = window.SKILLLINK_PORTAL_URL || '/';
    window.location.replace(fallbackUrl);
  }
});
