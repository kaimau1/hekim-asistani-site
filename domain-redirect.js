(() => {
  const eskiAlanlar = new Set(['hekimasistani.com', 'www.hekimasistani.com']);
  if (!eskiAlanlar.has(window.location.hostname.toLowerCase())) return;

  const hedef = new URL(window.location.href);
  hedef.protocol = 'https:';
  hedef.hostname = 'ahekplus.com';
  window.location.replace(hedef.toString());
})();
