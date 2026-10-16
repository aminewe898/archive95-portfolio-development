import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

// Original, editable vector artwork using a restricted early-PC palette.
const dir = 'public/art/retro'
await mkdir(dir, { recursive: true })
const rect = (x,y,w,h,c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`
const line = (d,c='#64d8cb') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="3"/>`
const label = (x,y,s,c='#e8ebdc',size=12) => `<text x="${x}" y="${y}" fill="${c}" font-family="monospace" font-size="${size}">${s}</text>`
const panel = (x,y,w,h) => rect(x+7,y+7,w,h,'#090e29')+rect(x,y,w,h,'#939c9c')+rect(x,y,w-4,h-4,'#dedfce')+rect(x+5,y+5,w-14,h-14,'#b7c0b5')
const monitor = (x,y,content='') => panel(x,y,150,112)+rect(x+13,y+12,120,77,'#101a39')+rect(x+63,y+112,24,14,'#a8b3a9')+panel(x+35,y+126,80,10)+rect(x+120,y+98,6,3,'#008080')+content
const rack = (x,y,n=3) => panel(x,y,96,n*34+18)+Array.from({length:n},(_,i)=>rect(x+10,y+10+i*34,72,26,'#586674')+rect(x+14,y+14+i*34,52,3,'#101a39')+rect(x+70,y+16+i*34,5,5,'#7af0c6')+rect(x+14,y+23+i*34,37,3,'#939c9c')).join('')
const disk = (x,y) => panel(x,y,72,62)+rect(x+12,y+10,48,16,'#162540')+rect(x+17,y+37,36,18,'#f5f0d8')+rect(x+25,y+40,20,3,'#939c9c')
const base = (title,body,subtitle) => `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#253553" stroke-width="1"/></pattern><pattern id="dots" width="4" height="4" patternUnits="userSpaceOnUse">${rect(0,0,1,1,'#52637b')}</pattern></defs>${rect(0,0,640,360,'#14213c')}${rect(0,55,640,261,'url(#grid)')}${rect(16,16,8,8,'#7af0c6')}${label(34,25,'ARCHIVE95 / '+title)}${label(510,25,'VOL. 01', '#96adaf')}${rect(24,294,592,20,'url(#dots)')}${body}${line('M24 322H616','#52637b')}${label(24,343,subtitle,'#96adaf',11)}${label(560,343,'A—95','#7af0c6',11)}</svg>`
const scenes = {
  relay: ['RELAY.EXE', monitor(48,110,label(74,145,'VOICE_IN','#7af0c6')+line('M75 170h6v-8h6v18h6v-28h6v37h6v-22h6v10h10'))+line('M198 166h67v-26h48')+rack(315,90,4)+line('M411 166h45')+panel(460,120,124,100)+rect(469,130,104,18,'#008080')+label(477,143,'TICKET_001','#fff',10)+label(477,170,'[x] received','#14213c',10)+label(477,187,'[x] queued','#14213c',10)+label(477,204,'[ ] resolve','#14213c',10)+label(50,282,'VOICE')+label(316,282,'DURABLE QUEUE')+label(460,282,'SUPPORT'), '01 / VOICE TO TICKET / CONCEPTUAL SYSTEM'],
  ai: ['LOCAL_AI.SYS',rack(78,85,5)+line('M174 175h65')+panel(240,130,142,92)+rect(256,146,110,60,'#008080')+rect(287,155,48,42,'#14213c')+label(298,181,'GPU','#7af0c6',12)+Array.from({length:8},(_,i)=>rect(250+i*16,124,7,6,'#d7bd74')+rect(250+i*16,222,7,6,'#d7bd74')).join('')+line('M382 175h47')+monitor(432,96,label(455,127,'LOCAL INFERENCE','#7af0c6',10)+label(455,150,'> hello, world','#fff',10)+rect(455,166,53,3,'#7af0c6'))+label(80,282,'HOST')+label(256,282,'COMPUTE')+label(440,282,'LOCAL TERMINAL'),'02 / LOCAL AI / YOUR HARDWARE, YOUR MODELS'],
  lab: ['HOMELAB.NET',monitor(53,105,label(77,140,'PROXMOX VE','#7af0c6')+label(77,162,'VM 01  [on]','#fff',10)+label(77,180,'VM 02  [on]','#fff',10))+line('M203 165h84v-40h37M287 165v67h37')+rack(327,72,2)+rack(327,199,2)+line('M423 116h63v58h34M423 240h63v-66')+panel(506,142,90,70)+rect(519,155,60,23,'#008080')+label(526,172,'HTTPS','#fff',12)+label(523,199,'443','#14213c')+label(54,282,'VIRTUAL MACHINES')+label(506,282,'GATEWAY'),'03 / HOMELAB / CONNECT, ISOLATE, EXPERIMENT'],
  nas: ['STORAGE.DRV',panel(70,125,136,100)+rect(83,138,108,73,'#008060')+rect(111,155,41,35,'#14213c')+rect(166,140,18,25,'#dedfce')+rect(166,178,18,25,'#dedfce')+label(115,177,'PI','#7af0c6')+line('M206 175h73M351 175h65')+disk(279,142)+monitor(422,99,label(445,131,'SHARED FILES','#7af0c6',10)+label(445,154,'/documents','#fff',10)+label(445,174,'/backups','#fff',10))+label(71,282,'RASPBERRY PI')+label(279,282,'DISK')+label(424,282,'REMOTE ACCESS'),'04 / NETWORK STORAGE / A HOME FOR YOUR FILES'],
}
for (const [key,[title,body,subtitle]] of Object.entries(scenes)) await writeFile(`${dir}/${key}.svg`,base(title,body,subtitle))
const welcome=base('PERSONAL COMPUTER',monitor(232,94,label(255,128,'HELLO, WORLD.','#7af0c6',12)+label(255,151,'C:\\ARCHIVE95>','#fff',11)+rect(255,167,7,12,'#7af0c6'))+rack(410,99,4)+disk(116,165)+line('M188 196h36M384 156h25')+label(230,277,'SYSTEMS / NETWORKS / AUTOMATION','#7af0c6',11),'BUILT WITH CURIOSITY. OPEN FOR EXPLORATION.')
await writeFile(`${dir}/welcome.svg`,welcome)
await sharp(Buffer.from(welcome)).resize(1200,630,{fit:'cover'}).webp({quality:90}).toFile('public/art/social.webp')
await writeFile('public/icon.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${rect(0,0,32,32,'#008080')}${rect(4,4,24,19,'#dedfce')}${rect(7,7,18,12,'#000080')}${rect(10,11,4,2,'#7af0c6')}${rect(16,14,5,2,'#fff')}${rect(13,23,6,3,'#939c9c')}${rect(8,26,16,3,'#dedfce')}</svg>`)
console.log('Generated five original retro illustrations, social image, and favicon.')
