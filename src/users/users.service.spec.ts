import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserProfileEntity } from '../database/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssetService } from '../asset/asset.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserProfileEntity),
          useValue: {}, // Provide a mock implementation as needed
        },
        {
          provide: AssetService,
          useValue: {}, // Provide a mock implementation as needed
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should return user profile with base64 profile picture', async () => {
      const userId = '123';
      const mockProfile = { id: userId, profilePictureUrl: 'profile.png' };
      const mockBuffer = Buffer.from('imagebinary');
      const userProfileRepo = service['userProfileRepo'];
      const assetService = service['assetService'];

      userProfileRepo.findOne = jest.fn().mockResolvedValue(mockProfile);
      assetService.readAsset = jest.fn().mockResolvedValue(mockBuffer);

      const result = await service.getUserProfile(userId);

      expect(userProfileRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(assetService.readAsset).toHaveBeenCalledWith('profile.png');
      expect(result.profilePictureUrl).toBe(mockBuffer.toString('base64'));
    });

    it('should throw if user profile not found', async () => {
      const userId = 'notfound';
      service['userProfileRepo'].findOne = jest.fn().mockResolvedValue(undefined);

      await expect(service.getUserProfile(userId)).rejects.toThrow(
        `User profile not found for user ID: ${userId}`
      );
    });

    it('should throw if profile picture asset not found', async () => {
      const userId = '123';
      const mockProfile = { id: userId, profilePictureUrl: 'profile.png' };
      service['userProfileRepo'].findOne = jest.fn().mockResolvedValue(mockProfile);
      service['assetService'].readAsset = jest.fn().mockResolvedValue(undefined);

      await expect(service.getUserProfile(userId)).rejects.toThrow(
        `Profile picture not found for user ID: ${userId}`
      );
    });
  });

  describe('createUserProfile', () => {
    it('should create and return new user profile', async () => {
      const userId = '456';
      const base64Pic = Buffer.from('pic').toString('base64');
      const profileData = { profilePictureUrl: base64Pic, name: 'Test' };
      const mockProfile = { ...profileData, userId, profilePictureUrl: 'profile-456.png' };

      const userProfileRepo = service['userProfileRepo'];
      const assetService = service['assetService'];

      userProfileRepo.findOne = jest.fn().mockResolvedValue(undefined);
      assetService.saveAsset = jest.fn().mockResolvedValue('profile-456.png');
      userProfileRepo.create = jest.fn().mockReturnValue(mockProfile);
      userProfileRepo.save = jest.fn().mockResolvedValue(mockProfile);

      const result = await service.createUserProfile(userId, profileData);

      expect(userProfileRepo.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(assetService.saveAsset).toHaveBeenCalled();
      expect(userProfileRepo.create).toHaveBeenCalled();
      expect(userProfileRepo.save).toHaveBeenCalledWith(mockProfile);
      expect(result).toEqual(mockProfile);
    });

    it('should throw if user profile already exists', async () => {
      const userId = '789';
      service['userProfileRepo'].findOne = jest.fn().mockResolvedValue({ userId });

      await expect(
        service.createUserProfile(userId, { profilePictureUrl: 'abc' })
      ).rejects.toThrow(`User profile already exists for user ID: ${userId}`);
    });

    it('should throw if profile picture is missing', async () => {
      const userId = '999';
      service['userProfileRepo'].findOne = jest.fn().mockResolvedValue(undefined);

      await expect(
        service.createUserProfile(userId, {})
      ).rejects.toThrow('Profile picture is required');
    });
  });

  describe('updateUserProfile', () => {
    it('should update profile and save new picture if provided', async () => {
      const userId = '321';
      const oldProfile = { userId, profilePictureUrl: 'old.png', name: 'Old' };
      const newBase64 = Buffer.from('newpic').toString('base64');
      const profileData = { profilePictureUrl: newBase64, name: 'New' };
      const updatedProfile = { ...oldProfile, ...profileData, profilePictureUrl: 'new.png' };

      const userProfileRepo = service['userProfileRepo'];
      const assetService = service['assetService'];

      userProfileRepo.findOne = jest.fn().mockResolvedValue({ ...oldProfile });
      assetService.deleteAsset = jest.fn().mockResolvedValue(undefined);
      assetService.saveAsset = jest.fn().mockResolvedValue('new.png');
      userProfileRepo.save = jest.fn().mockResolvedValue(updatedProfile);

      const result = await service.updateUserProfile(userId, profileData);

      expect(assetService.deleteAsset).toHaveBeenCalledWith('old.png');
      expect(assetService.saveAsset).toHaveBeenCalled();
      expect(userProfileRepo.save).toHaveBeenCalled();
      expect(result).toEqual(updatedProfile);
    });

    it('should update profile without changing picture if not provided', async () => {
      const userId = '654';
      const oldProfile = { userId, profilePictureUrl: 'old.png', name: 'Old' };
      const profileData = { name: 'Updated' };
      const updatedProfile = { ...oldProfile, ...profileData };

      const userProfileRepo = service['userProfileRepo'];
      userProfileRepo.findOne = jest.fn().mockResolvedValue({ ...oldProfile });
      userProfileRepo.save = jest.fn().mockResolvedValue(updatedProfile);

      const result = await service.updateUserProfile(userId, profileData);

      expect(userProfileRepo.save).toHaveBeenCalled();
      expect(result).toEqual(updatedProfile);
    });

    it('should throw if user profile not found', async () => {
      const userId = 'notfound';
      service['userProfileRepo'].findOne = jest.fn().mockResolvedValue(undefined);

      await expect(
        service.updateUserProfile(userId, { name: 'Test' })
      ).rejects.toThrow(`User profile not found for user ID: ${userId}`);
    });
  });

  describe('deleteUserProfile', () => {
    it('should delete user profile and its picture', async () => {
      const userId = '111';
      const profile = { userId, profilePictureUrl: 'pic.png' };
      const userProfileRepo = service['userProfileRepo'];
      const assetService = service['assetService'];

      userProfileRepo.findOne = jest.fn().mockResolvedValue(profile);
      assetService.deleteAsset = jest.fn().mockResolvedValue(undefined);
      userProfileRepo.remove = jest.fn().mockResolvedValue(undefined);

      await service.deleteUserProfile(userId);

      expect(userProfileRepo.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(assetService.deleteAsset).toHaveBeenCalledWith('pic.png');
      expect(userProfileRepo.remove).toHaveBeenCalledWith(profile);
    });

    it('should delete user profile without picture', async () => {
      const userId = '222';
      const profile = { userId, profilePictureUrl: undefined };
      const userProfileRepo = service['userProfileRepo'];
      const assetService = service['assetService'];

      userProfileRepo.findOne = jest.fn().mockResolvedValue(profile);
      assetService.deleteAsset = jest.fn();
      userProfileRepo.remove = jest.fn().mockResolvedValue(undefined);

      await service.deleteUserProfile(userId);

      expect(assetService.deleteAsset).not.toHaveBeenCalled();
      expect(userProfileRepo.remove).toHaveBeenCalledWith(profile);
    });

    it('should throw if user profile not found', async () => {
      const userId = 'notfound';
      service['userProfileRepo'].findOne = jest.fn().mockResolvedValue(undefined);

      await expect(service.deleteUserProfile(userId)).rejects.toThrow(
        `User profile not found for user ID: ${userId}`
      );
    });
  });
});
