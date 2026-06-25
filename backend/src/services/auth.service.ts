import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { SignupInput } from '../validators/schemas';

export class AuthService {
  async signup(input: SignupInput) {
    const { email, password, name, role, roll_number, phone } = input;

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (authError) {
      logger.error('Signup error', { error: authError.message });
      throw new Error(authError.message);
    }

    // Update profile with additional fields
    if (roll_number || phone) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ roll_number, phone })
        .eq('id', authData.user.id);

      if (updateError) {
        logger.warn('Failed to update profile fields', { error: updateError.message });
      }
    }

    // Get the complete profile
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return { user: profile };
  }

  async login(email: string, password: string) {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('Login failed', { email, error: error.message });
      throw new Error('Invalid email or password');
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile && !profile.is_active) {
      throw new Error('Account is deactivated');
    }

    return {
      user: profile,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new Error('Invalid refresh token');
    }

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
    };
  }

  async forgotPassword(email: string) {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      logger.error('Password reset error', { error: error.message });
      throw new Error('Failed to send reset email');
    }

    return { message: 'Password reset email sent' };
  }

  async logout(userId: string) {
    // Log the logout action
    await supabaseAdmin.from('audit_logs').insert({
      action: 'user_logout',
      entity_type: 'user',
      entity_id: userId,
      performed_by: userId,
    });

    return { message: 'Logged out successfully' };
  }
}

export const authService = new AuthService();
