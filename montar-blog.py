# Monta un artículo del blog en la rama actual: página, destacado y sitemap.
#   PYTHONIOENCODING=utf-8 python -I montar-blog.py blog-fuentes/<nombre>.json
# El .json lleva title (<=60), desc (120-160), h1, fecha, imagen, resumen y FAQ;
# el .html, el cuerpo. Plantilla: blog-tipos-bloques-de-hormigon.html. Las
# ramas programadas van encadenadas: ver la memoria blog-web-seo.
import json, os, re, sys, html as H, subprocess
RAIZ = r'v:\00_SKILLS-CLAUDE\00_Web_Barruca'
sp = json.load(open(sys.argv[1], encoding='utf-8'))
cuerpo = open(os.path.join(RAIZ, *sp['cuerpo'].split('/')), encoding='utf-8').read()
leer = lambda f: open(RAIZ + '\\' + f, encoding='utf-8').read()
def escribir(f, s):
    with open(RAIZ + '\\' + f, 'w', encoding='utf-8') as fh: fh.write(s)

# 1 · Página, a partir de la plantilla de la guía de tipos
s = leer('blog-tipos-bloques-de-hormigon.html')
URL = 'https://barruca.es/' + sp['slug']; IMG = 'https://barruca.es' + sp['img']
assert len(sp['title']) <= 60, len(sp['title'])
assert 120 <= len(sp['desc']) <= 160, len(sp['desc'])
ld = [{"@context": "https://schema.org", "@type": "Article", "headline": sp['h1'], "description": sp['desc'], "image": IMG,
       "datePublished": sp['fecha'], "dateModified": sp['fecha'], "mainEntityOfPage": URL,
       "author": {"@type": "Organization", "name": "Bloques Barruca", "url": "https://barruca.es/"},
       "publisher": {"@type": "Organization", "name": "Bloques Barruca", "url": "https://barruca.es/"}},
      {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in sp['faq']]},
      {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://barruca.es/"},
          {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://barruca.es/blog.html"},
          {"@type": "ListItem", "position": 3, "name": sp['miga'], "item": URL}]}]
s = re.sub(r'<title>.*?</title>', lambda m: '<title>' + sp['title'] + '</title>', s, count=1)
for pat, val in [(r'(<meta name="description" content=")[^"]*', sp['desc']), (r'(<meta property="og:description" content=")[^"]*', sp['desc']),
                 (r'(<meta property="og:title" content=")[^"]*', sp['h1']), (r'(<meta property="og:image" content=")[^"]*', IMG)]:
    s = re.sub(pat, lambda m: m.group(1) + val, s, count=1)
s = s.replace('https://barruca.es/blog-tipos-bloques-de-hormigon.html', URL)
a = s.index('<script type="application/ld+json">'); b = s.rindex('</script>', 0, s.index('<link rel="preconnect"')) + 9
s = s[:a] + '\n'.join('<script type="application/ld+json">\n' + json.dumps(x, ensure_ascii=False, indent=2) + '\n  </script>' for x in ld) + s[b:]
s = re.sub(r'(<h1 class="[^"]*">).*?(</h1>)', lambda m: m.group(1) + sp['h1'] + m.group(2), s, count=1, flags=re.S)
s = re.sub(r'(<span class="inline-flex items-center text-\[10px\][^>]*>)Guía técnica(</span>)', lambda m: m.group(1) + sp['tag'] + m.group(2), s, count=1)
i = s.index('<div class="prose">') + len('<div class="prose">'); j = s.index('</div>\n\n          <div class="mt-10 bg-zinc-900')
s = s[:i] + '\n\n' + cuerpo + '\n          ' + s[j:]
s = s.replace('¿Qué bloque necesita tu obra?', sp['cta'][0]).replace('Pide formatos, cantidades y plazos', sp['cta'][1])
for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S): json.loads(m)
escribir(sp['slug'], s)
body = s[s.index('<main>'):s.index('</main>')]
txt = H.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', body))).lower()
print('página:', sp['slug'], '·', len(txt.split()), 'palabras · keyword', sp['kw'], '×', txt.count(sp['kw'].lower()))

# 2 · Destacado en blog.html e index.html; el anterior baja a la cuadrícula
def destacado(f, a_rejilla):
    s = leer(f)
    i = s.index('<!-- Post destacado -->'); j = s.index('</a>', i) + 4
    v = s[i:j]
    prev = {'href': re.search(r'href="([^"]+)"', v).group(1), 'img': re.search(r'<img src="([^"]+)"', v).group(1),
            'alt': re.search(r'alt="([^"]+)"', v).group(1), 'tag': re.search(r'rounded-full mb-4">([^<]+)<', v).group(1),
            'tit': re.search(r'transition-colors">([^<]+)</h[23]>', v).group(1), 'res': re.search(r'line-clamp-3 mb-6">([^<]+)</p>', v).group(1)}
    n = v.replace(prev['href'], '/' + sp['slug'])
    n = re.sub(r'<img src="[^"]+"(\s*)alt="[^"]+"', lambda m: '<img src="' + sp['img'] + '"' + m.group(1) + 'alt="' + sp['alt'] + '"', n, count=1)
    n = re.sub(r'class="w-full h-full object-(cover|contain bg-white)" />', 'class="w-full h-full ' + sp.get('fit', 'object-cover') + '" />', n, count=1)
    n = n.replace('rounded-full mb-4">' + prev['tag'] + '<', 'rounded-full mb-4">' + sp['tag'] + '<', 1)
    n = n.replace('transition-colors">' + prev['tit'] + '</h', 'transition-colors">' + sp['h1'] + '</h', 1)
    n = n.replace('line-clamp-3 mb-6">' + prev['res'] + '</p>', 'line-clamp-3 mb-6">' + sp['resumen'] + '</p>', 1)
    assert sp['h1'] in n and sp['img'] in n and sp['resumen'] in n, f
    s = s[:i] + n + s[j:]
    if a_rejilla:
        tagcls = 'text-emerald-700 bg-emerald-50 border border-emerald-100' if prev['tag'] == 'Sostenibilidad' else 'text-accent-700 bg-accent-50 border border-accent-100'
        card = f'''<a href="{prev['href']}"
             class="reveal text-left blog-card group bg-offwhite border border-zinc-100 rounded-2xl overflow-hidden hover:border-zinc-200 hover:shadow-md transition-all duration-200 block">
            <div class="blog-img aspect-video">
              <img src="{prev['img']}" alt="{prev['alt']}" class="w-full h-full object-cover" />
            </div>
            <div class="p-5">
              <span class="inline-flex w-fit items-center text-[10px] font-bold uppercase tracking-widest {tagcls} px-2 py-0.5 rounded-full mb-2">{prev['tag']}</span>
              <h3 class="text-base font-bold tracking-tight text-zinc-900 mb-1 leading-snug group-hover:text-accent-700 transition-colors line-clamp-2">{prev['tit']}</h3>
              <p class="text-zinc-500 text-sm leading-relaxed line-clamp-2 mb-3">{prev['res']}</p>
              <span class="inline-flex items-center gap-1 text-xs font-semibold text-accent-700">Leer artículo <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
            </div>
          </a>

          '''
        k = s.index('<!-- Grid resto de posts -->'); k = s.index('<a href=', k)
        s = s[:k] + card + s[k:]
    escribir(f, s)
    return prev['href']
print('destacado anterior:', destacado('blog.html', True), '-> cuadricula')
destacado('index.html', False)

# 3 · Sitemap
print(subprocess.run(['node', 'generate-sitemap.js'], cwd=RAIZ, capture_output=True, text=True).stdout.strip().splitlines()[-1])
