export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const RUNRUNIT_TOKEN = process.env.RUNRUNIT_TOKEN;
  const RUNRUNIT_APPKEY = process.env.RUNRUNIT_APPKEY;
  const CLIENT_ID = process.env.CLIENT_ID;

  try {
    // Busca abertas
    let urlOpen = 'https://runrun.it/api/v1.0/tasks?limit=200&is_subtask=false&sort_by=updated_at&sort_order=desc';
    if (CLIENT_ID) urlOpen += '&client_id=' + CLIENT_ID;

    // Busca fechadas (is_closed=true)
    let urlClosed = 'https://runrun.it/api/v1.0/tasks?limit=200&is_subtask=false&is_closed=true&sort_by=updated_at&sort_order=desc';
    if (CLIENT_ID) urlClosed += '&client_id=' + CLIENT_ID;

    const headers = {
      'App-Key': RUNRUNIT_APPKEY,
      'User-Token': RUNRUNIT_TOKEN,
      'Content-Type': 'application/json',
    };

    const [respOpen, respClosed] = await Promise.all([
      fetch(urlOpen, { headers }),
      fetch(urlClosed, { headers }),
    ]);

    const dataOpen   = respOpen.ok   ? await respOpen.json()   : [];
    const dataClosed = respClosed.ok ? await respClosed.json() : [];

    const open   = Array.isArray(dataOpen)   ? dataOpen   : (dataOpen.tasks   || dataOpen.data   || []);
    const closed = Array.isArray(dataClosed) ? dataClosed : (dataClosed.tasks || dataClosed.data || []);

    // Marca tasks fechadas com state explícito para o front identificar
    closed.forEach(t => { if (!t.state || t.state === 'queued') t.state = 'done'; });

    return res.status(200).json([...open, ...closed]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
