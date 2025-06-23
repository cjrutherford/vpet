import { Module } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { UserEntity, SaltEntity, TokenEntity } from 'src/database/entities';
import { DataSource } from 'typeorm';
import { AuthService } from './auth/auth.service';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationController } from './authentication.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),
        DatabaseModule.register(
            {
                name: 'AUTHENTICATION',
                factory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST'),
                    port: config.get('DB_PORT'),
                    username: config.get('DB_USERNAME'),
                    password: config.get('DB_PASSWORD'),
                    database: config.get('DB_NAME'),
                    entities: [UserEntity, TokenEntity, SaltEntity],
                    synchronize: true,
                }),
            }
        )
    ],
    controllers: [AuthenticationController],
    providers: [ 
        AuthService,
        {
            provide: getRepositoryToken(UserEntity),
            useFactory: (dataSource: DataSource) => dataSource.getRepository(UserEntity),
            inject: ['AUTHENTICATION_CONNECTION'],
        },{
            provide: getRepositoryToken(TokenEntity),
            useFactory: (dataSource: DataSource) => dataSource.getRepository(TokenEntity),
            inject: ['AUTHENTICATION_CONNECTION'],
        },{
            provide: getRepositoryToken(SaltEntity),
            useFactory: (dataSource: DataSource) => dataSource.getRepository(SaltEntity),
            inject: ['AUTHENTICATION_CONNECTION'],
        }
    ],
})
export class AuthenticationModule {}
