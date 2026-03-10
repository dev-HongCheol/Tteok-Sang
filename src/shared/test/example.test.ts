// pnpm test run src/shared/test/example.test.ts
/**
 * 초기 설정 확인을 위한 샘플 테스트 모듈입니다.
 */
import { describe, expect, it } from 'vitest';

describe('Initial Setup Test', () => {
  it('should pass this sample test', () => {
    expect(1 + 1).toBe(2);
  });
});
