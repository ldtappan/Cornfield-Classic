require('dotenv').config();
const Fastify = require('fastify');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { tokenFor, isValid } = require('./totp');

const app = Fastify({ logger: true });
app.register(require('@fastify/cors'), { origin: true, credentials: true });

const {
  PORT = 8080,
  JWT_SECRET = 'dev',
  TOTP_SECRET = 'totp',
  ADMIN_KEY = 'admin',
  EVENT_ID = 'demo-event',
  GATE_ID = 'main',
  TOKEN_WINDOW_SECONDS = 10,
  MIN_LAP_SECONDS = 10
} = process.env;

function signRider(rider) {
  return jwt.sign({ sub: rider.id, bib: rider.bib }, JWT_SECRET, { expiresIn: '7d' });
}
function authRider(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

app.post('/api/checkin', async (req, res) => {
  const { bib, name, division } = req.body || {};
  if (!bib) return res.code(400).send({ error: 'bib required' });
  const { rows } = await db.query('select * from riders where bib=$1', [bib]);
  let rider = rows[0];
  if (!rider) {
    const ins = await db.query('insert into riders(bib,name,division) values($1,$2,$3) returning *', [bib, name || null, division || null]);
    rider = ins.rows[0];
  }
  const riderToken = signRider(rider);
  res.send({ riderToken, rider: { id: rider.id, bib: rider.bib, name: rider.name, division: rider.division } });
});

app.get('/api/gate-token', async (req, res) => {
  if ((req.headers['x-admin-key'] || '') !== ADMIN_KEY) return res.code(401).send({ error: 'unauthorized' });
  const token = tokenFor(TOTP_SECRET, new Date(), Number(TOKEN_WINDOW_SECONDS));
  const now = Date.now();
  const step = Number(TOKEN_WINDOW_SECONDS) * 1000;
  return res.send({ token, validFrom: new Date(Math.floor(now/step)*step).toISOString(), validTo: new Date(Math.floor(now/step)*step + step - 1).toISOString() });
});

app.post('/api/laps', async (req, res) => {
  const rider = authRider(req, res);
  if (!rider) return res.code(401).send({ error: 'unauthorized' });
  const { eventId = EVENT_ID, gateId = GATE_ID, token, tsClient } = req.body || {};
  if (!token) return res.code(400).send({ error: 'token required' });
  const ok = isValid(TOTP_SECRET, token, Number(TOKEN_WINDOW_SECONDS), 1);
  if (!ok) return res.code(400).send({ error: 'invalid or expired gate token' });
  // enforce min lap time
  const last = await db.query('select max(ts) as last from laps where event_id=$1 and rider_id=$2', [eventId, rider.sub]);
  const lastTs = last.rows[0]?.last ? new Date(last.rows[0].last).getTime() : null;
  const now = Date.now();
  if (lastTs && (now - lastTs) < Number(MIN_LAP_SECONDS)*1000) {
    return res.code(429).send({ error: `lap too soon; wait ${Math.ceil((Number(MIN_LAP_SECONDS)*1000 - (now - lastTs))/1000)}s` });
  }
  // next lap number
  const cnt = await db.query('select count(*)::int as c from laps where event_id=$1 and rider_id=$2', [eventId, rider.sub]);
  const nextLap = (cnt.rows[0].c || 0) + 1;
  const ins = await db.query('insert into laps(event_id,rider_id,lap_no,ts,gate_id,source) values($1,$2,$3,now(),$4,$5) returning *',
    [eventId, rider.sub, nextLap, gateId, 'user']);
  res.send({ ok: true, lap: ins.rows[0] });
});

app.get('/api/leaderboard', async (req, res) => {
  const eventId = req.query.eventId || EVENT_ID;
  const rows = (await db.query(
    `select r.bib, r.name, r.division, count(l.*)::int as laps, max(l.ts) as last_ts
     from riders r
     join laps l on l.rider_id=r.id and l.event_id=$1
     group by r.id
     order by laps desc, last_ts asc
     limit 100`, [eventId])).rows;
  res.send({ rows });
});

app.post('/api/override-lap', async (req, res) => {
  if ((req.headers['x-admin-key'] || '') !== ADMIN_KEY) return res.code(401).send({ error: 'unauthorized' });
  const { bib, eventId = EVENT_ID, delta = 1 } = req.body || {};
  if (!bib) return res.code(400).send({ error: 'bib required' });
  const { rows } = await db.query('select id from riders where bib=$1', [bib]);
  if (!rows[0]) return res.code(404).send({ error: 'rider not found' });
  const riderId = rows[0].id;
  if (delta > 0) {
    const cnt = await db.query('select count(*)::int as c from laps where event_id=$1 and rider_id=$2', [eventId, riderId]);
    let nextLap = (cnt.rows[0].c || 0) + 1;
    for (let i = 0; i < delta; i++) {
      await db.query('insert into laps(event_id,rider_id,lap_no,ts,gate_id,source) values($1,$2,$3,now(),$4,$5)',
        [eventId, riderId, nextLap++, 'admin', 'override']);
    }
  } else if (delta < 0) {
    await db.query('delete from laps where event_id=$1 and rider_id=$2 order by lap_no desc limit $3',
      [eventId, riderId, Math.abs(delta)]);
  }
  res.send({ ok: true });
});

app.get('/api/health', async (req, res) => res.send({ ok: true }));

app.listen({ port: Number(PORT), host: '0.0.0.0' }).catch(err => {
  app.log.error(err);
  process.exit(1);
});
