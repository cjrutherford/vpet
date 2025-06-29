/**
 * Custom decorator to extract and parse the authenticated user from the JWT token in the request headers.
 *
 * Usage:
 *   @User() user: UserType
 */
import { createParamDecorator } from "@nestjs/common"

/**
 * Type representing the user payload extracted from the JWT token.
 */
export type UserType = { userId: string, email: string, iat: number, exp: number}

/**
 * User decorator for controller methods to inject the current user.
 */
const User = createParamDecorator(
    async (data: unknown, ctx) => {
        const request = ctx.switchToHttp().getRequest();
        // Extract the JWT token from the Authorization header
        const token = (request.headers['authorization'] ?? request.headers['Authorization']).split(' ')[1];

        if (!token) {
            throw new Error("No token provided");
        }

        // Parse the JWT token and attach the user payload to the request
        request.user = parseToken(token);

        return request.user;
    }
);

/**
 * Parses a JWT token and returns its payload as an object.
 * @param token The JWT token string
 * @returns The decoded payload object
 */
const parseToken = (token: string) => {
    // Assuming the token is a JWT token
    const payload = atob(token.split('.')[1]);
    return JSON.parse(payload);
};

export default User;