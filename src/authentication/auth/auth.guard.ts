/**
 * Guard that checks for a valid authentication token in the request headers.
 * Only allows requests with a valid, non-revoked token to proceed.
 */
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenEntity } from '../../database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * Injects the Token repository for token validation.
   */
  constructor(@Inject(getRepositoryToken(TokenEntity)) private readonly tokenRepo: Repository<TokenEntity>) {}

  /**
   * Checks if the request has a valid, non-revoked token.
   * @param context The execution context
   * @returns True if the token is valid, false otherwise
   */
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

    // Check if the token exists in the database and is not revoked
    const tokenEntity = await this.tokenRepo.findOne({
      where: { token, isRevoked: false },
    });
    if (!tokenEntity) {
      return false;
    }
    request.user = tokenEntity.user; // Attach user to request
    return true;
  }
}
