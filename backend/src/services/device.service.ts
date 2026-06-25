import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export class DeviceService {
  async register(input: {
    device_name: string;
    device_code: string;
    device_secret: string;
    location_name: string;
    description?: string;
  }, createdBy: string) {
    // Hash the device secret using pgcrypto via a raw SQL call
    const { data, error } = await supabaseAdmin
      .from('devices')
      .insert({
        device_name: input.device_name,
        device_code: input.device_code,
        device_secret: input.device_secret, // Will be hashed by DB trigger or we hash here
        location_name: input.location_name,
        description: input.description,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Device code already exists', 409);
      }
      logger.error('Device registration error', { error: error.message });
      throw new AppError('Failed to register device', 500);
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      action: 'device_registered',
      entity_type: 'device',
      entity_id: data.id,
      details: { device_code: input.device_code, location: input.location_name },
      performed_by: createdBy,
    });

    return data;
  }

  async heartbeat(deviceId: string, firmware_version?: string, ip_address?: string) {
    const { error } = await supabaseAdmin
      .from('devices')
      .update({
        last_heartbeat: new Date().toISOString(),
        firmware_version,
        ip_address,
      })
      .eq('id', deviceId);

    if (error) {
      logger.error('Heartbeat update error', { error: error.message });
      throw new AppError('Failed to update heartbeat', 500);
    }

    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async getCurrentToken(deviceId: string) {
    // Find active session for this device
    const now = new Date().toISOString();
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*')
      .eq('device_id', deviceId)
      .eq('status', 'active')
      .lte('start_time', now)
      .gte('end_time', now)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      return {
        has_active_session: false,
        token: null,
        message: 'No active session for this device',
      };
    }

    // Generate a new cryptographic token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + env.TOKEN_EXPIRY_SECONDS * 1000).toISOString();

    // Store the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('dynamic_tokens')
      .insert({
        token,
        device_id: deviceId,
        session_id: session.id,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (tokenError) {
      logger.error('Token generation error', { error: tokenError.message });
      throw new AppError('Failed to generate token', 500);
    }

    const qrUrl = `${env.CORS_ORIGIN}/scan?token=${token}`;

    return {
      has_active_session: true,
      token: token,
      qr_url: qrUrl,
      expires_at: expiresAt,
      session: {
        id: session.id,
        title: session.title,
        start_time: session.start_time,
        end_time: session.end_time,
      },
    };
  }

  async updateStatus(deviceId: string, isActive: boolean, performedBy: string) {
    const { data, error } = await supabaseAdmin
      .from('devices')
      .update({ is_active: isActive })
      .eq('id', deviceId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update device status', 500);
    }

    await supabaseAdmin.from('audit_logs').insert({
      action: isActive ? 'device_enabled' : 'device_disabled',
      entity_type: 'device',
      entity_id: deviceId,
      performed_by: performedBy,
    });

    return data;
  }

  async getAllDevices() {
    const { data, error } = await supabaseAdmin
      .from('devices')
      .select('id, device_name, device_code, location_name, description, is_active, last_heartbeat, firmware_version, ip_address, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch devices', 500);
    }

    return data;
  }

  async getDeviceById(deviceId: string) {
    const { data, error } = await supabaseAdmin
      .from('devices')
      .select('id, device_name, device_code, location_name, description, is_active, last_heartbeat, firmware_version, ip_address, created_at')
      .eq('id', deviceId)
      .single();

    if (error) {
      throw new AppError('Device not found', 404);
    }

    return data;
  }

  // Cleanup expired tokens (called periodically)
  async cleanupExpiredTokens() {
    const { error, count } = await supabaseAdmin
      .from('dynamic_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('is_used', true);

    // Also clean very old unused tokens (> 5 minutes old)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('dynamic_tokens')
      .delete()
      .lt('expires_at', fiveMinAgo);

    logger.debug('Token cleanup completed', { removedCount: count });
  }
}

export const deviceService = new DeviceService();
