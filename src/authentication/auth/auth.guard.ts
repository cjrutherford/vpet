import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenEntity } from '../../database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(getRepositoryToken(TokenEntity)) private readonly tokenRepo: Repository<TokenEntity>) {}
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    const token = authHeader.slice(7);

    if (!token) {
      return false;
    }

    // Check if the token exists in the database
    const tokenEntity = await this.tokenRepo.findOne({
      where: { token, isRevoked: false },
    });
    if (!tokenEntity) {
      return false;
    }
    return true;
  }
}
