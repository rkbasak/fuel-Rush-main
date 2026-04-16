'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLocalRedis } from '@/lib/redis/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Vote rate limiter: 10 votes per minute per user
const VOTE_RATE_LIMIT = 10;
const VOTE_RATE_WINDOW_SEC = 60;
// Duplicate vote window: 1 hour
const DUPLICATE_VOTE_WINDOW_SEC = 3600;

async function checkVoteRateLimit(userId: string): Promise<boolean> {
  try {
    const redis = await getLocalRedis();
    if (!redis) return true; // Skip if Redis unavailable
    const key = `ratelimit:vote:${userId}`;
    const count = await redis.get(key) as number | null;
    if (count !== null && count >= VOTE_RATE_LIMIT) {
      return false;
    }
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, VOTE_RATE_WINDOW_SEC);
    await multi.exec();
    return true;
  } catch {
    return true; // Non-fatal
  }
}

async function checkDuplicateVote(supabase: SupabaseClient, userId: string, stationId: string, voteType: string): Promise<boolean> {
  try {
    const redis = await getLocalRedis();
    if (!redis) {
      // Fallback: check DB directly
      const oneHourAgo = new Date(Date.now() - DUPLICATE_VOTE_WINDOW_SEC * 1000).toISOString();
      const { data } = await supabase
        .from('station_votes')
        .select('id')
        .eq('user_id', userId)
        .eq('station_id', stationId)
        .eq('vote_type', voteType)
        .gte('created_at', oneHourAgo)
        .limit(1);
      return !data || data.length === 0;
    }
    const key = `vote:duplicate:${userId}:${stationId}:${voteType}`;
    const exists = await redis.get(key);
    if (exists) return false;
    await redis.set(key, '1', { EX: DUPLICATE_VOTE_WINDOW_SEC });
    return true;
  } catch {
    return true;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stationId } = await params;
    const body = await req.json();
    const { vote_type } = body;

    // ── Auth check ───────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── Input validation ─────────────────────────────────────────────────────
    if (!vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return NextResponse.json({ error: 'vote_type must be upvote or downvote' }, { status: 400 });
    }

    // ── Rate limiting: 10 votes/min per user ─────────────────────────────────
    const withinLimit = await checkVoteRateLimit(user.id);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many votes. Please wait a moment.' }, { status: 429 });
    }

    // ── Duplicate check: prevent same vote within 1 hour ─────────────────────
    const notDuplicate = await checkDuplicateVote(supabase, user.id, stationId, vote_type);
    if (!notDuplicate) {
      return NextResponse.json({ error: 'You have already submitted this vote recently. Please wait before voting again.' }, { status: 409 });
    }

    // ── Get station current data ─────────────────────────────────────────────
    const { data: station, error: stationError } = await supabase
      .from('stations')
      .select('confidence, status')
      .eq('id', stationId)
      .single();

    if (stationError || !station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    // ── Atomic upsert: insert vote + update station confidence in one tx ────
    // Upsert into station_votes table (atomic — no race condition)
    const { error: upsertError } = await supabase
      .from('station_votes')
      .upsert(
        {
          station_id: stationId,
          user_id: user.id,
          vote_type,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'station_id,user_id' }
      );

    if (upsertError) {
      console.error('Station vote upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }

    // ── Recalculate station confidence from all votes ───────────────────────
    const { data: allVotes } = await supabase
      .from('station_votes')
      .select('vote_type')
      .eq('station_id', stationId);

    const upvotes = (allVotes ?? []).filter((v: { vote_type: string }) => v.vote_type === 'upvote').length;
    const downvotes = (allVotes ?? []).filter((v: { vote_type: string }) => v.vote_type === 'downvote').length;
    const total = upvotes + downvotes;
    const newConfidence = total > 0 ? Math.round((upvotes / total) * 100) : 50;

    const { error: updateError } = await supabase
      .from('stations')
      .update({
        confidence: newConfidence,
        last_reported_at: new Date().toISOString(),
      })
      .eq('id', stationId);

    if (updateError) {
      console.error('Station vote update error:', updateError);
      return NextResponse.json({ error: 'Failed to update station' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        confirmed: vote_type === 'upvote',
        new_confidence: newConfidence,
        upvotes,
        downvotes,
      },
    });
  } catch (error) {
    console.error('Station vote API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
