import { AuthGuard } from './auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TokenEntity } from 'src/database/entities';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let tokenRepo: jest.Mocked<Repository<TokenEntity>>;
  let mockContext: jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    tokenRepo = {
      findOne: jest.fn(),
    } as any;

    guard = new AuthGuard(tokenRepo);

    mockContext = {
      switchToHttp: jest.fn(),
    } as any;
  });

  function setRequestHeaders(headers: Record<string, any>) {
    const req = { headers };
    (mockContext.switchToHttp as jest.Mock).mockReturnValue({
      getRequest: () => req,
    });
  }

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return false if no authorization header', async () => {
    setRequestHeaders({});
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(false);
  });

  it('should return false if authorization header is not a string', async () => {
    setRequestHeaders({ authorization: 12345 });
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(false);
  });

  it('should return false if authorization header does not start with Bearer', async () => {
    setRequestHeaders({ authorization: 'Token abcdef' });
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(false);
  });

  it('should return false if token is missing after Bearer', async () => {
    setRequestHeaders({ authorization: 'Bearer ' });
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(false);
  });

  it('should return false if token is not found in database', async () => {
    setRequestHeaders({ authorization: 'Bearer validtoken' });
    tokenRepo.findOne.mockResolvedValue(null);
    const result = await guard.canActivate(mockContext);
    expect(tokenRepo.findOne).toHaveBeenCalledWith({
      where: { token: 'validtoken', isRevoked: false },
    });
    expect(result).toBe(false);
  });

  it('should return true if token is found and not revoked', async () => {
    setRequestHeaders({ authorization: 'Bearer validtoken' });
    tokenRepo.findOne.mockResolvedValue({
      id: 1,
      token: 'validtoken',
      isRevoked: false,
    } as any);
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should check Authorization header if authorization is not present', async () => {
    setRequestHeaders({ Authorization: 'Bearer validtoken' });
    tokenRepo.findOne.mockResolvedValue({
      id: 1,
      token: 'validtoken',
      isRevoked: false,
    } as any);
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
