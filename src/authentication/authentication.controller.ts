import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth/auth.service';
import { CreateUserDto, LoginDto, ResetUserPasswordDto } from '../database/entities';

@ApiTags('Authentication')
@Controller('auth')
export class AuthenticationController {

    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<string> {
        return await this.authService.login(loginDto.email, loginDto.password);
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto): Promise<string> {
        return await this.authService.register(createUserDto.email, createUserDto.password, createUserDto.confirmPassword);
    }

    @Post('reset-password')
    async resetPassword(@Body() resetUserPasswordDto: ResetUserPasswordDto): Promise<string> {
        return await this.authService.resetPassword(
            resetUserPasswordDto.email,
            resetUserPasswordDto.oldPassword,
            resetUserPasswordDto.newPassword,
            resetUserPasswordDto.confirmNewPassword
        );
    }

    @Post('logout')
    async logout(@Body('token') token: string): Promise<string> {
        return await this.authService.logout(token);
    }
}
