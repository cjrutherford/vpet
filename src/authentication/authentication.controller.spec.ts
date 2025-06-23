import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { AuthService } from './auth/auth.service';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let service: AuthService;

  let mockAuthService: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      resetPassword: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.login with correct params and return result', async () => {
    const loginDto = { email: 'test@example.com', password: 'pass' };
    const expectedResult = 'login-token';
    mockAuthService.login!.mockResolvedValue(expectedResult);

    const result = await controller.login(loginDto as any);

    expect(mockAuthService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    expect(result).toBe(expectedResult);
  });

  it('should call authService.register with correct params and return result', async () => {
    const createUserDto = { email: 'test@example.com', password: 'pass', confirmPassword: 'pass' };
    const expectedResult = 'register-token';
    mockAuthService.register!.mockResolvedValue(expectedResult);

    const result = await controller.register(createUserDto as any);

    expect(mockAuthService.register).toHaveBeenCalledWith(
      createUserDto.email,
      createUserDto.password,
      createUserDto.confirmPassword
    );
    expect(result).toBe(expectedResult);
  });

  it('should call authService.resetPassword with correct params and return result', async () => {
    const resetUserPasswordDto = {
      email: 'test@example.com',
      oldPassword: 'oldpass',
      newPassword: 'newpass',
      confirmNewPassword: 'newpass'
    };
    const expectedResult = 'reset-token';
    mockAuthService.resetPassword!.mockResolvedValue(expectedResult);

    const result = await controller.resetPassword(resetUserPasswordDto as any);

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
      resetUserPasswordDto.email,
      resetUserPasswordDto.oldPassword,
      resetUserPasswordDto.newPassword,
      resetUserPasswordDto.confirmNewPassword
    );
    expect(result).toBe(expectedResult);
  });

  it('should call authService.logout with correct param and return result', async () => {
    const token = 'logout-token';
    const expectedResult = 'logged out';
    mockAuthService.logout!.mockResolvedValue(expectedResult);

    const result = await controller.logout(token);

    expect(mockAuthService.logout).toHaveBeenCalledWith(token);
    expect(result).toBe(expectedResult);
  });
});
