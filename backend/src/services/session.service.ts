import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { CreateSessionInput, UpdateSessionInput } from '../validators/schemas';

export class SessionService {
  async create(input: CreateSessionInput, createdBy: string) {
    // Verify device exists and is active
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('devices')
      .select('id, is_active')
      .eq('id', input.device_id)
      .single();

    if (deviceError || !device) {
      throw new AppError('Device not found', 404);
    }

    if (!device.is_active) {
      throw new AppError('Device is not active', 400);
    }

    // Check for overlapping sessions on the same device
    const { data: existing } = await supabaseAdmin
      .from('attendance_sessions')
      .select('id')
      .eq('device_id', input.device_id)
      .in('status', ['scheduled', 'active'])
      .or(`and(start_time.lte.${input.end_time},end_time.gte.${input.start_time})`);

    if (existing && existing.length > 0) {
      throw new AppError('Session overlaps with an existing session on this device', 409);
    }

    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .insert({
        ...input,
        created_by: createdBy,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      logger.error('Session creation error', { error: error.message });
      throw new AppError('Failed to create session', 500);
    }

    await supabaseAdmin.from('audit_logs').insert({
      action: 'session_created',
      entity_type: 'session',
      entity_id: data.id,
      details: { title: input.title, device_id: input.device_id },
      performed_by: createdBy,
    });

    return data;
  }

  async getAll(page: number = 1, limit: number = 20, status?: string) {
    let query = supabaseAdmin
      .from('attendance_sessions')
      .select('*, devices(device_name, location_name), users!attendance_sessions_created_by_fkey(name)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('start_time', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new AppError('Failed to fetch sessions', 500);
    }

    return {
      sessions: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getById(sessionId: string) {
    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*, devices(device_name, location_name, device_code), users!attendance_sessions_created_by_fkey(name, email)')
      .eq('id', sessionId)
      .single();

    if (error) {
      throw new AppError('Session not found', 404);
    }

    // Get attendance count
    const { count } = await supabaseAdmin
      .from('attendance_records')
      .select('id', { count: 'exact' })
      .eq('session_id', sessionId);

    return { ...data, attendance_count: count || 0 };
  }

  async update(sessionId: string, input: UpdateSessionInput, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .update(input)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update session', 500);
    }

    await supabaseAdmin.from('audit_logs').insert({
      action: 'session_updated',
      entity_type: 'session',
      entity_id: sessionId,
      details: input,
      performed_by: userId,
    });

    return data;
  }

  async delete(sessionId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('attendance_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      throw new AppError('Failed to delete session', 500);
    }

    await supabaseAdmin.from('audit_logs').insert({
      action: 'session_deleted',
      entity_type: 'session',
      entity_id: sessionId,
      performed_by: userId,
    });

    return { message: 'Session deleted' };
  }

  async startSession(sessionId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .update({ status: 'active', start_time: new Date().toISOString() })
      .eq('id', sessionId)
      .in('status', ['scheduled'])
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to start session. Session may already be active or completed.', 400);
    }

    await supabaseAdmin.from('audit_logs').insert({
      action: 'session_started',
      entity_type: 'session',
      entity_id: sessionId,
      performed_by: userId,
    });

    return data;
  }

  async endSession(sessionId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .update({ status: 'completed', end_time: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to end session. Session may not be active.', 400);
    }

    await supabaseAdmin.from('audit_logs').insert({
      action: 'session_ended',
      entity_type: 'session',
      entity_id: sessionId,
      performed_by: userId,
    });

    return data;
  }
}

export const sessionService = new SessionService();
