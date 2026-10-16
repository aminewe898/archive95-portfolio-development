import sharp from 'sharp'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
await mkdir('public/assets', { recursive: true })
await sharp('public/art/tower.png').resize(1200).webp({ quality: 83 }).toFile('public/art/tower.webp')
const info = await sharp('public/art/specimens.png').metadata()
for (const [name, x, y] of [['relay',0,0],['ai',1,0],['lab',0,1],['nas',1,1]]) {
 await sharp('public/art/specimens.png').extract({ left: x*Math.floor(info.width/2), top:y*Math.floor(info.height/2), width:Math.floor(info.width/2), height:Math.floor(info.height/2) }).resize(700).webp({ quality:82 }).toFile(`public/art/${name}.webp`)
}
await sharp('public/art/tower.png').resize(1200,630,{fit:'cover'}).composite([{input:Buffer.from(`<svg width="1200" height="630"><rect width="650" height="630" fill="#23251f"/><text x="65" y="110" fill="#b39a68" font-family="serif" font-size="32">ARCHIVE95 / PERSONAL ARCHIVE</text><text x="65" y="270" fill="#e8dfc9" font-family="serif" font-size="78">Mohamed Amine</text><text x="65" y="355" fill="#e8dfc9" font-family="serif" font-size="78">Aslimani</text><text x="65" y="470" fill="#e8dfc9" font-family="sans-serif" font-size="25">Systems · Networks · AI infrastructure</text><text x="65" y="530" fill="#b39a68" font-family="sans-serif" font-size="23">REUS, SPAIN</text></svg>`)}]).webp({quality:85}).toFile('public/art/social.webp')
for (const font of ['libre-caslon-display','source-sans-3']) await copyFile(`node_modules/@fontsource/${font}/LICENSE`,`public/assets/${font}-LICENSE.txt`)
const pdf = await PDFDocument.create()
const page = pdf.addPage([595,842]); const regular=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold)
page.drawRectangle({x:0,y:0,width:595,height:842,color:rgb(.94,.90,.82)})
let y=785
const line=(text,size=11,isBold=false)=>{page.drawText(text,{x:48,y,size,font:isBold?bold:regular,color:rgb(.15,.16,.13)});y-=size+9}
line('MOHAMED AMINE ASLIMANI',24,true);line('Junior systems and network technician',15);line('Reus, Spain | Junior roles and internships');line('aslimani923@gmail.com | github.com/aminewe898');y-=12
line('PROFILE',13,true)
line('Systems, automation and infrastructure labs, with practical repair experience.')
line('Interested in junior systems, networking and AI infrastructure opportunities.');y-=10
line('PROJECTS',13,true)
line('Relay - self-hosted IT service desk: Telegram voice messages to tickets.',11,true)
line('n8n, PostgreSQL, Groq, Docker. github.com/aminewe898/relay')
line('v1.0.0 documented; local checks. Fresh provider acceptance deferred.')
line('Local AI server - Docker, llama.cpp, LM Studio, Qwen, GPU inference.')
line('Homelab & cloud - Proxmox VE, Linux, Cloudflare, Oracle Cloud, HTTPS.')
line('Raspberry Pi / NAS - Samba, Tailscale, shared folders, persistent mounts.');y-=10
line('EXPERIENCE & EDUCATION',13,true)
line('Summer 2026 - Repair shop, Reus',11,true)
line('Accessories, protectors, data transfers, Android software support.')
line('2023 - Mobile and electronics repair, Morocco',11,true)
line('Diagnostics, component replacement, installations, customer support.')
line('2025-2026 - CFGM Microcomputer Systems & Networks',11,true)
line('Institut Baix Camp, Reus.')
line('ESO - Col-legi La Presentacio, Reus.');y-=10
line('SKILLS',13,true)
line('Linux, Windows, Docker, Proxmox, virtualization, routing, switching, VLANs.')
line('DNS, DHCP, IPv4/IPv6, Wi-Fi, n8n, APIs, Python, Git/GitHub, repair.');y-=10
line('LANGUAGES',13,true)
line('Arabic native | Spanish B2 | Catalan B1 | English C1 | French A2')
pdf.setTitle('Mohamed Amine Aslimani - CV');pdf.setAuthor('Mohamed Amine Aslimani')
await writeFile('public/assets/cv-mohamed-amine-aslimani.pdf',await pdf.save())
console.log('Artwork optimized, font licenses copied, factual CV PDF generated.')

await import('./retro-assets.mjs')
