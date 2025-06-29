/**
 * Service for handling authentication logic such as login, registration, and token management.
 */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import {UserEntity, SaltEntity, TokenEntity} from '../../database/entities'
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    /**
     * Constructs the AuthService with injected repositories and config.
     */
    constructor(
        @Inject(getRepositoryToken(UserEntity)) private readonly userRepo: Repository<UserEntity>,
        @Inject(getRepositoryToken(TokenEntity)) private readonly tokenRepo: Repository<TokenEntity>,
        @Inject(getRepositoryToken(SaltEntity)) private readonly saltRepo: Repository<SaltEntity>,
        config: ConfigService,
    ) {}

    /**
     * Authenticates a user and returns a JWT token if successful.
     * @param email The user's email
     * @param password The user's password
     * @returns The JWT token string
     * @throws Error if user not found or password is invalid
     */
    async login(email: string, password: string): Promise<string> {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }

        // Retrieve the salt for the user
        const saltEntity = await this.saltRepo.findOne({ where: { userId: user.id } });
        if (!saltEntity) {
            throw new Error('Salt not found for user');
        }

        // Hash the provided password with the salt
        const hash = crypto.pbkdf2Sync(password, saltEntity.salt, 10000, 64, 'sha512').toString('hex');
        if (hash !== user.password) {
            throw new Error('Invalid password');
        }

        const payload = { userId: user.id, email: user.email };
        const secret = process.env.APPLICATION_ENCRYPTION_SEED || 'default_secret';
        const token = jwt.sign(payload, secret, { expiresIn: '6h' });

        // Store the token in the database
        const tokenEntity = this.tokenRepo.create({ user: {id: user.id }, token });
        await this.tokenRepo.save(tokenEntity);

        return token;
    }

    // Example method for user registration
    async register(email: string, password: string, confirmPassword: string): Promise<string> {
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        const existingUser = await this.userRepo.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('User already exists');
        }
        // Generate a new salt
        const salt = crypto.randomBytes(16).toString('hex');

        // Hash the password with the salt
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

        // Create the user entity
        const user = this.userRepo.create({ email, password: hash });
        const savedUser = await this.userRepo.save(user);

        // Create and store the salt entity
        const saltEntity = this.saltRepo.create({ userId: savedUser.id, salt });
        await this.saltRepo.save(saltEntity);
        // Implement your registration logic here
        return 'Registration successful';
    }

    async resetPassword(email: string, oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<string> {
        if (newPassword !== confirmNewPassword) {
            throw new Error('New passwords do not match');
        }
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }

        // Retrieve the salt for the user
        const saltEntity = await this.saltRepo.findOne({ where: { userId: user.id } });
        if (!saltEntity) {
            throw new Error('Salt not found for user');
        }

        // Hash the old password with the salt
        const oldHash = crypto.pbkdf2Sync(oldPassword, saltEntity.salt, 10000, 64, 'sha512').toString('hex');
        if (oldHash !== user.password) {
            throw new Error('Invalid old password');
        }
        // Hash the new password with the salt
        const newHash = crypto.pbkdf2Sync(newPassword, saltEntity.salt, 10000, 64, 'sha512').toString('hex');
        // Update the user's password
        user.password = newHash;
        await this.userRepo.save(user);
        return 'Password reset successful';
    }

    async logout(token: string): Promise<string> {
        // Implement your logout logic here, such as invalidating the token
        const tokenEntity = await this.tokenRepo.findOne({ where: { token }, relations: ['user']  });
        if (!tokenEntity) {
            throw new Error('Invalid token');
        }
        const userId = tokenEntity.user.id;
        const allTokens = await this.tokenRepo.find({ where: { user: { id: userId } }});
        // Mark all tokens for the user as revoked
        for (const t of allTokens) {
            t.isRevoked = true;
            await this.tokenRepo.save(t);
        }
        return 'Logout successful';
    }
}
