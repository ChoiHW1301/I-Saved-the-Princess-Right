import { randomUUID } from 'node:crypto';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { ZodError } from 'zod';
import { AuthError } from '../auth/errors.js';
import { StorageError } from '../data/repositorySupport.js';

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
    this.name = 'ApiError';
  }
}

export function correlationIdFor(request: HttpRequest): string {
  const incoming = request.headers.get('x-correlation-id');
  return incoming && /^[A-Za-z0-9._:-]{1,96}$/.test(incoming) ? incoming : randomUUID();
}

export function jsonError(error: unknown, request: HttpRequest): HttpResponseInit {
  const correlationId = correlationIdFor(request);
  let status = 500;
  let code = 'INTERNAL_ERROR';

  if (error instanceof AuthError) {
    status = error.status;
    code = error.code;
  } else if (error instanceof ApiError) {
    status = error.status;
    code = error.code;
  } else if (error instanceof StorageError) {
    status = error.code === 'STORAGE_UNAVAILABLE' ? 503 : 409;
    code = error.code;
  } else if (error instanceof ZodError || error instanceof SyntaxError) {
    status = 400;
    code = 'INVALID_REQUEST';
  }

  return {
    status,
    jsonBody: { code, message: messageFor(code), correlationId },
  };
}

export function messageFor(code: string): string {
  const messages: Record<string, string> = {
    UNAUTHENTICATED: '로그인이 필요합니다.',
    FORBIDDEN: '게임 이용 권한이 없습니다.',
    INVALID_REQUEST: '요청 형식이나 값이 올바르지 않습니다.',
    INVALID_UPGRADE: '구매할 수 없는 강화 항목입니다.',
    INSUFFICIENT_GOLD: '강화에 필요한 골드가 부족합니다.',
    PROFILE_CONFLICT: '프로필이 다른 요청에서 변경되었습니다. 새로고침 후 다시 시도하세요.',
    SAVE_CONFLICT: '저장 데이터가 다른 요청에서 변경되었습니다. 최신 저장을 불러오세요.',
    SAVE_NOT_FOUND: '저장된 진행 데이터가 없습니다.',
    SAVE_TOO_LARGE: '저장 데이터가 허용 크기를 초과했습니다.',
    SAVE_VERSION_UNSUPPORTED: '지원하지 않는 저장 데이터 버전입니다.',
    STORAGE_UNAVAILABLE: '저장 서비스에 일시적으로 연결할 수 없습니다.',
    RUN_ID_CONFLICT: '이미 사용된 판 ID에 다른 결과를 제출했습니다.',
    INVALID_RUN: '판 결과의 캐릭터 또는 진행 정보가 올바르지 않습니다.',
    INVALID_LEADERBOARD_FILTER: '랭킹 검색 조건이 올바르지 않습니다.',
    INTERNAL_ERROR: '요청을 처리하지 못했습니다.',
  };
  return messages[code] ?? messages.INTERNAL_ERROR!;
}

export async function readJson(request: HttpRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, 'INVALID_REQUEST');
  }
}
