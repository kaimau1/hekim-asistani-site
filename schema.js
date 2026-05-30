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
        inLanguage: 'tr-TR',
        publisher: { '@id': 'https://ahekplus.com/#organization' }
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://ahekplus.com/#software',
        name: 'Ahek Plus',
        applicationCategory: 'MedicalApplication',
        operatingSystem: 'Chrome, Web',
        url: 'https://ahekplus.com/',
        description: 'Aile hekimi ve aile sağlığı çalışanları için HYP hesaplama, ASÇ HYP, SINA takip, reçete ve e-Nabız iş akışlarını destekleyen Ahek Plus aracı.',
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
        '@id': 'https://ahekplus.com/#webpage',
        url: 'https://ahekplus.com/',
        name: 'HYP Hesapla | Aile Hekimi HYP Hesaplama ve ASÇ HYP - Ahek Plus',
        description: 'Aile hekimi ve hemşireler için HYP hesaplama, ASÇ HYP ve HYP katsayı hesabı.',
        inLanguage: 'tr-TR',
        isPartOf: { '@id': 'https://ahekplus.com/#website' },
        about: { '@id': 'https://ahekplus.com/#software' },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: 'https://ahekplus.com/og-image.png'
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://ahekplus.com/#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'HYP Hesapla',
            item: 'https://ahekplus.com/'
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
