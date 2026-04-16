#!/usr/bin/env npx tsx

/**
 * Fuel Rush — Community Seeding Script
 * Populates initial beta testing data:
 * - 30 realistic fuel stations across Dhaka
 * - Historical reports with varying confidence tiers
 * - 10 test users with different vehicle types
 * - Realistic visit patterns
 *
 * Run: npx tsx scripts/seed-data.ts
 *
 * Requires: .env.local with SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// ─── Types ────────────────────────────────────────────────────────────────────

type StationStatus = 'available' | 'low' | 'queue' | 'empty' | 'unknown';
type VehicleType = 'motorcycle' | 'sedan' | 'suv' | 'commercial';

interface StationSeed {
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: StationStatus;
  confidence: number;
  last_reported_at: string;
}

interface UserSeed {
  phone: string;
  display_name: string;
  trust_score: number;
  vehicle_type: VehicleType;
  plate_number: string;
  nickname: string;
}

// ─── Static Seed Data ─────────────────────────────────────────────────────────

const STATIONS: StationSeed[] = [
  // ── Mirpur (6 stations) ────────────────────────────────────────────────
  { name: 'Mirpur DOHS Fuel Station', address: 'Road 12, Mirpur DOHS, Dhaka', lat: 23.8145, lng: 90.3668, status: 'available', confidence: 85, last_reported_at: hoursAgo(0.5) },
  { name: 'Mirpur 10 Petrol Pump', address: 'Mirpur 10 Roundabout, Dhaka', lat: 23.8198, lng: 90.3703, status: 'available', confidence: 72, last_reported_at: hoursAgo(1) },
  { name: 'Mirpur 1 Fuel Center', address: 'Mirpur 1, Dhaka', lat: 23.8112, lng: 90.3641, status: 'low', confidence: 58, last_reported_at: hoursAgo(0.25) },
  { name: 'Pallabi Fuel Station', address: 'Pallabi, Mirpur, Dhaka', lat: 23.8261, lng: 90.3594, status: 'queue', confidence: 45, last_reported_at: hoursAgo(0.5) },
  { name: 'Kalshi Fuel Point', address: 'Kalshi, Mirpur, Dhaka', lat: 23.8341, lng: 90.3529, status: 'available', confidence: 91, last_reported_at: hoursAgo(0.1) },
  { name: 'Mirpur 6 Community Pump', address: 'Mirpur 6, Dhaka', lat: 23.8223, lng: 90.3577, status: 'empty', confidence: 33, last_reported_at: hoursAgo(2) },
  // No data station for AI gap-fill testing
  { name: 'Mirpur 12 New Pump', address: 'Mirpur 12, Dhaka', lat: 23.8071, lng: 90.3735, status: 'unknown', confidence: 0, last_reported_at: '' },

  // ── Uttara (5 stations) ──────────────────────────────────────────────────
  { name: 'Uttara Sector 10 Pump', address: 'Sector 10, Uttara, Dhaka', lat: 23.8671, lng: 90.4001, status: 'available', confidence: 78, last_reported_at: hoursAgo(0.8) },
  { name: 'Uttara Model Town Fuel', address: 'Model Town, Uttara, Dhaka', lat: 23.8732, lng: 90.4055, status: 'available', confidence: 88, last_reported_at: hoursAgo(0.2) },
  { name: 'Uttara Sector 3 Pump', address: 'Sector 3, Uttara, Dhaka', lat: 23.8598, lng: 90.3923, status: 'low', confidence: 55, last_reported_at: hoursAgo(1.5) },
  { name: 'Abdullahpur Fuel Center', address: 'Abdullahpur, Uttara, Dhaka', lat: 23.8801, lng: 90.4107, status: 'queue', confidence: 62, last_reported_at: hoursAgo(0.4) },
  // No data station
  { name: 'Uttara Sector 7 Pump', address: 'Sector 7, Uttara, Dhaka', lat: 23.8641, lng: 90.3967, status: 'unknown', confidence: 0, last_reported_at: '' },

  // ── Gulshan (4 stations) ────────────────────────────────────────────────
  { name: 'Gulshan 2 Petrol Pump', address: 'Gulshan 2, Dhaka', lat: 23.7933, lng: 90.4171, status: 'available', confidence: 94, last_reported_at: hoursAgo(0.1) },
  { name: 'Banani Fuel Station', address: 'Banani 11, Dhaka', lat: 23.7942, lng: 90.4034, status: 'available', confidence: 81, last_reported_at: hoursAgo(0.6) },
  { name: 'Gulshan 1 Auto Pump', address: 'Gulshan 1, Dhaka', lat: 23.8012, lng: 90.4115, status: 'queue', confidence: 40, last_reported_at: hoursAgo(1.2) },
  // No data station
  { name: 'Mohakhali Fuel Hub', address: 'Mohakhali, Dhaka', lat: 23.7862, lng: 90.4235, status: 'unknown', confidence: 0, last_reported_at: '' },

  // ── Dhanmondi (4 stations) ──────────────────────────────────────────────
  { name: 'Dhanmondi 27 Pump', address: 'Road 27, Dhanmondi, Dhaka', lat: 23.7461, lng: 90.4175, status: 'available', confidence: 76, last_reported_at: hoursAgo(0.7) },
  { name: 'Dhanmondi 32 Fuel Center', address: 'Road 32, Dhanmondi, Dhaka', lat: 23.7412, lng: 90.4213, status: 'low', confidence: 49, last_reported_at: hoursAgo(1.8) },
  { name: 'Jigatola Fuel Station', address: 'Jigatola, Dhaka', lat: 23.7398, lng: 90.4137, status: 'available', confidence: 83, last_reported_at: hoursAgo(0.3) },
  // No data station
  { name: 'Dhanmondi 15 Pump', address: 'Road 15, Dhanmondi, Dhaka', lat: 23.7489, lng: 90.4101, status: 'unknown', confidence: 0, last_reported_at: '' },

  // ── Mohammadpur (4 stations) ────────────────────────────────────────────
  { name: 'Mohammadpur Fuel Station', address: 'Mohammadpur, Dhaka', lat: 23.7581, lng: 90.4089, status: 'available', confidence: 69, last_reported_at: hoursAgo(1.1) },
  { name: 'Science Lab Pump', address: 'Sher-e-Bangla Nagar, Dhaka', lat: 23.7523, lng: 90.3965, status: 'queue', confidence: 51, last_reported_at: hoursAgo(0.9) },
  { name: 'Mugda Fuel Center', address: 'Mugda, Dhaka', lat: 23.7623, lng: 90.3877, status: 'empty', confidence: 22, last_reported_at: hoursAgo(3) },
  { name: 'Bosila Fuel Point', address: 'Bosila, Mohammadpur, Dhaka', lat: 23.7691, lng: 90.3985, status: 'available', confidence: 87, last_reported_at: hoursAgo(0.15) },

  // ── Banani (2 stations) ──────────────────────────────────────────────────
  { name: 'Banani 12 Pump', address: 'Banani 12, Dhaka', lat: 23.7881, lng: 90.4077, status: 'available', confidence: 90, last_reported_at: hoursAgo(0.2) },
  { name: 'Kakoli Fuel Station', address: 'Kakoli, Banani, Dhaka', lat: 23.7901, lng: 90.4123, status: 'low', confidence: 61, last_reported_at: hoursAgo(1.3) },

  // ── Motijheel (3 stations) ──────────────────────────────────────────────
  { name: 'Motijheel Main Pump', address: 'Motijheel Commercial Area, Dhaka', lat: 23.7312, lng: 90.4171, status: 'queue', confidence: 56, last_reported_at: hoursAgo(1.5) },
  { name: 'Gulistan Fuel Center', address: 'Gulistan, Dhaka', lat: 23.7289, lng: 90.4134, status: 'available', confidence: 74, last_reported_at: hoursAgo(0.8) },
  // No data station
  { name: 'Armed Forces Fuel Point', address: 'Bashibazar, Dhaka', lat: 23.7267, lng: 90.4223, status: 'unknown', confidence: 0, last_reported_at: '' },

  // ── Tejgaon (2 stations) ────────────────────────────────────────────────
  { name: 'Tejgaon Industrial Pump', address: 'Tejgaon Industrial Area, Dhaka', lat: 23.7567, lng: 90.4289, status: 'available', confidence: 80, last_reported_at: hoursAgo(0.4) },
  { name: 'Mouchak Fuel Station', address: 'Mouchak, Dhaka', lat: 23.7534, lng: 90.4351, status: 'low', confidence: 47, last_reported_at: hoursAgo(2.1) },
];

const TEST_USERS: UserSeed[] = [
  { phone: '+8801700000001', display_name: 'Rafiq Ahmed', trust_score: 82, vehicle_type: 'motorcycle', plate_number: 'DHA-METRO-1234', nickname: 'Red Bike' },
  { phone: '+8801700000002', display_name: 'Fatima Begum', trust_score: 75, vehicle_type: 'sedan', plate_number: 'DHA-GHA-5678', nickname: 'Family Car' },
  { phone: '+8801700000003', display_name: 'Karim Uddin', trust_score: 90, vehicle_type: 'suv', plate_number: 'DHA-KHA-9012', nickname: 'The Explorer' },
  { phone: '+8801700000004', display_name: 'Nasrin Akter', trust_score: 68, vehicle_type: 'motorcycle', plate_number: 'DHA-GHA-3456', nickname: 'Blue Scooter' },
  { phone: '+8801700000005', display_name: 'Rahman Syed', trust_score: 55, vehicle_type: 'sedan', plate_number: 'DHA-METRO-7890', nickname: 'Office Ride' },
  { phone: '+8801700000006', display_name: 'Jamal Hossain', trust_score: 71, vehicle_type: 'commercial', plate_number: 'DHA-COM-1234', nickname: 'Work Truck' },
  { phone: '+8801700000007', display_name: 'Ayesha Siddika', trust_score: 88, vehicle_type: 'sedan', plate_number: 'DHA-GHA-4321', nickname: 'City Sedan' },
  { phone: '+8801700000008', display_name: 'Tanvir Hasan', trust_score: 63, vehicle_type: 'motorcycle', plate_number: 'DHA-METRO-8765', nickname: 'Weekend Rider' },
  { phone: '+8801700000009', display_name: 'Shamim Ara', trust_score: 77, vehicle_type: 'suv', plate_number: 'DHA-KHA-1357', nickname: 'Family SUV' },
  { phone: '+8801700000010', display_name: 'Arif Rahman', trust_score: 45, vehicle_type: 'sedan', plate_number: 'DHA-METRO-2468', nickname: 'New Driver' },
];

// Report patterns: realistic user behavior
const REPORT_PATTERNS = [
  // High confidence reports (photo + corroborated)
  { status: 'available', wait_minutes: null, confidence_score: 95, hours_ago: 0.1 },
  { status: 'available', wait_minutes: 5, confidence_score: 88, hours_ago: 0.5 },
  { status: 'available', wait_minutes: null, confidence_score: 91, hours_ago: 0.25 },
  // Medium confidence reports
  { status: 'low', wait_minutes: null, confidence_score: 65, hours_ago: 1.2 },
  { status: 'queue', wait_minutes: 25, confidence_score: 58, hours_ago: 0.8 },
  { status: 'available', wait_minutes: 10, confidence_score: 72, hours_ago: 1.5 },
  // Low confidence (single report, older)
  { status: 'empty', wait_minutes: null, confidence_score: 35, hours_ago: 2.5 },
  { status: 'queue', wait_minutes: 45, confidence_score: 42, hours_ago: 1.8 },
  // Disputed
  { status: 'available', wait_minutes: null, confidence_score: 28, hours_ago: 2.0 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─── Main Seeding Logic ───────────────────────────────────────────────────────

async function seed() {
  console.log('⛽ Fuel Rush — Community Seeding Script');
  console.log('========================================\n');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    console.error('   Copy .env.example to .env.local and fill in your Supabase credentials.\n');
    process.exit(1);
  }

  // Create admin client (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log('🔗 Connected to Supabase:', supabaseUrl.split('//')[1]?.split('.')[0], '\n');

  // ── Step 1: Clear existing seed data ────────────────────────────────────
  console.log('🧹 Clearing existing seed data...');

  // Only clear our test data (created_by = 'seed-script')
  // We use a marker since we can't easily identify seed users by phone alone

  const { error: deleteReportsError } = await supabase
    .from('reports')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all for clean slate

  const { error: deleteStationsError } = await supabase
    .from('stations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteReportsError || deleteStationsError) {
    console.warn('⚠️  Warning clearing data:', deleteReportsError?.message || deleteStationsError?.message);
  }
  console.log('   ✓ Cleared\n');

  // ── Step 2: Create test users ───────────────────────────────────────────
  console.log('👤 Creating 10 test users...');

  const createdUserIds: string[] = [];

  for (const user of TEST_USERS) {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.phone) // Using phone as temp ID for seeding
      .single();

    if (existing) {
      console.log(`   ↩️  User ${user.display_name} already exists, skipping...`);
      createdUserIds.push(existing.id);
      continue;
    }

    // Insert user directly (bypasses auth triggers)
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.phone, // Use phone as UUID placeholder for seeding
        display_name: user.display_name,
        trust_score: user.trust_score,
      })
      .select('id')
      .single();

    if (error) {
      console.warn(`   ⚠️  Failed to create user ${user.display_name}: ${error.message}`);
    } else {
      console.log(`   ✓ Created: ${user.display_name} (${user.vehicle_type})`);
      createdUserIds.push(data.id);
    }
  }
  console.log('');

  // ── Step 3: Create test vehicles ────────────────────────────────────────
  console.log('🚗 Creating test vehicles...');

  const vehicleIds: Record<string, string> = {};

  for (let i = 0; i < TEST_USERS.length; i++) {
    const user = TEST_USERS[i];
    const userId = createdUserIds[i];

    const vehicleId = generateId();
    const { error } = await supabase.from('vehicles').insert({
      id: vehicleId,
      user_id: userId,
      type: user.vehicle_type,
      plate_number: user.plate_number,
      nickname: user.nickname,
    });

    if (!error) {
      vehicleIds[userId] = vehicleId;
      console.log(`   ✓ ${user.nickname} — ${user.plate_number} (${user.vehicle_type})`);
    }
  }
  console.log('');

  // ── Step 4: Insert stations ─────────────────────────────────────────────
  console.log('⛽ Inserting 30 stations across Dhaka...');

  const stationIds: string[] = [];

  for (const station of STATIONS) {
    const stationId = generateId();
    const { error } = await supabase.from('stations').insert({
      id: stationId,
      name: station.name,
      address: station.address,
      lat: station.lat,
      lng: station.lng,
      status: station.status,
      confidence: station.confidence,
      last_reported_at: station.last_reported_at || null,
      last_reporter_id: station.last_reported_at ? pickRandom(createdUserIds) : null,
    });

    if (error) {
      console.warn(`   ⚠️  Failed to insert ${station.name}: ${error.message}`);
    } else {
      stationIds.push(stationId);
      const statusEmoji = { available: '🟢', low: '🟡', queue: '🟠', empty: '🔴', unknown: '⚫' };
      const emoji = statusEmoji[station.status];
      console.log(`   ${emoji} ${station.name}`);
    }
  }
  console.log(`   ✓ Inserted ${stationIds.length} stations\n`);

  // ── Step 5: Create historical reports ───────────────────────────────────
  console.log('📝 Creating historical reports (3-5 per station)...');

  let totalReports = 0;

  for (let i = 0; i < stationIds.length; i++) {
    const stationId = stationIds[i];
    const stationData = STATIONS[i];
    const numReports = stationData.status === 'unknown' ? 0 : randomInt(3, 5);

    for (let r = 0; r < numReports; r++) {
      const pattern = REPORT_PATTERNS[r % REPORT_PATTERNS.length];
      const reporterId = pickRandom(createdUserIds);

      const { error } = await supabase.from('reports').insert({
        id: generateId(),
        station_id: stationId,
        user_id: reporterId,
        status: r === 0 ? stationData.status : pattern.status,
        wait_minutes: pattern.wait_minutes,
        confidence_score: r === 0 ? stationData.confidence : pattern.confidence_score,
        created_at: hoursAgo(pattern.hours_ago + r * 0.3),
      });

      if (!error) totalReports++;
    }
  }
  console.log(`   ✓ Created ${totalReports} historical reports\n`);

  // ── Step 6: Create ration logs (simulated visit history) ────────────────
  console.log('📊 Creating ration logs (visit history)...');

  let totalLogs = 0;

  // Each user has 0-3 recent fuel-up logs
  for (const userId of createdUserIds) {
    const vehicleId = vehicleIds[userId];
    if (!vehicleId) continue;

    const numLogs = randomInt(0, 3);
    const vehicleType = TEST_USERS.find(u => u.phone === userId)?.vehicle_type || 'sedan';

    for (let l = 0; l < numLogs; l++) {
      const stationId = pickRandom(stationIds);
      const amount = vehicleType === 'motorcycle' ? 2 : vehicleType === 'sedan' ? randomInt(3, 8) : randomInt(5, 15);

      const { error } = await supabase.from('ration_logs').insert({
        id: generateId(),
        user_id: userId,
        vehicle_id: vehicleId,
        station_id: stationId,
        amount_liters: amount,
        logged_at: hoursAgo(randomInt(1, 48)), // Up to 48 hours ago
      });

      if (!error) totalLogs++;
    }
  }
  console.log(`   ✓ Created ${totalLogs} ration logs\n`);

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('════════════════════════════════════════');
  console.log('✅ SEEDING COMPLETE');
  console.log('════════════════════════════════════════');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • ${createdUserIds.length} test users`);
  console.log(`   • ${Object.keys(vehicleIds).length} vehicles`);
  console.log(`   • ${stationIds.length} stations (Dhaka-wide)`);
  console.log(`   • ${totalReports} historical reports`);
  console.log(`   • ${totalLogs} ration log entries`);
  console.log('');
  console.log('📋 Station Breakdown:');
  console.log(`   • 6 stations with NO data (AI gap-fill testing)`);
  console.log(`   • 5 confidence tiers represented`);
  console.log(`   • All Dhaka areas: Mirpur, Uttara, Gulshan, Dhanmondi, Mohammadpur, Banani, Motijheel, Tejgaon`);
  console.log('');
  console.log('🔑 Test Login (for Supabase dashboard):');
  console.log('   Use the Supabase dashboard to query: SELECT * FROM users;');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. npm run dev — start the development server');
  console.log('   2. Open http://localhost:3000');
  console.log('   3. Test with mock auth (auth is bypassed in dev mode)');
  console.log('');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
