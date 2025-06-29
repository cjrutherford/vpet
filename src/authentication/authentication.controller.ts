/**
 * Controller for authentication-related endpoints (login, register, reset password).
 * Handles user authentication and delegates logic to the AuthService.
 */
import { Body, Controller, Post, Res, HttpException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth/auth.service';
import { CreateUserDto, LoginDto, ResetUserPasswordDto } from '../database/entities';
import { Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthenticationController {
    /**
     * Injects the AuthService for authentication logic.
     */
    constructor(private readonly authService: AuthService) {}

    /**
     * Authenticates a user and returns a JWT token.
     * @param loginDto The login credentials (email, password)
     * @returns An object containing the JWT token
     */
    @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<{ token: string }> {
        try {
            const token = await this.authService.login(loginDto.email, loginDto.password);
            return { token }
        } catch (error) {
            console.error('Login failed:', error);
            throw new HttpException(
                { message: 'login failed', error: error.message },
                400
            );
        }
    }

    /**
     * Registers a new user.
     * @param createUserDto The registration data (email, password, confirmPassword)
     * @param response The HTTP response object
     * @returns An object containing a success message
     */
    @Post('register')
    async register(@Body() createUserDto: CreateUserDto, @Res() response: Response): Promise<{message: string}> {
        try{
            const message = await this.authService.register(createUserDto.email, createUserDto.password, createUserDto.confirmPassword);
            return { message}
        } catch (error) {
            console.error('Registration failed:', error);
            throw new HttpException(
                { message: 'registration failed', error: error.message },
                400
            );
        }
    }

    /**
     * Resets a user's password.
     * @param resetUserPasswordDto The reset password data (email, oldPassword, newPassword, confirmNewPassword)
     * @returns An object containing a success message
     */
    @Post('reset-password')
    async resetPassword(@Body() resetUserPasswordDto: ResetUserPasswordDto): Promise<{message: string}> {
        try {
            const resetResponse = await this.authService.resetPassword(
                resetUserPasswordDto.email,
                resetUserPasswordDto.oldPassword,
                resetUserPasswordDto.newPassword,
                resetUserPasswordDto.confirmNewPassword
            );
            return { message: resetResponse };
        } catch (error) {
            console.error('Reset password failed:', error);
            throw new HttpException(
                { message: 'reset password failed', error: error.message },
                400
            );
        }
    }

    /**
     * Logs out a user.
     * @param token The JWT token of the user to be logged out
     * @returns An object containing a success message
     */
    @Post('logout')
    async logout(@Body('token') token: string): Promise<{message: string}> {
        try {
            const message = await this.authService.logout(token);
            return { message };
        } catch (error) {
            console.error('Logout failed:', error);
            throw new HttpException(
                { message: 'logout failed', error: error.message },
                400
            );
        }
    }
}
