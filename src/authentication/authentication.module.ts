/**
 * Module for authentication features, including controllers, services, and guards.
 */
import { AuthGuard } from './auth/auth.guard';
import { AuthService } from './auth/auth.service';
import { AuthenticationController } from './authentication.controller';
import { InternalConfigModule } from 'src/internal-config/internal-config.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        InternalConfigModule,
    ],
    controllers: [AuthenticationController],
    providers: [ 
        AuthService,
        AuthGuard
    ],
    exports: [
        AuthGuard
    ]
})
export class AuthenticationModule {}
