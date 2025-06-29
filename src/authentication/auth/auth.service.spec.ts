import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import UserEntity from '../../database/entities/user.entity';
import SaltEntity from '../../database/entities/salt.entity';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Partial<Repository<UserEntity>>>;
  let saltRepo: jest.Mocked<Partial<Repository<SaltEntity>>>;
  let config: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    saltRepo = {
      findOne: jest.fn(),
    };

    config = {
      get: jest.fn().mockReturnValue('default_secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UserEntityRepository', useValue: userRepo },
        { provide: 'TokenEntityRepository', useValue: {} },
        { provide: 'SaltEntityRepository', useValue: saltRepo },
        { provide: ConfigService, useValue: config },
      ],
    })
      .overrideProvider('UserEntityRepository')
      .useValue(userRepo)
      .overrideProvider('SaltEntityRepository')
      .useValue(saltRepo)
      .overrideProvider('ConfigService')
      .useValue(config)
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resetPassword', () => {
    let service: AuthService;
    let userRepo: any;
    let saltRepo: any;

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'oldHash',
    };

    const mockSaltEntity = {
      userId: 1,
      salt: 'randomsalt',
    };

    beforeEach(async () => {
      userRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
      };
      saltRepo = {
        findOne: jest.fn(),
      };
      config = {
        get: jest.fn().mockReturnValue('default_secret'),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: 'UserEntityRepository', useValue: userRepo },
          { provide: 'TokenEntityRepository', useValue: {} },
          { provide: 'SaltEntityRepository', useValue: saltRepo },
          { provide: ConfigService, useValue: config },
        ],
      })
        .overrideProvider('UserEntityRepository')
        .useValue(userRepo)
        .overrideProvider('SaltEntityRepository')
        .useValue(saltRepo)
        .compile();

      service = module.get<AuthService>(AuthService);
    });

    it('should throw if new passwords do not match', async () => {
      await expect(
        service.resetPassword(
          'test@example.com',
          'oldPass',
          'newPass',
          'differentPass',
        ),
      ).rejects.toThrow('New passwords do not match');
    });

    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.resetPassword(
          'test@example.com',
          'oldPass',
          'newPass',
          'newPass',
        ),
      ).rejects.toThrow('User not found');
    });

    it('should throw if salt not found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      saltRepo.findOne.mockResolvedValue(null);
      await expect(
        service.resetPassword(
          'test@example.com',
          'oldPass',
          'newPass',
          'newPass',
        ),
      ).rejects.toThrow('Salt not found for user');
    });

    it('should throw if old password is invalid', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      saltRepo.findOne.mockResolvedValue(mockSaltEntity);

      // Simulate hash mismatch
      jest
        .spyOn(crypto, 'pbkdf2Sync')
        .mockReturnValueOnce(Buffer.from('wrongHash', 'utf8'));

      await expect(
        service.resetPassword(
          'test@example.com',
          'oldPass',
          'newPass',
          'newPass',
        ),
      ).rejects.toThrow('Invalid old password');

      (crypto.pbkdf2Sync as jest.Mock).mockRestore?.();
    });

    it('should reset password successfully', async () => {
      saltRepo.findOne.mockResolvedValue(mockSaltEntity);

      // Simulate correct old password hash
      const oldHash = Buffer.from('oldHash', 'utf8');
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        password: oldHash.toString('hex'),
      });
      const newHash = Buffer.from('newHash', 'utf8');

      const pbkdf2SyncMock = jest
        .spyOn(crypto, 'pbkdf2Sync')
        .mockImplementation((pass, salt, iter, len, algo) => {
          if (pass === 'oldPass') return oldHash;
          if (pass === 'newPass') return newHash;
          return Buffer.from('other', 'utf8');
        });

      userRepo.save.mockResolvedValue({
        ...mockUser,
        password: newHash.toString('hex'),
      });

      const result = await service.resetPassword(
        'test@example.com',
        'oldPass',
        'newPass',
        'newPass',
      );
      expect(result).toBe('Password reset successful');
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: newHash.toString('hex') }),
      );

      pbkdf2SyncMock.mockRestore();
    });
  });
  describe('register', () => {
    const mockUser = { id: 1, email: 'test@example.com', password: 'hashed' };
    const mockSaltEntity = { userId: 1, salt: 'randomsalt' };

    beforeEach(() => {
      userRepo.findOne = jest.fn();
      userRepo.create = jest.fn().mockImplementation((data) => ({ ...data }));
      userRepo.save = jest.fn().mockResolvedValue(mockUser);
      saltRepo.create = jest.fn().mockImplementation((data) => ({ ...data }));
      saltRepo.save = jest.fn().mockResolvedValue(mockSaltEntity);
      jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => Buffer.from('randomsalt'));
      jest
        .spyOn(crypto, 'pbkdf2Sync')
        .mockReturnValue(Buffer.from('hashed', 'utf8'));
    });

    afterEach(() => {
      (crypto.randomBytes as jest.Mock).mockRestore?.();
      (crypto.pbkdf2Sync as jest.Mock).mockRestore?.();
    });

    it('should throw if passwords do not match', async () => {
      await expect(
        service.register('test@example.com', 'pass1', 'pass2'),
      ).rejects.toThrow('Passwords do not match');
    });

    it('should throw if user already exists', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      await expect(
        service.register('test@example.com', 'pass', 'pass'),
      ).rejects.toThrow('User already exists');
    });

    it('should register a new user successfully', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.register('test@example.com', 'pass', 'pass');
      expect(result).toBe('Registration successful');
      expect(userRepo.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: Buffer.from('hashed', 'utf8').toString('hex'),
      });
      expect(userRepo.save).toHaveBeenCalled();
      expect(saltRepo.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        salt: Buffer.from('randomsalt').toString('hex'),
      });
      expect(saltRepo.save).toHaveBeenCalled();
    });

  });
  describe('login', () => {
    let service: AuthService;
    let userRepo: any;
    let saltRepo: any;
    let tokenRepo: any;
    let config: any;

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
    };

    const mockSaltEntity = {
      userId: 1,
      salt: 'randomsalt',
    };

    beforeEach(async () => {
      userRepo = {
        findOne: jest.fn(),
      };
      saltRepo = {
        findOne: jest.fn(),
      };
      tokenRepo = {
        create: jest.fn(),
        save: jest.fn(),
      };
      config = {
        get: jest.fn().mockReturnValue('default_secret'),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: 'UserEntityRepository', useValue: userRepo },
          { provide: 'TokenEntityRepository', useValue: tokenRepo },
          { provide: 'SaltEntityRepository', useValue: saltRepo },
          { provide: ConfigService, useValue: config },
        ],
      })
        .overrideProvider('UserEntityRepository')
        .useValue(userRepo)
        .overrideProvider('TokenEntityRepository')
        .useValue(tokenRepo)
        .overrideProvider('SaltEntityRepository')
        .useValue(saltRepo)
        .overrideProvider('ConfigService')
        .useValue(config)
        .compile();

      service = module.get<AuthService>(AuthService);
    });

    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow('User not found');
    });

    it('should throw if salt not found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      saltRepo.findOne.mockResolvedValue(null);
      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow('Salt not found for user');
    });

    it('should throw if password is invalid', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      saltRepo.findOne.mockResolvedValue(mockSaltEntity);
      jest
        .spyOn(crypto, 'pbkdf2Sync')
        .mockReturnValue(Buffer.from('wrongHash', 'utf8'));
      await expect(
        service.login('test@example.com', 'wrongpass'),
      ).rejects.toThrow('Invalid password');
      (crypto.pbkdf2Sync as jest.Mock).mockRestore?.();
    });

    it('should login successfully and return a token', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        password: Buffer.from('hashedPassword', 'utf8').toString('hex'),
      });
      saltRepo.findOne.mockResolvedValue(mockSaltEntity);

      // Simulate correct password hash
      jest
        .spyOn(crypto, 'pbkdf2Sync')
        .mockReturnValue(Buffer.from('hashedPassword', 'utf8'));
      const fakeToken = 'jwt.token.here';
      (jest.spyOn(jwt, 'sign') as jest.Mock).mockReturnValue(fakeToken);

      tokenRepo.create.mockImplementation((data) => data);
      tokenRepo.save.mockResolvedValue({});

      const result = await service.login('test@example.com', 'password');
      expect(result).toBe(fakeToken);
      expect(tokenRepo.create).toHaveBeenCalledWith({
        user: { id: mockUser.id },
        token: fakeToken,
      });
      expect(tokenRepo.save).toHaveBeenCalled();

      (crypto.pbkdf2Sync as jest.Mock).mockRestore?.();
      (jwt.sign as jest.Mock).mockRestore?.();
    });

  });
  describe('logout', () => {
    let service: AuthService;
    let tokenRepo: any;

    const mockTokenEntity = {
    token: 'valid.token.here',
    user: {id: 1},
    isRevoked: false,
    };
    const mockAllTokens = [
    { token: 'token1', userId: 1, isRevoked: false },
    { token: 'token2', userId: 1, isRevoked: false },
    ];

    beforeEach(async () => {
    tokenRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
      AuthService,
      { provide: 'UserEntityRepository', useValue: {} },
      { provide: 'TokenEntityRepository', useValue: tokenRepo },
      { provide: 'SaltEntityRepository', useValue: {} },
      { provide: ConfigService, useValue: {} },
      ],
    })
      .overrideProvider('TokenEntityRepository')
      .useValue(tokenRepo)
      .compile();

    service = module.get<AuthService>(AuthService);
    });

    it('should throw if token is invalid', async () => {
    tokenRepo.findOne.mockResolvedValue(null);
    await expect(service.logout('invalid.token')).rejects.toThrow('Invalid token');
    });

    it('should revoke all tokens for the user and return success message', async () => {
    tokenRepo.findOne.mockResolvedValue(mockTokenEntity);
    tokenRepo.find.mockResolvedValue(mockAllTokens);
    tokenRepo.save.mockImplementation(async (token) => token);

    const result = await service.logout('valid.token.here');
    expect(tokenRepo.findOne).toHaveBeenCalledWith({ where: { token: 'valid.token.here' }, relations: ['user'] });
    expect(tokenRepo.find).toHaveBeenCalledWith({ where: { user: { id: 1 }} });
    expect(tokenRepo.save).toHaveBeenCalledTimes(mockAllTokens.length);
    expect(mockAllTokens.every(t => t.isRevoked)).toBe(true);
    expect(result).toBe('Logout successful');
    });
  });


});
