import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export default class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column()
    password: string;
}

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    password: string;
}

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    password: string;

    @ApiProperty({ example: 'password123', description: 'Password confirmation' })
    confirmPassword: string;
}

export class ResetUserPasswordDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    email: string;

    @ApiProperty({ example: 'oldPassword123', description: 'Current password' })
    oldPassword: string;

    @ApiProperty({ example: 'newPassword123', description: 'New password' })
    newPassword: string;

    @ApiProperty({ example: 'newPassword123', description: 'New password confirmation' })
    confirmNewPassword: string;
}

export class UserDto {
    @ApiProperty({ example: 'a3f1c2d4-5678-1234-9abc-1234567890ab', description: 'User unique identifier' })
    id: string;

    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    email: string;
}