import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://REMOVED_PROJECT_REF.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const results = [];

function log(emoji, name, detail) {
  const pass = emoji === '\u2705';
  results.push({ name, pass, detail });
  console.log(`${emoji} ${name}${detail ? ' \u2014 ' + detail : ''}`);
}

function fileContains(path, needle) {
  try { return readFileSync(path, 'utf-8').includes(needle); } catch { return false; }
}

function fileExists(path) {
  try { readFileSync(path, 'utf-8'); return true; } catch { return false; }
}

async function run() {
  console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('  A.15 Analytics, Reporting & Business Intelligence');
  console.log('  Production Verification Test');
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');

  // ── Schema & Database ────────────────────────────────────────────────

  const { error: stErr } = await db.from('support_tickets').select('id').limit(1);
  log(!stErr ? '\u2705' : '\u274c', 'DB: support_tickets table', stErr?.message);

  const { error: smErr } = await db.from('support_ticket_messages').select('id').limit(1);
  log(!smErr ? '\u2705' : '\u274c', 'DB: support_ticket_messages table', smErr?.message);

  const { error: enErr } = await db.from('vehicle_enquiries').select('id').limit(1);
  log(!enErr ? '\u2705' : '\u274c', 'DB: vehicle_enquiries table', enErr?.message);

  const { error: waErr } = await db.from('whatsapp_clicks').select('id').limit(1);
  log(!waErr ? '\u2705' : '\u274c', 'DB: whatsapp_clicks table', waErr?.message);

  const { error: evErr } = await db.from('analytics_events').select('id').limit(1);
  log(!evErr ? '\u2705' : '\u274c', 'DB: analytics_events table', evErr?.message);

  const { error: pvErr } = await db.from('page_views').select('id').limit(1);
  log(!pvErr ? '\u2705' : '\u274c', 'DB: page_views table', pvErr?.message);

  const { error: shErr } = await db.from('search_history').select('id').limit(1);
  log(!shErr ? '\u2705' : '\u274c', 'DB: search_history table', shErr?.message);

  const { data: perms } = await db.from('permissions').select('slug').in('slug', ['support.view', 'support.create', 'support.update', 'support.reply', 'support.assign', 'support.delete']);
  log(perms && perms.length === 6 ? '\u2705' : '\u274c', 'Seed: 6 support permissions', 'found ' + (perms?.length ?? 0));

  const { data: analyticsPerm } = await db.from('permissions').select('slug').eq('slug', 'analytics.read').limit(1);
  log(analyticsPerm && analyticsPerm.length > 0 ? '\u2705' : '\u274c', 'Seed: analytics.read permission');

  // ── Source Code Files ────────────────────────────────────────────────

  const repoFile = 'src/server/repositories/dashboardRepository.ts';
  const repoMethods = ['getSupportStats', 'getLeadStats', 'getTopCustomers', 'getWhatsAppClickStats', 'getVehicleAging', 'getAllTimeSummary'];
  const repoMissing = repoMethods.filter(m => !fileContains(repoFile, m));
  log(repoMissing.length === 0 ? '\u2705' : '\u274c', 'Code: DashboardRepository new methods', repoMissing.length > 0 ? 'missing: ' + repoMissing.join(', ') : repoMethods.join(', '));

  const svcFile = 'src/server/services/dashboardService.ts';
  log(fileContains(svcFile, 'getAllTimeSummary') ? '\u2705' : '\u274c', 'Code: DashboardService.getAllTimeSummary');
  log(fileContains(svcFile, 'getSupportStats') ? '\u2705' : '\u274c', 'Code: DashboardService calls getSupportStats');
  log(fileContains(svcFile, 'getLeadStats') ? '\u2705' : '\u274c', 'Code: DashboardService calls getLeadStats');
  log(fileContains(svcFile, 'getTopCustomers') ? '\u2705' : '\u274c', 'Code: DashboardService calls getTopCustomers');
  log(fileContains(svcFile, 'getWhatsAppClickStats') ? '\u2705' : '\u274c', 'Code: DashboardService calls getWhatsAppClickStats');
  log(fileContains(svcFile, 'getVehicleAging') ? '\u2705' : '\u274c', 'Code: DashboardService calls getVehicleAging');

  const actFile = 'src/server/actions/analyticsActions.ts';
  log(fileContains(actFile, 'exportAnalyticsCsv') ? '\u2705' : '\u274c', 'Code: analyticsActions.exportAnalyticsCsv');
  log(fileContains(actFile, 'requirePermission') ? '\u2705' : '\u274c', 'Code: analyticsActions uses requirePermission');

  const pageFile = 'src/app/(admin)/admin/analytics/page.tsx';
  log(fileContains(pageFile, 'requirePermission') ? '\u2705' : '\u274c', 'Code: page uses requirePermission');
  log(!fileContains(pageFile, "auth.role !== 'admin'") ? '\u2705' : '\u274c', 'Code: page removed role check');

  const clientFile = 'src/app/(admin)/admin/analytics/client.tsx';
  log(fileContains(clientFile, 'DATE_PRESETS') ? '\u2705' : '\u274c', 'Code: client has DATE_PRESETS');
  log(fileContains(clientFile, 'exportAnalyticsCsv') ? '\u2705' : '\u274c', 'Code: client calls exportAnalyticsCsv');
  log(fileContains(clientFile, 'handleExport') ? '\u2705' : '\u274c', 'Code: client has handleExport');
  log(fileContains(clientFile, "'leads'") ? '\u2705' : '\u274c', 'Code: client has leads tab');
  log(fileContains(clientFile, "'support'") ? '\u2705' : '\u274c', 'Code: client has support tab');
  log(fileContains(clientFile, 'supportStats') ? '\u2705' : '\u274c', 'Code: client renders supportStats');
  log(fileContains(clientFile, 'leadStats') ? '\u2705' : '\u274c', 'Code: client renders leadStats');
  log(fileContains(clientFile, 'vehicleAging') ? '\u2705' : '\u274c', 'Code: client renders vehicleAging');
  log(fileContains(clientFile, 'topCustomers') ? '\u2705' : '\u274c', 'Code: client renders topCustomers');
  log(fileContains(clientFile, 'whatsappClickStats') ? '\u2705' : '\u274c', 'Code: client renders whatsappClickStats');

  log(fileExists(repoFile) ? '\u2705' : '\u274c', 'File: dashboardRepository.ts exists');
  log(fileExists(svcFile) ? '\u2705' : '\u274c', 'File: dashboardService.ts exists');
  log(fileExists(actFile) ? '\u2705' : '\u274c', 'File: analyticsActions.ts exists');
  log(fileExists(pageFile) ? '\u2705' : '\u274c', 'File: analytics page.tsx exists');
  log(fileExists(clientFile) ? '\u2705' : '\u274c', 'File: analytics client.tsx exists');

  // ── Summary ──────────────────────────────────────────────────────────

  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('  Results: ' + passed + '/' + total + ' passed');
  if (passed === total) {
    console.log('  \ud83c\udf89 ALL TESTS PASSED \u2014 A.15 COMPLETE');
  } else {
    console.log('  \u26a0\ufe0f  ' + (total - passed) + ' test(s) failed');
    results.filter(r => !r.pass).forEach(r => console.log('     \u274c ' + r.name + ': ' + r.detail));
  }
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');

  process.exit(passed === total ? 0 : 1);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
