// ╔═══════════════════════════════════════════════════════════════╗
// ║  QuantOps v6 — 100% Real Data Monitoring                     ║
// ║  Zero simulation. Every status = real API call.               ║
// ╚═══════════════════════════════════════════════════════════════╝

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmt = (n, d=2) => n.toLocaleString(undefined, {minimumFractionDigits:d, maximumFractionDigits:d});

// Highlight matching text — wraps matches in <mark> tags
function hl(text, term) {
  if (!term || !text) return text || '';
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
}

let currentUser = null;
let tickInterval = null;
let clockInterval = null;
let alertFilter = 'all';

// ── LOCALSTORAGE HELPERS ──
function getData(k, fb) { try { const v = localStorage.getItem('qops_'+k); return v ? JSON.parse(v) : fb; } catch { return fb; } }
function setData(k, v) { localStorage.setItem('qops_'+k, JSON.stringify(v)); }

// ══════════════════════════════════════════════
//  DEFAULT REAL ENDPOINTS
// ══════════════════════════════════════════════
// Every one of these is a real public API. No fake data.
const DEFAULT_ENDPOINTS = [
  { id: 'binance',   name: 'Binance',          url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', threshold: 2000, maintenance: false },
  { id: 'coinbase',  name: 'Coinbase',         url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',           threshold: 2000, maintenance: false },
  { id: 'kraken',    name: 'Kraken',           url: 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD',        threshold: 2000, maintenance: false },
  { id: 'gemini',    name: 'Gemini',           url: 'https://api.gemini.com/v1/pubticker/btcusd',                threshold: 2000, maintenance: false },
  { id: 'github',    name: 'GitHub API',       url: 'https://api.github.com',                                    threshold: 2000, maintenance: false },
  { id: 'jsonph',    name: 'JSONPlaceholder',  url: 'https://jsonplaceholder.typicode.com/posts/1',              threshold: 2000, maintenance: false },
  { id: 'ipapi',     name: 'IP Geolocation',   url: 'https://ipapi.co/json/',                                    threshold: 2000, maintenance: false },
  { id: 'coingecko', name: 'CoinGecko',        url: 'https://api.coingecko.com/api/v3/ping',                     threshold: 2000, maintenance: false },
];

function getEndpoints() { return getData('endpoints', DEFAULT_ENDPOINTS); }
function saveEndpoints(e) { setData('endpoints', e); }
function getAlerts() { return getData('alerts', []); }
function saveAlerts(a) { setData('alerts', a); }
function getActivity() { return getData('activity', []); }
function saveActivity(a) { setData('activity', a); }
function getUsers() { return getData('users', {}); }
function saveUsers(u) { setData('users', u); }

// Runtime state (rebuilt each session from real API calls)
let endpointState = {};
// { id: { status:'operational'|'degraded'|'down', latency:ms, lastCheck:time, responseData:str, error:str } }

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
function toast(msg, type='info') {
  const el = document.createElement('div');
  el.className = 'toast t-' + type;
  el.textContent = msg;
  $('#toastBox').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3500);
}

// ══════════════════════════════════════════════
//  ACTIVITY LOG
// ══════════════════════════════════════════════
function logAct(user, action) {
  const log = getActivity();
  log.unshift({ time: new Date().toLocaleString(), user, action });
  if (log.length > 500) log.length = 500;
  saveActivity(log);
}

// ══════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════
function showReg() { $('#loginView').style.display='none'; $('#regView').style.display='block'; }
function showLog() { $('#regView').style.display='none'; $('#loginView').style.display='block'; }

function doRegister() {
  const user=$('#rUser').value.trim(), email=$('#rEmail').value.trim(), pass=$('#rPass').value, role=$('#rRole').value, err=$('#rError');
  err.textContent = '';
  if (user.length<2) { err.textContent='Username must be at least 2 characters.'; return; }
  if (!email.includes('@')) { err.textContent='Enter a valid email.'; return; }
  if (pass.length<4) { err.textContent='Password must be at least 4 characters.'; return; }
  const users = getUsers();
  if (users[user]) { err.textContent='Username already taken. Please choose a different username.'; return; }
  const existingEmails = Object.values(users).map(u => u.email);
  if (existingEmails.includes(email)) { err.textContent='This email is already registered. Please use a different email.'; return; }
  users[user] = { email, pass, role, createdAt: new Date().toISOString(), lastLogin: null };
  saveUsers(users);
  logAct(user, 'Registered as ' + role);
  toast('Account created!', 'success');
  err.textContent = '';
  showLog();
}

function doLogin() {
  const user=$('#lUser').value.trim(), pass=$('#lPass').value, err=$('#lError');
  err.textContent = '';
  const users = getUsers();
  if (!users[user]) { err.textContent='User not found.'; return; }
  if (users[user].pass !== pass) { err.textContent='Wrong password.'; return; }
  users[user].lastLogin = new Date().toISOString();
  saveUsers(users);
  loginAs(user);
}

function loginAs(username) {
  const users = getUsers();
  currentUser = { username, ...users[username] };
  setData('session', username);
  $('#authScreen').style.display='none';
  $('#dashboard').style.display='block';
  $('#avatar').textContent = username[0].toUpperCase();
  $('#ddName').textContent = username;
  $('#ddEmail').textContent = currentUser.email;
  $('#roleBadge').textContent = currentUser.role.toUpperCase();
  $('#roleBadge').className = 'role-badge role-' + currentUser.role;
  $('#adminTab').style.display = currentUser.role === 'admin' ? '' : 'none';
  $('#actScope').textContent = currentUser.role === 'admin' ? '(all users)' : '(your actions)';
  logAct(username, 'Logged in');
  toast('Welcome, ' + username + '!', 'info');
  initDashboard();
}

function doLogout() {
  logAct(currentUser.username, 'Logged out');
  localStorage.removeItem('qops_session');
  currentUser = null;
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
  $('#dashboard').style.display='none';
  $('#authScreen').style.display='flex';
}

function toggleDD(e) { e.stopPropagation(); $('#userDD').classList.toggle('open'); }
document.addEventListener('click', () => { const d=$('#userDD'); if(d) d.classList.remove('open'); });

// ══════════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════════
function switchTab(id, btn) {
  if (id === 'admin' && currentUser.role !== 'admin') { toast('Admin access only.', 'error'); return; }
  $$('.tab-content').forEach(t => t.classList.remove('active'));
  $$('.tab').forEach(t => t.classList.remove('active'));
  $('#tab-'+id).classList.add('active');
  btn.classList.add('active');
  if (id==='alerts') renderAlerts();
  if (id==='activity') renderActLog();
  if (id==='admin') renderAdmin();
}

// ══════════════════════════════════════════════
//  CLOCK
// ══════════════════════════════════════════════
function updateClock() {
  const n=new Date(), h=String(n.getHours()).padStart(2,'0'), m=String(n.getMinutes()).padStart(2,'0'), s=String(n.getSeconds()).padStart(2,'0');
  $('#headerTime').textContent = h+':'+m+':'+s;
}

// ══════════════════════════════════════════════
//  REAL API MONITORING (the core — zero simulation)
// ══════════════════════════════════════════════

async function pingEndpoint(ep) {
  const t0 = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const resp = await fetch(ep.url, { signal: controller.signal });
    clearTimeout(timeout);
    const latency = Math.round(performance.now() - t0);

    let dataPreview = '';
    try {
      const text = await resp.text();
      dataPreview = text.substring(0, 120);
    } catch {}

    if (!resp.ok) {
      return { status: 'down', latency, error: 'HTTP ' + resp.status, data: dataPreview };
    }

    // Check latency against threshold
    if (latency > ep.threshold) {
      return { status: 'degraded', latency, error: 'Latency ' + latency + 'ms > threshold ' + ep.threshold + 'ms', data: dataPreview };
    }

    return { status: 'operational', latency, error: null, data: dataPreview };
  } catch (e) {
    const latency = Math.round(performance.now() - t0);
    const errMsg = e.name === 'AbortError' ? 'Timeout (>8s)' : (e.message || 'Fetch failed');
    return { status: 'down', latency, error: errMsg, data: '' };
  }
}

async function monitorAllEndpoints() {
  const endpoints = getEndpoints();
  const alerts = getAlerts();
  let newAlertCreated = false;

  // Ping all endpoints in parallel
  const promises = endpoints.map(async ep => {
    if (ep.maintenance) {
      endpointState[ep.id] = { status: 'maintenance', latency: 0, lastCheck: '--', error: null, data: '' };
      return;
    }

    const result = await pingEndpoint(ep);
    endpointState[ep.id] = {
      status: result.status,
      latency: result.latency,
      lastCheck: new Date().toLocaleTimeString(),
      error: result.error,
      data: result.data,
    };

    // Auto-generate alert if degraded or down
    if (result.status === 'degraded' || result.status === 'down') {
      const severity = result.status === 'down' ? 'critical' : 'warning';
      const msg = result.status === 'down'
        ? ep.name + ' is unreachable — ' + result.error
        : ep.name + ' latency ' + result.latency + 'ms exceeds threshold ' + ep.threshold + 'ms';

      // Check for existing unresolved alert for this endpoint
      const existing = alerts.find(a => a.endpointId === ep.id && a.status !== 'resolved');
      if (!existing) {
        alerts.unshift({
          id: Date.now() + Math.random(),
          endpointId: ep.id,
          endpointName: ep.name,
          severity,
          message: msg,
          realLatency: result.latency,
          threshold: ep.threshold,
          time: new Date().toLocaleString(),
          status: 'new',
          acknowledgedBy: null,
          resolvedBy: null,
        });
        newAlertCreated = true;
      }
    }
  });

  await Promise.allSettled(promises);
  if (newAlertCreated) saveAlerts(alerts);
}

// Manual health check (single endpoint)
async function runCheck(epId) {
  const endpoints = getEndpoints();
  const ep = endpoints.find(e => e.id === epId);
  if (!ep) return;
  toast('Pinging ' + ep.name + '…', 'info');

  const result = await pingEndpoint(ep);
  endpointState[epId] = {
    status: ep.maintenance ? 'maintenance' : result.status,
    latency: result.latency,
    lastCheck: new Date().toLocaleTimeString(),
    error: result.error,
    data: result.data,
  };

  const msg = ep.name + ': ' + result.status + ' (' + result.latency + 'ms)';
  toast(msg, result.status === 'operational' ? 'success' : 'error');
  logAct(currentUser.username, 'Health check — ' + msg);
  renderServiceGrid();
  renderOverview();
}

// ══════════════════════════════════════════════
//  RENDER: OVERVIEW
// ══════════════════════════════════════════════

function renderOverview() {
  const eps = getEndpoints();
  const total = eps.length;
  const ok = eps.filter(e => endpointState[e.id]?.status === 'operational').length;
  const lats = eps.map(e => endpointState[e.id]?.latency || 0).filter(l => l > 0);
  const avgLat = lats.length ? Math.round(lats.reduce((a,b)=>a+b,0)/lats.length) : 0;
  const activeAlerts = getAlerts().filter(a => a.status !== 'resolved').length;

  $('#ovTotal').textContent = total;
  $('#ovOk').textContent = ok + '/' + total;
  $('#ovOk').className = 'ov-value' + (ok < total ? ' ov-warn' : '');
  $('#ovAlerts').textContent = activeAlerts;
  $('#ovAlerts').className = 'ov-value' + (activeAlerts > 0 ? ' ov-danger' : '');
  $('#ovLat').textContent = avgLat + 'ms';
  $('#alertTabCount').textContent = activeAlerts;
}

// ══════════════════════════════════════════════
//  RENDER: SERVICE GRID
// ══════════════════════════════════════════════

function renderServiceGrid() {
  const eps = getEndpoints();
  $('#serviceGrid').innerHTML = eps.map(ep => {
    const s = endpointState[ep.id] || { status:'unknown', latency:0, lastCheck:'--', error:null, data:'' };
    let statusCls, statusLabel, dotCls;

    if (ep.maintenance) {
      statusCls='svc-maint'; statusLabel='Maintenance'; dotCls='dot-grey';
    } else if (s.status==='operational') {
      statusCls='svc-ok'; statusLabel='Operational'; dotCls='dot-green';
    } else if (s.status==='degraded') {
      statusCls='svc-warn'; statusLabel='Degraded'; dotCls='dot-yellow';
    } else if (s.status==='down') {
      statusCls='svc-down'; statusLabel='Down'; dotCls='dot-red';
    } else {
      statusCls=''; statusLabel='Pending…'; dotCls='dot-grey';
    }

    const latBar = s.latency > 0 ? Math.min((s.latency / (ep.threshold * 2)) * 100, 100) : 0;
    const barColor = s.status==='operational' ? 'var(--green)' : s.status==='degraded' ? 'var(--yellow)' : 'var(--red)';

    return `<div class="svc-card ${statusCls}">
      <div class="svc-header">
        <span class="svc-name">${ep.name}</span>
        <span class="status-dot ${dotCls}">●</span>
      </div>
      <div class="svc-status">${statusLabel}</div>
      <div class="svc-stats">
        <div><span class="muted">Latency</span><span>${s.latency > 0 ? s.latency+'ms' : '--'}</span></div>
        <div><span class="muted">Threshold</span><span>${ep.threshold}ms</span></div>
      </div>
      <div class="lat-bar-track"><div class="lat-bar-fill" style="width:${latBar}%;background:${barColor}"></div></div>
      ${s.error ? `<div class="svc-error">${s.error}</div>` : ''}
      <div class="svc-url muted">${ep.url.substring(0,45)}…</div>
      <div class="svc-meta muted">Last check: ${s.lastCheck}</div>
      <button class="btn-check" onclick="runCheck('${ep.id}')">▶ Run Check</button>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════
//  ALERTS
// ══════════════════════════════════════════════

function filterAlerts(f, btn) {
  alertFilter = f;
  $$('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderAlerts();
}

function renderAlerts() {
  let alerts = getAlerts();
  if (alertFilter !== 'all') alerts = alerts.filter(a => a.status === alertFilter);

  // Search filter
  const searchTerm = ($('#alertSearch')?.value || '').toLowerCase().trim();
  if (searchTerm) {
    alerts = alerts.filter(a => {
      const fields = [
        a.message || '',
        a.endpointName || a.serviceName || '',
        a.severity || '',
        a.status || '',
        a.acknowledgedBy || '',
        a.resolvedBy || '',
        a.time || ''
      ];
      return fields.some(f => f.toLowerCase().includes(searchTerm));
    });
  }

  const list=$('#alertList'), empty=$('#noAlerts');
  if (!alerts.length) { list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';

  list.innerHTML = alerts.map(a => {
    const h = searchTerm; // highlight term
    const sevCls = a.severity==='critical' ? 'alert-critical' : 'alert-warning';
    let statusHtml = '';
    if (a.status==='new') statusHtml='<span class="alert-status st-new">NEW</span>';
    else if (a.status==='acknowledged') statusHtml=`<span class="alert-status st-ack">ACK by ${hl(a.acknowledgedBy||'',h)}</span>`;
    else if (a.status==='resolved') statusHtml=`<span class="alert-status st-res">RESOLVED by ${hl(a.resolvedBy||'',h)}</span>`;

    let actions = '';
    if (a.status==='new') actions=`<button class="btn-sm btn-ack" onclick="ackAlert(${a.id})">Acknowledge</button><button class="btn-sm btn-res" onclick="resAlert(${a.id})">Resolve</button>`;
    else if (a.status==='acknowledged') actions=`<button class="btn-sm btn-res" onclick="resAlert(${a.id})">Resolve</button>`;
    if (currentUser.role==='admin') actions += `<button class="btn-sm btn-del" onclick="delAlert(${a.id})">Delete</button>`;

    return `<div class="alert-item ${sevCls}">
      <div class="alert-top">
        <div><span class="alert-sev">${hl((a.severity||'').toUpperCase(),h)}</span>${statusHtml}</div>
        <span class="alert-time muted">${hl(a.time||'',h)}</span>
      </div>
      <div class="alert-msg">${hl(a.message||'',h)}</div>
      <div class="alert-detail muted">Real latency: ${a.realLatency}ms | Threshold: ${a.threshold}ms</div>
      <div class="alert-actions">${actions}</div>
    </div>`;
  }).join('');
}

function ackAlert(id) {
  const alerts=getAlerts(), a=alerts.find(x=>x.id===id);
  if (!a||a.status!=='new') return;
  a.status='acknowledged'; a.acknowledgedBy=currentUser.username;
  saveAlerts(alerts);
  logAct(currentUser.username, 'Acknowledged: "'+a.message+'"');
  toast('Alert acknowledged.','success');
  renderAlerts(); renderOverview();
}
function resAlert(id) {
  const alerts=getAlerts(), a=alerts.find(x=>x.id===id);
  if (!a||a.status==='resolved') return;
  a.status='resolved'; a.resolvedBy=currentUser.username;
  saveAlerts(alerts);
  logAct(currentUser.username, 'Resolved: "'+a.message+'"');
  toast('Alert resolved.','success');
  renderAlerts(); renderOverview();
}
function delAlert(id) {
  if (currentUser.role!=='admin') { toast('Only admins can delete alerts.','error'); return; }
  let alerts=getAlerts();
  const a=alerts.find(x=>x.id===id);
  alerts=alerts.filter(x=>x.id!==id);
  saveAlerts(alerts);
  if (a) logAct(currentUser.username, 'Deleted alert: "'+a.message+'"');
  toast('Alert deleted.','info');
  renderAlerts(); renderOverview();
}

// ══════════════════════════════════════════════
//  ACTIVITY LOG
// ══════════════════════════════════════════════

function renderActLog() {
  let log = getActivity();
  if (currentUser.role !== 'admin') log = log.filter(e => e.user === currentUser.username);

  // Search filter
  const searchTerm = ($('#actSearch')?.value || '').toLowerCase().trim();
  if (searchTerm) {
    log = log.filter(e =>
      e.user.toLowerCase().includes(searchTerm) ||
      e.action.toLowerCase().includes(searchTerm) ||
      e.time.toLowerCase().includes(searchTerm)
    );
  }

  // Date filter
  const dateFrom = $('#actDateFrom')?.value;
  const dateTo = $('#actDateTo')?.value;
  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    log = log.filter(e => new Date(e.time) >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    log = log.filter(e => new Date(e.time) <= to);
  }

  const c=$('#actLog'), empty=$('#noAct');
  if (!log.length) { c.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  const h = searchTerm; // highlight term
  c.innerHTML = log.slice(0,200).map(e =>
    `<div class="log-entry"><span class="log-time">${hl(e.time,h)}</span><span class="log-user">${hl(e.user,h)}</span><span class="log-action">${hl(e.action,h)}</span></div>`
  ).join('');
}

function clearDateFilter() {
  $('#actDateFrom').value = '';
  $('#actDateTo').value = '';
  renderActLog();
}

// ══════════════════════════════════════════════
//  ADMIN PANEL
// ══════════════════════════════════════════════

async function addEndpoint() {
  if (currentUser.role!=='admin') { toast('Admin only.','error'); return; }
  const name=$('#addName').value.trim(), url=$('#addUrl').value.trim(), threshold=parseInt($('#addThresh').value)||200;
  if (!name) { toast('Enter a name.','error'); return; }
  if (!url.startsWith('http')) { toast('Enter a valid URL starting with https://','error'); return; }
  const eps=getEndpoints();
  if (eps.find(e => e.name.toLowerCase() === name.toLowerCase())) { toast('Endpoint "'+name+'" already exists.','error'); return; }
  if (eps.find(e => e.url === url)) { toast('This URL is already being monitored.','error'); return; }

  // Validate endpoint by actually pinging it
  toast('Validating endpoint...','info');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) { toast('Endpoint returned HTTP '+resp.status+'. Add anyway? Re-click to confirm.','error'); }
  } catch (e) {
    const errMsg = e.name === 'AbortError' ? 'Timed out after 10s' : (e.message || 'Unreachable');
    toast('Endpoint unreachable: '+errMsg+'. Check the URL and try again.','error');
    return;
  }

  const id=name.toLowerCase().replace(/[^a-z0-9]/g,'-')+'-'+Date.now();
  eps.push({ id, name, url, threshold, maintenance:false });
  saveEndpoints(eps);
  endpointState[id]={ status:'unknown', latency:0, lastCheck:'--', error:null, data:'' };
  logAct(currentUser.username, 'Added endpoint: '+name+' ('+url+', threshold: '+threshold+'ms)');
  toast('Endpoint "'+name+'" added successfully.','success');
  $('#addName').value=''; $('#addUrl').value='';
  renderServiceGrid(); renderOverview(); renderAdmin();
}

function removeEndpoint(id) {
  if (currentUser.role!=='admin') return;
  let eps=getEndpoints();
  const ep=eps.find(e=>e.id===id);
  if (!ep) return;
  if (!confirm('Remove endpoint "'+ep.name+'"? This cannot be undone.')) return;
  eps=eps.filter(e=>e.id!==id);
  saveEndpoints(eps);
  delete endpointState[id];
  logAct(currentUser.username, 'Removed endpoint: '+ep.name);
  toast('Endpoint removed.','info');
  renderServiceGrid(); renderOverview(); renderAdmin();
}

function toggleMaint(id) {
  if (currentUser.role!=='admin') return;
  const eps=getEndpoints(), ep=eps.find(e=>e.id===id);
  if (!ep) return;
  ep.maintenance=!ep.maintenance;
  saveEndpoints(eps);
  logAct(currentUser.username, (ep.maintenance?'Enabled':'Disabled')+' maintenance on '+ep.name);
  toast((ep.maintenance?'Enabled':'Disabled')+' maintenance: '+ep.name,'info');
  renderServiceGrid(); renderOverview(); renderAdmin();
}

function updateThresh(id) {
  if (currentUser.role!=='admin') return;
  const input=document.querySelector(`[data-thresh="${id}"]`);
  const val=parseInt(input.value);
  if (!val||val<1) { toast('Invalid threshold.','error'); return; }
  const eps=getEndpoints(), ep=eps.find(e=>e.id===id);
  if (!ep) return;
  const old=ep.threshold;
  ep.threshold=val;
  saveEndpoints(eps);
  logAct(currentUser.username, ep.name+' threshold: '+old+'ms → '+val+'ms');
  toast('Threshold updated.','success');
}

function removeUser(username) {
  if (currentUser.role!=='admin') return;
  if (username===currentUser.username) { toast("Can't remove yourself.",'error'); return; }
  if (!confirm('Remove user "'+username+'"? This cannot be undone.')) return;
  const users=getUsers();
  delete users[username];
  saveUsers(users);
  logAct(currentUser.username, 'Removed user: '+username);
  toast('User removed.','info');
  renderAdmin();
}

function renderAdmin() {
  if (currentUser.role!=='admin') return;
  const eps=getEndpoints();
  $('#adminSvcTable').innerHTML=`<table><thead><tr><th>Name</th><th>URL</th><th>Threshold</th><th>Maint.</th><th></th></tr></thead><tbody>${eps.map(e=>`<tr>
    <td>${e.name}</td><td class="url-cell">${e.url.substring(0,50)}…</td>
    <td><input type="number" class="thresh-input" data-thresh="${e.id}" value="${e.threshold}"><button class="btn-sm" onclick="updateThresh('${e.id}')">Set</button></td>
    <td><button class="btn-sm ${e.maintenance?'btn-maint-on':'btn-maint-off'}" onclick="toggleMaint('${e.id}')">${e.maintenance?'✓ End':'🔧 Start'}</button></td>
    <td><button class="btn-sm btn-del" onclick="removeEndpoint('${e.id}')">Remove</button></td>
  </tr>`).join('')}</tbody></table>`;

  const users=getUsers();
  $('#adminUserTable').innerHTML=`<table><thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Last Login</th><th></th></tr></thead><tbody>${Object.entries(users).map(([n,u])=>`<tr>
    <td>${n}${n===currentUser.username?' (you)':''}</td><td>${u.email}</td><td><span class="role-badge role-${u.role}">${u.role}</span></td>
    <td>${u.lastLogin?new Date(u.lastLogin).toLocaleString():'Never'}</td>
    <td>${n!==currentUser.username?`<button class="btn-sm btn-del" onclick="removeUser('${n}')">Remove</button>`:'--'}</td>
  </tr>`).join('')}</tbody></table>`;
}

// ══════════════════════════════════════════════
//  GENERATE REPORT
// ══════════════════════════════════════════════

function generateReport() {
  if (currentUser.role!=='admin') { toast('Admin only.','error'); return; }
  const eps=getEndpoints(), alerts=getAlerts(), activity=getActivity();
  let r='';
  r+='===============================================\n';
  r+='  QUANTOPS HEALTH REPORT\n';
  r+='===============================================\n\n';
  r+='Generated by: '+currentUser.username+'\n';
  r+='Date: '+new Date().toLocaleString()+'\n\n';

  r+='-- ENDPOINTS --\n';
  eps.forEach(e=>{
    const s=endpointState[e.id]||{};
    const st=e.maintenance?'MAINTENANCE':(s.status||'unknown').toUpperCase();
    r+='  '+e.name.padEnd(20)+st.padEnd(14)+(s.latency>0?s.latency+'ms':'--').padEnd(10)+'threshold: '+e.threshold+'ms\n';
    r+='    URL: '+e.url+'\n';
  });

  r+='\n-- ALERTS ('+alerts.length+' total) --\n';
  const active=alerts.filter(a=>a.status!=='resolved');
  r+='Active: '+active.length+' | Resolved: '+(alerts.length-active.length)+'\n\n';
  alerts.slice(0,20).forEach(a=>{
    r+='  ['+a.severity.toUpperCase()+'] '+a.message+'\n';
    r+='    Status: '+a.status+' | Latency: '+a.realLatency+'ms | Threshold: '+a.threshold+'ms | Time: '+a.time+'\n';
    if (a.acknowledgedBy) r+='    Ack by: '+a.acknowledgedBy+'\n';
    if (a.resolvedBy) r+='    Resolved by: '+a.resolvedBy+'\n';
  });

  r+='\n-- RECENT ACTIVITY (last 20) --\n';
  activity.slice(0,20).forEach(e=>{ r+='  '+e.time+'  '+e.user.padEnd(14)+e.action+'\n'; });

  r+='\n===============================================\n';

  const blob=new Blob([r],{type:'text/plain'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='quantops_report_'+new Date().toISOString().slice(0,10)+'.txt';
  a.click();
  logAct(currentUser.username, 'Generated health report');
  toast('Report downloaded.','success');
}

// ══════════════════════════════════════════════
//  MAIN TICK (100% real — no simulation)
// ══════════════════════════════════════════════

async function tick() {
  await monitorAllEndpoints();

  // Fix #6: Auto-clean old resolved alerts (keep max 100 total, resolved older than 50 get trimmed)
  let alerts = getAlerts();
  if (alerts.length > 100) {
    const active = alerts.filter(a => a.status !== 'resolved');
    const resolved = alerts.filter(a => a.status === 'resolved').slice(0, 50);
    saveAlerts([...active, ...resolved]);
  }

  renderServiceGrid();
  renderOverview();
  updateClock();
}

function initDashboard() {
  // Clear any existing intervals before creating new ones
  if (tickInterval) clearInterval(tickInterval);
  if (clockInterval) clearInterval(clockInterval);

  // Reset to overview tab
  $$('.tab-content').forEach(t => t.classList.remove('active'));
  $$('.tab').forEach(t => t.classList.remove('active'));
  $('#tab-overview').classList.add('active');
  $$('.tab')[0].classList.add('active');

  updateClock();
  clockInterval = setInterval(updateClock, 1000);
  renderServiceGrid();
  renderOverview();
  renderAlerts();
  renderActLog();
  if (currentUser.role==='admin') renderAdmin();

  tick(); // first run
  tickInterval = setInterval(tick, 5000);
}

// ── CSV EXPORT ──
function exportCSV() {
  const alerts=getAlerts();
  if (!alerts.length) return toast('No alerts.','error');
  const h="Time,Severity,Endpoint,Message,Latency,Threshold,Status,AckBy,ResolvedBy\n";
  const rows=alerts.map(a=>`"${a.time||''}",${a.severity||''},${a.endpointName||a.serviceName||''},"${a.message||''}",${a.realLatency||0},${a.threshold||0},${a.status||''},${a.acknowledgedBy||''},${a.resolvedBy||''}`).join('\n');
  const blob=new Blob([h+rows],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='quantops_alerts_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
}

// ── AUTO-LOGIN ──
window.addEventListener('DOMContentLoaded', () => {
  const session=getData('session',null), users=getUsers();
  if (session && users[session]) loginAs(session);
});