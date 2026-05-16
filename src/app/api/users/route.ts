import { NextRequest, NextResponse } from 'next/server';
import { hashPasswordIfNeeded } from '@/lib/auth-utils';
import { supabaseFetch, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data, error } = await supabaseFetch<{ id: string; username: string; role: string; createdat?: string }>('users', { params: { select: 'id,username,role,createdat' } });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json(data?.map((u) => ({
      id: u.id || u.username,
      username: u.username,
      role: u.role,
      createdAt: u.createdat,
    })) || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.username || !data.password || !data.role) {
      return NextResponse.json({ error: 'Username, password, and role are required' }, { status: 400 });
    }
    if (data.username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (data.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const hashedPassword = await hashPasswordIfNeeded(data.password);
    console.log('[CreateUser] Password hashed:', hashedPassword?.substring(0, 15) + '...');

    const row = {
      id: data.username,
      username: data.username,
      password: hashedPassword,
      role: data.role,
      createdat: new Date().toISOString(),
    };

    const { data: created, error } = await supabaseFetch('users', {
      method: 'POST',
      body: row,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({ id: row.id, username: row.username, role: row.role, createdAt: row.createdat }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const updates: Record<string, unknown> = {};
    if (data.username !== undefined) updates.username = data.username;
    if (data.password !== undefined) updates.password = await hashPasswordIfNeeded(data.password);
    if (data.role !== undefined) updates.role = data.role;

    const { error } = await supabaseFetch('users', {
      method: 'PATCH',
      body: updates,
      params: { id: `eq.${id}` },
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ id, ...data });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { error } = await supabaseFetch('users', {
      method: 'DELETE',
      params: { id: `eq.${id}` },
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
