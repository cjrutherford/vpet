import { Inject, Injectable } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssetService } from '../asset/asset.service';
import { UserProfileEntity } from '../database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        @Inject(getRepositoryToken(UserProfileEntity)) private readonly userProfileRepo: Repository<UserProfileEntity>,
        private readonly assetService: AssetService
    ) {}

    async getUserProfile(userId: string): Promise<UserProfileEntity> {
        const profile = await this.userProfileRepo.findOne({
            where: { id: userId },
        });
        if (!profile) {
            throw new Error(`User profile not found for user ID: ${userId}`);
        }
        const profileAsset = await this.assetService.readAsset(profile.profilePictureUrl!);
        if (!profileAsset) {
            throw new Error(`Profile picture not found for user ID: ${userId}`);
        }
        const base64ProfilePicture = profileAsset.toString('base64');
        return {
            ...profile,
            profilePictureUrl: base64ProfilePicture,
        };
    }

    async createUserProfile(userId: string, profileData: Partial<UserProfileEntity>): Promise<UserProfileEntity> { 
        const existingProfile = await this.userProfileRepo.findOne({
            where: { userId },
        });
        if (existingProfile) {
            throw new Error(`User profile already exists for user ID: ${userId}`);
        }
        // this should come in as a base64 string, so we need to handle it accordingly
        if (!profileData.profilePictureUrl) {
            throw new Error('Profile picture is required');
        }
        const profilePictureBuffer = Buffer.from(profileData.profilePictureUrl, 'base64');
        const profilePictureUrl = await this.assetService.saveAsset(`profile-${userId}.png`, profilePictureBuffer);
        const newProfile = this.userProfileRepo.create({
            ...profileData,
            profilePictureUrl,
            userId,
        });
        return await this.userProfileRepo.save(newProfile);
    }

    async updateUserProfile(userId: string, profileData: Partial<UserProfileEntity>): Promise<UserProfileEntity> {
        const existingProfile = await this.userProfileRepo.findOne({
            where: { userId },
        });
        if (!existingProfile) {
            throw new Error(`User profile not found for user ID: ${userId}`);
        }
        if (profileData.profilePictureUrl) {
            // we should always have a profile picture, but only one. delete the old one if it exists
            if (existingProfile.profilePictureUrl) {
                await this.assetService.deleteAsset(existingProfile.profilePictureUrl);
            }
            const profilePictureBuffer = Buffer.from(profileData.profilePictureUrl, 'base64');
            const profilePictureUrl = await this.assetService.saveAsset(`profile-${userId}.png`, profilePictureBuffer);
            existingProfile.profilePictureUrl = profilePictureUrl;
        }
        Object.assign(existingProfile, profileData);
        return await this.userProfileRepo.save(existingProfile);
    }

    async deleteUserProfile(userId: string): Promise<void> {
        const existingProfile = await this.userProfileRepo.findOne({
            where: { userId },
        });
        if (!existingProfile) {
            throw new Error(`User profile not found for user ID: ${userId}`);
        }
        if (existingProfile.profilePictureUrl) {
            await this.assetService.deleteAsset(existingProfile.profilePictureUrl);
        }
        await this.userProfileRepo.remove(existingProfile);
    }
}
