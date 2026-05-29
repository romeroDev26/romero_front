import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

// ─── Mocks ───

const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockNotifySuccess = vi.fn();
const mockNotifyError = vi.fn();
const mockLockFromSeconds = vi.fn();
const mockClearLock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../services/auth.service', () => ({
  authService: {
    login: (...args: any[]) => mockLogin(...args),
  },
}));

vi.mock('@/utils/sileo-toast', () => ({
  authNotify: {
    success: (...args: any[]) => mockNotifySuccess(...args),
    error: (...args: any[]) => mockNotifyError(...args),
  },
}));

vi.mock('@/hooks/useLockoutCountdown', () => ({
  useLockoutCountdown: () => ({
    isLocked: false,
    formattedTime: '00:00',
    lockFromSeconds: (...args: any[]) => mockLockFromSeconds(...args),
    clearLock: () => mockClearLock(),
  }),
}));

vi.mock('@/hooks/useThemeTransition', () => ({
  useThemeTransition: () => ({
    toggleTheme: vi.fn(),
    resolvedTheme: 'light',
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const setup = () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    return { user };
  };

  it('renders login form with email, password and submit button', () => {
    setup();

    expect(screen.getByPlaceholderText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByText(/bienvenido/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email on submit', async () => {
    const { user } = setup();

    await user.type(screen.getByPlaceholderText(/correo electrónico/i), 'not-an-email');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/ingrese un email válido/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password on submit', async () => {
    const { user } = setup();

    await user.type(screen.getByPlaceholderText(/correo electrónico/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), '123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/la contraseña debe tener al menos 6 caracteres/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const { user } = setup();

    const passwordInput = screen.getByPlaceholderText(/contraseña/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    // El botón del ojo está justo al lado del input de contraseña
    const passwordContainer = passwordInput.closest('div');
    const toggleBtn = passwordContainer?.querySelector('button[type="button"]') as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();

    await user.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('submits form and handles successful login', async () => {
    const { user } = setup();
    mockLogin.mockResolvedValueOnce({});

    await user.type(screen.getByPlaceholderText(/correo electrónico/i), 'admin@romero.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@romero.com',
        password: 'password123',
        rememberMe: false,
      });
    });

    expect(mockNotifySuccess).toHaveBeenCalledWith(
      'Inicio de sesión exitoso',
      expect.any(String)
    );
    expect(mockClearLock).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('stores email in localStorage when rememberMe is checked', async () => {
    const { user } = setup();
    mockLogin.mockResolvedValueOnce({});

    await user.type(screen.getByPlaceholderText(/correo electrónico/i), 'user@romero.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');

    // Click en el switch de Recordarme (el botón circular junto al texto "Recordarme")
    const rememberLabel = screen.getByText(/recordarme/i);
    const rememberSwitch = rememberLabel.previousElementSibling as HTMLButtonElement;
    await user.click(rememberSwitch);

    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(localStorage.getItem('tr_remembered_email')).toBe('user@romero.com');
    });
  });

  it('shows error for 401 invalid credentials', async () => {
    const { user } = setup();
    mockLogin.mockRejectedValueOnce({
      response: { status: 401, data: {} },
    });

    await user.type(screen.getByPlaceholderText(/correo electrónico/i), 'bad@user.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    });

    expect(mockNotifyError).toHaveBeenCalledWith(
      'Credenciales incorrectas',
      expect.any(String)
    );
  });

  it('handles 429 lockout and triggers countdown', async () => {
    const { user } = setup();
    mockLogin.mockRejectedValueOnce({
      response: {
        status: 429,
        data: {
          detail: {
            message: 'Demasiados intentos. Intente más tarde.',
            retry_after_seconds: 300,
          },
        },
      },
    });

    await user.type(screen.getByPlaceholderText(/correo electrónico/i), 'locked@user.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLockFromSeconds).toHaveBeenCalledWith(300);
    });

    expect(mockNotifyError).toHaveBeenCalledWith(
      'Cuenta bloqueada temporalmente',
      'Demasiados intentos. Intente más tarde.'
    );
  });

  it('shows network error when no response', async () => {
    const { user } = setup();
    mockLogin.mockRejectedValueOnce({
      request: {},
      message: 'Network Error',
    });

    await user.type(screen.getByPlaceholderText(/correo electrónico/i), 'user@romero.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/no se pudo conectar con el servidor/i)).toBeInTheDocument();
    });

    expect(mockNotifyError).toHaveBeenCalledWith(
      'Sin conexión',
      expect.any(String)
    );
  });

  it('disables submit button while loading', async () => {
    const { user } = setup();
    let resolveLogin: (value?: unknown) => void;
    mockLogin.mockImplementationOnce(() => new Promise((resolve) => { resolveLogin = resolve; }));

    await user.type(screen.getByPlaceholderText(/correo electrónico/i), 'admin@romero.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /iniciando sesión/i })).toBeDisabled();
    });

    resolveLogin!();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeEnabled();
    });
  });
});
