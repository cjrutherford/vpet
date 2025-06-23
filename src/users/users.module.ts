import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
import { UserProfileEntity } from '../database/entities';
import { AssetModule } from 'src/asset/asset.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    AssetModule,
    DatabaseModule.register({
      name: 'USERS',
      factory: (config) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [UserProfileEntity],
        synchronize: true,
      }),
    }),
  ],
  providers: [
        UsersService,
        {
            provide: getRepositoryToken(UserProfileEntity),
            useFactory: (dataSource: DataSource) => dataSource.getRepository(UserProfileEntity),
            inject: ['USERS_CONNECTION'],
        }
    ],
  controllers: [UsersController],
})
export class UsersModule {}
