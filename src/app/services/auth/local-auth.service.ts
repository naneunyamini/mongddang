import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { AuthResponse } from 'src/app/models/auth/auth-reponse.interface';
import { SignInRequestData } from 'src/app/models/auth/auth-signin-request-data.interface';
import { SignUpRequestData } from 'src/app/models/auth/auth-signup-request-data.interface';
import type { User } from './auth.service';

interface LocalUser extends User {
  role: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocalAuthService {
  private readonly usersKey = 'mongddang:demo:users';
  private readonly sessionKey = 'mongddang:demo:session';

  signUp(data: SignUpRequestData): Observable<AuthResponse> {
    return from(this.createUser(data));
  }

  login(data: SignInRequestData): Observable<AuthResponse> {
    return from(this.authenticate(data));
  }

  getSessionUser(): User | null {
    const session = localStorage.getItem(this.sessionKey);

    if (!session) {
      return null;
    }

    try {
      return JSON.parse(session) as User;
    } catch {
      localStorage.removeItem(this.sessionKey);
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.sessionKey);
  }

  private async createUser(data: SignUpRequestData): Promise<AuthResponse> {
    const users = this.getUsers();
    const email = data.email.trim().toLowerCase();

    if (!email || !data.password || !data.username.trim()) {
      return this.createFailureResponse(400, '회원가입 정보를 모두 입력해주세요.');
    }

    if (users.some((user) => user.email === email)) {
      return this.createFailureResponse(409, '이미 가입된 이메일입니다.');
    }

    const now = new Date().toISOString();
    const passwordSalt = this.createSalt();
    const passwordHash = await this.hashPassword(data.password, passwordSalt);
    const nextId = users.reduce(
      (largestId, user) => Math.max(largestId, Number(user.id) || 0),
      0,
    ) + 1;

    const user: LocalUser = {
      id: String(nextId),
      role: 'USER',
      username: data.username.trim(),
      email,
      passwordHash,
      passwordSalt,
      createdAt: now,
      updatedAt: now,
    };

    users.push(user);
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    return this.createSuccessResponse(user, 201, '회원가입이 완료되었습니다.');
  }

  private async authenticate(data: SignInRequestData): Promise<AuthResponse> {
    const email = data.email.trim().toLowerCase();
    const user = this.getUsers().find((item) => item.email === email);

    if (!user) {
      return this.createFailureResponse(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const passwordHash = await this.hashPassword(data.password, user.passwordSalt);

    if (passwordHash !== user.passwordHash) {
      return this.createFailureResponse(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const sessionUser: User = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(sessionUser));

    return this.createSuccessResponse(user, 200, '로그인되었습니다.');
  }

  private getUsers(): LocalUser[] {
    const storedUsers = localStorage.getItem(this.usersKey);

    if (!storedUsers) {
      return [];
    }

    try {
      return JSON.parse(storedUsers) as LocalUser[];
    } catch {
      localStorage.removeItem(this.usersKey);
      return [];
    }
  }

  private createSuccessResponse(
    user: LocalUser,
    statusCode: number,
    message: string,
  ): AuthResponse {
    return {
      user: user.username,
      userId: Number(user.id),
      success: true,
      statusCode,
      message,
      data: {
        user: {
          id: user.id,
          role: user.role,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token: this.createDemoToken(user),
      },
    };
  }

  private createFailureResponse(statusCode: number, message: string): AuthResponse {
    return {
      user: '',
      userId: 0,
      success: false,
      statusCode,
      message,
      data: null,
    };
  }

  private createSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return this.bytesToBase64(salt);
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: this.base64ToBytes(salt),
        iterations: 100_000,
      },
      passwordKey,
      256,
    );

    return this.bytesToBase64(new Uint8Array(derivedBits));
  }

  private createDemoToken(user: LocalUser): string {
    const header = this.encodeTokenPart({ alg: 'none', typ: 'JWT' });
    const payload = this.encodeTokenPart({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return `${header}.${payload}.demo`;
  }

  private encodeTokenPart(value: object): string {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    return this.bytesToBase64(bytes)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  private base64ToBytes(value: string): Uint8Array {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
}
