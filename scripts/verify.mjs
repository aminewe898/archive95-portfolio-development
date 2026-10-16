import { gzipSync } from 'node:zlib'
const origin = process.env.VERIFY_ORIGIN || 'http://localhost:3001'
const slugs = ['relay','local-ai-server','homelab-cloud','raspberry-pi-nas']
const paths = ['/','/en','/cv','/cv?lang=en',...slugs.flatMap(s=>[`/projects/${s}`,`/en/projects/${s}`]),'/assets/cv-mohamed-amine-aslimani.pdf','/robots.txt','/sitemap.xml','/icon.svg','/art/social.webp',...['welcome','relay','ai','lab','nas'].map(s=>`/art/retro/${s}.svg`)]
for(const path of paths){const response=await fetch(origin+path);if(!response.ok)throw new Error(`${path}: ${response.status}`);console.log(`${response.status} ${path}`)}
const response=await fetch(origin);const html=await response.text()
for(const expected of ['Mohamed','Amine','Aslimani','aslimani923@gmail.com',...slugs])if(!html.includes(expected))throw new Error(`Server HTML missing ${expected}`)
console.log('Core content and all project links are present in server HTML before JavaScript.')
console.log('Response headers:',response.headers.get('x-content-type-options'),response.headers.get('referrer-policy'))
const assets=new Set([...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)].map(m=>m[1]))
const sizes=[{asset:'HTML',gzip:gzipSync(html).length}]
const styles=[]
for(const asset of assets){const r=await fetch(origin+asset);const data=Buffer.from(await r.arrayBuffer());sizes.push({asset,gzip:gzipSync(data).length});if(asset.endsWith('.css'))styles.push(data.toString())}
const fonts=new Set(styles.flatMap(css=>[...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map(m=>m[1].replaceAll('"','').replaceAll("'",''))))
for(const font of fonts){const r=await fetch(new URL(font,origin+'/_next/static/chunks/'));if(r.ok)sizes.push({asset:font,gzip:(await r.arrayBuffer()).byteLength})}
const tower=await fetch(origin+'/art/retro/welcome.svg');sizes.push({asset:'/art/retro/welcome.svg',gzip:(await tower.arrayBuffer()).byteLength})
const total=sizes.reduce((sum,item)=>sum+item.gzip,0);console.log(JSON.stringify({estimatedInitialGzipBytes:total,estimatedInitialKiB:Math.round(total/1024),note:'HTML + initial JS/CSS + declared woff2 fonts + welcome artwork. Estimate, not a throttled browser transfer audit.',assets:sizes},null,2))
