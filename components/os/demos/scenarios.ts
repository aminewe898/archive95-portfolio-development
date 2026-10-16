import type { IconName } from '../icons'

export type DemoStep = { name: string; icon: IconName; note: string; input: string; output: string }
export type DemoKind = 'relay' | 'ai' | 'lab' | 'nas'
type Translate = (es: string, en: string) => string

export function demoScenario(kind: DemoKind, alternate: boolean, t: Translate) {
  const step = (name: string, icon: IconName, note: string, input: string, output: string): DemoStep => ({ name, icon, note, input, output })
  if (kind === 'relay') return {
    title: 'RELAY / Workflow Editor',
    choices: [t('Nota de voz: impresora', 'Voice note: printer'), t('Nota ambigua: revisión humana', 'Ambiguous note: human review')],
    steps: [
      step('Telegram', 'mail', t('Llega una nota de voz de un usuario autorizado.', 'A voice note arrives from an authorized user.'), 'voice_note.ogg · demo user', alternate ? '“No funciona. ¿Podéis ayudar?”' : '“La impresora de recepción no imprime.”'),
      step('Ingress', 'keys', t('Valida el remitente y asigna una clave de idempotencia.', 'Validate the sender and assign an idempotency key.'), 'POST /voice · sample payload', 'authorized: true\njob_id: DEMO-001'),
      step('PostgreSQL', 'hardware', t('Guarda el trabajo antes de empezar a procesarlo.', 'Persist the job before processing begins.'), 'job_id: DEMO-001', 'state: queued\ncheckpoint: received'),
      step('n8n + Groq', 'automation', t('Un worker transcribe y extrae los campos del ticket.', 'A worker transcribes the audio and extracts ticket fields.'), 'voice_note.ogg', alternate ? 'summary: “No funciona”\nasset: unknown\nneeds_review: true' : 'summary: printer not printing\nlocation: reception\ncategory: hardware'),
      step(alternate ? t('Revisión humana', 'Human review') : t('Crear ticket', 'Create ticket'), alternate ? 'user' : 'doc', alternate ? t('Faltan datos: pide aclaración en vez de inventar un ticket.', 'Details are missing: request clarification instead of inventing a ticket.') : t('Resuelve el cliente y guarda un ticket estructurado.', 'Resolve the customer and save a structured ticket.'), 'structured fields', alternate ? 'status: awaiting_details\nquestion: which device?' : 'ticket: DEMO-042\nstatus: open'),
      step('Outbox', 'mail', t('Una respuesta persistente vuelve al usuario.', 'A durable reply goes back to the user.'), alternate ? 'clarification request' : 'ticket: DEMO-042', alternate ? t('¿Qué dispositivo falla y qué ocurre?', 'Which device is affected, and what happens?') : t('Ticket DEMO-042 creado. Te avisaremos.', 'Ticket DEMO-042 created. We’ll keep you updated.')),
    ],
  }
  if (kind === 'ai') return {
    title: 'LOCAL AI / Inference Console',
    choices: [t('Explicar una VLAN', 'Explain a VLAN'), t('Resumir un registro', 'Summarize a log')],
    steps: [
      step(t('Modelo', 'Model'), 'file', t('Selecciona un modelo local cuantizado.', 'Select a locally stored quantized model.'), 'Qwen · illustrative configuration', 'model.gguf · Q4'),
      step('RAM → VRAM', 'hardware', t('Carga los pesos en memoria. Los recursos limitan el tamaño del modelo.', 'Load model weights into memory. Resources constrain model size.'), 'model.gguf', 'weights loaded\nGPU layers ready'),
      step('Prompt', 'notepad', t('El texto se convierte en tokens de entrada.', 'Convert the prompt into input tokens.'), alternate ? t('Resume: DNS timeout; retry; resolved.', 'Summarize: DNS timeout; retry; resolved.') : t('¿Qué es una VLAN?', 'What is a VLAN?'), 'input tokens prepared'),
      step(t('Inferencia', 'Inference'), 'pc', t('El modelo calcula una respuesta en el equipo local.', 'The model computes a response on the local machine.'), 'input tokens + model weights', 'generating response…'),
      step(t('Respuesta', 'Response'), 'dos', t('Los tokens se muestran de forma incremental.', 'Display the output tokens incrementally.'), 'output token stream', alternate ? t('La consulta DNS falló inicialmente. El reintento resolvió el nombre correctamente.', 'The DNS query initially timed out. A retry resolved the name successfully.') : t('Una VLAN separa una red física en redes lógicas. Permite agrupar dispositivos y controlar el tráfico entre grupos.', 'A VLAN divides a physical network into logical networks. It groups devices and lets you control traffic between those groups.')),
      step(t('Finalizado', 'Complete'), 'computer', t('La sesión termina. Esta respuesta de ejemplo está predefinida.', 'The session ends. This example response is predefined.'), 'end of generation', 'session: complete\nexternal API calls: 0'),
    ],
  }
  if (kind === 'lab') return {
    title: 'HOMELAB / Network Monitor',
    choices: [t('Solicitud HTTPS', 'HTTPS request'), t('Servicio detenido → reinicio', 'Stopped service → restart')],
    steps: [
      step(t('Cliente', 'Client'), 'computer', t('Un navegador solicita el servicio de ejemplo.', 'A browser requests the example service.'), 'GET https://lab.example', 'request ready'),
      step('DNS', 'globe', t('El nombre se resuelve antes de conectar.', 'Resolve the hostname before connecting.'), 'lab.example', '203.0.113.10 · documentation address'),
      step('Gateway', 'network', t('La petición llega al punto de entrada HTTPS.', 'The request reaches the HTTPS entry point.'), 'TCP :443', 'TLS connection established'),
      step('Proxmox', 'hardware', t('El host ejecuta una máquina virtual Linux.', 'The host runs a Linux virtual machine.'), 'VM 101 · Linux', 'virtual network → VM 101'),
      step(alternate ? t('Reiniciar servicio', 'Restart service') : 'Linux service', alternate ? 'warning' : 'settings', alternate ? t('El operador detecta el servicio detenido y lo reinicia.', 'An operator detects the stopped service and restarts it.') : t('El servicio procesa la solicitud.', 'The service processes the request.'), alternate ? 'service: stopped' : 'GET /', alternate ? 'operator action: restart\nservice: running' : 'HTTP 200 · example page'),
      step(t('Monitor', 'Monitor'), 'desktop', t('Una comprobación confirma que el servicio responde.', 'A health check confirms that the service responds.'), 'GET /health', 'HTTP 200\nhealth: responding'),
    ],
  }
  return {
    title: 'PI NAS / File Transfer',
    choices: [t('Copiar documentos', 'Copy documents'), t('Copiar configuración', 'Copy configuration')],
    steps: [
      step(t('Archivos', 'Files'), 'folder', t('Selecciona un conjunto de archivos de ejemplo.', 'Select a set of example files.'), alternate ? 'configs/' : 'documents/', alternate ? 'smb.conf\nfstab\nnotes.txt' : 'resume.pdf\nnetwork.png\nreadme.txt'),
      step('Tailscale', 'network', t('La conexión remota llega a la red privada.', 'The remote connection reaches the private network.'), 'remote laptop', 'private connection ready'),
      step('Samba', 'keys', t('Comprueba el acceso a la carpeta compartida.', 'Check permission to access the shared folder.'), 'share: /archive', 'permission: read + write'),
      step(t('Transferencia', 'Transfer'), 'file', t('Los bloques se copian al almacenamiento conectado al Pi.', 'Copy file blocks to storage attached to the Pi.'), '3 example files', 'copying blocks…'),
      step(t('Verificar', 'Verify'), 'hardware', t('Compara las sumas de comprobación de origen y destino.', 'Compare source and destination checksums.'), 'source + destination', 'checksums: match'),
      step(t('Compartido', 'Shared'), 'folderOpen', t('Los archivos están disponibles. Una copia compartida no sustituye una copia de seguridad.', 'The files are available. Shared storage is not a substitute for a backup.'), '/archive', '3 files copied\nverification: complete'),
    ],
  }
}
