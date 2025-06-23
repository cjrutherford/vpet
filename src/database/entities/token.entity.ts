import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class TokenEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;
    
    @Column()
    token: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    expiresAt: Date | null;

    @Column({ type: 'boolean', default: false })
    isRevoked: boolean;

}

// CreateTokenDto
export class CreateTokenDto {
    token: string;
    expiresAt?: Date | null;
}

// UpdateTokenDto
export class UpdateTokenDto {
    token?: string;
    expiresAt?: Date | null;
    isRevoked?: boolean;
}

// TokenResponseDto
export class TokenResponseDto {
    id: string;
    token: string;
    createdAt: Date;
    expiresAt: Date | null;
    isRevoked: boolean;
}