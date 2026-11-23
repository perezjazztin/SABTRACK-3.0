import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LoginPage from '@/app/login/page';
import * as authContext from '@/lib/auth-context';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LoginPage Role-Based Redirection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('redirects BARANGAY_STAFF to /admin on login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      id: 2,
      email: 'staff.demo@sabtrack.local',
      role: 'BARANGAY_STAFF',
      full_name: 'Demo Staff',
      is_active: true,
      created_at: new Date().toISOString(),
    });

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      permissions: [],
      loading: false,
      error: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Account Email/i), {
      target: { value: 'staff.demo@sabtrack.local' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'SabtrackDevPass2026!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'staff.demo@sabtrack.local',
        password: 'SabtrackDevPass2026!',
      });
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('redirects BARANGAY_ADMIN to /admin on login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      id: 3,
      email: 'admin.demo@sabtrack.local',
      role: 'BARANGAY_ADMIN',
      full_name: 'Demo Admin',
      is_active: true,
      created_at: new Date().toISOString(),
    });

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      permissions: [],
      loading: false,
      error: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Account Email/i), {
      target: { value: 'admin.demo@sabtrack.local' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'SabtrackDevPass2026!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('redirects RESIDENT to /resident on login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      id: 1,
      email: 'resident.demo@sabtrack.local',
      role: 'RESIDENT',
      full_name: 'Demo Resident',
      is_active: true,
      created_at: new Date().toISOString(),
    });

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      permissions: [],
      loading: false,
      error: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Account Email/i), {
      target: { value: 'resident.demo@sabtrack.local' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'SabtrackDevPass2026!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/resident');
    });
  });

  it('does not render Evaluation Demo Accounts preset box', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      permissions: [],
      loading: false,
      error: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<LoginPage />);

    expect(screen.queryByText(/Evaluation Demo Accounts/i)).not.toBeInTheDocument();
  });

  it('decreases lockout seconds in real-time when throttled with 429 rate limit', async () => {
    vi.useFakeTimers();
    const mockLogin = vi.fn().mockRejectedValue(
      new Error('Too many failed login attempts. Please wait 10 seconds before retrying.')
    );

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      permissions: [],
      loading: false,
      error: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Account Email/i), {
      target: { value: 'resident.demo@sabtrack.local' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'WrongPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    // Await promise rejection
    await vi.advanceTimersByTimeAsync(0);

    // Initial message shows 10 seconds and decreasing timer badge
    expect(
      screen.getByText(/Too many failed login attempts\. Please wait 10 seconds before retrying\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Cooldown remaining:/i)).toBeInTheDocument();
    expect(screen.getByText(/10s decreasing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wait 10s/i })).toBeDisabled();

    // Advance 1 second -> should show 9 seconds
    await vi.advanceTimersByTimeAsync(1000);
    expect(
      screen.getByText(/Too many failed login attempts\. Please wait 9 seconds before retrying\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/9s decreasing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wait 9s/i })).toBeDisabled();

    // Advance remaining 9 seconds -> lockout expired
    await vi.advanceTimersByTimeAsync(9000);
    expect(
      screen.getByText(/Lockout expired\. You may now try signing in again\./i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Cooldown remaining:/i)).not.toBeInTheDocument();

    // User re-enters password now that lockout is lifted
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'NewPassword123!' },
    });
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeEnabled();

    vi.useRealTimers();
  });

  it('renders facial verification sign in button and alerts if email is missing', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      permissions: [],
      loading: false,
      error: null,
      isAuthenticated: false,
      login: vi.fn(),
      loginWithFace: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<LoginPage />);

    const faceLoginBtn = screen.getByRole('button', { name: /Facial Verification Sign In/i });
    expect(faceLoginBtn).toBeInTheDocument();

    // Click without email entered
    fireEvent.click(faceLoginBtn);
    expect(
      screen.getByText(/Please enter your Account Email above first so we can verify your face/i)
    ).toBeInTheDocument();
  });

  it('opens facial verification modal and signs in resident when face is verified', async () => {
    const mockLoginWithFace = vi.fn().mockResolvedValue({
      id: 1,
      email: 'resident.face@sabtrack.local',
      role: 'RESIDENT',
      full_name: 'Face Verified Resident',
      is_active: true,
      created_at: new Date().toISOString(),
    });

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      permissions: [],
      loading: false,
      error: null,
      isAuthenticated: false,
      login: vi.fn(),
      loginWithFace: mockLoginWithFace,
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Account Email/i), {
      target: { value: 'resident.face@sabtrack.local' },
    });

    const faceLoginBtn = screen.getByRole('button', { name: /Facial Verification Sign In/i });
    fireEvent.click(faceLoginBtn);

    // Face capture modal opens in direct facial verification mode without Active Liveness Progression
    expect(await screen.findByRole('heading', { name: /Facial Verification Sign In/i })).toBeInTheDocument();
    expect(screen.queryByText(/Active Liveness Progression/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Blink Verification/i)).toBeInTheDocument();

    // Click manual Capture Face Photo button inside modal
    const captureBtn = screen.getByRole('button', { name: /Capture Face Photo/i });
    fireEvent.click(captureBtn);

    await waitFor(() => {
      expect(mockLoginWithFace).toHaveBeenCalled();
      const [calledEmail] = mockLoginWithFace.mock.calls[0];
      expect(calledEmail).toBe('resident.face@sabtrack.local');
      expect(mockPush).toHaveBeenCalledWith('/resident');
    });
  });
});
