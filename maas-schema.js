(function () {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://ahekplus.com/#organization',
        name: 'Ahek Plus',
        url: 'https://ahekplus.com/',
        logo: 'https://ahekplus.com/favicon.png'
      },
      {
        '@type': 'WebSite',
        '@id': 'https://ahekplus.com/#website',
        url: 'https://ahekplus.com/',
        name: 'Ahek Plus',
        publisher: { '@id': 'https://ahekplus.com/#organization' },
        inLanguage: 'tr-TR'
      },
      {
        '@type': 'WebApplication',
        '@id': 'https://ahekplus.com/maas-hesaplama.html#application',
        name: 'Aile Hekimi Maaş Hesaplama 2026',
        url: 'https://ahekplus.com/maas-hesaplama.html',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        inLanguage: 'tr-TR',
        description: 'Aile hekimleri için nüfus puanı, HYP katsayısı, ASM gideri, vergi matrahı ve kesintilerle tahmini net maaş ve hakediş hesaplama aracı.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'TRY',
          availability: 'https://schema.org/InStock'
        },
        publisher: { '@id': 'https://ahekplus.com/#organization' }
      },
      {
        '@type': 'WebPage',
        '@id': 'https://ahekplus.com/maas-hesaplama.html#webpage',
        url: 'https://ahekplus.com/maas-hesaplama.html',
        name: 'Aile Hekimi Maaş Hesaplama 2026 - Ahek Plus',
        description: 'Aile hekimi bordro ve maaş hesaplama aracı: nüfus puanı, HYP katsayısı, ASM gideri, vergi matrahı ve kesintilerle net hakediş tahmini.',
        inLanguage: 'tr-TR',
        isPartOf: { '@id': 'https://ahekplus.com/#website' },
        about: { '@id': 'https://ahekplus.com/maas-hesaplama.html#application' },
        breadcrumb: { '@id': 'https://ahekplus.com/maas-hesaplama.html#breadcrumb' }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://ahekplus.com/maas-hesaplama.html#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Ahek Plus',
            item: 'https://ahekplus.com/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Aile Hekimi Maaş Hesaplama',
            item: 'https://ahekplus.com/maas-hesaplama.html'
          }
        ]
      }
    ]
  };

  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.textContent = JSON.stringify(graph);
  document.head.appendChild(el);
})();
