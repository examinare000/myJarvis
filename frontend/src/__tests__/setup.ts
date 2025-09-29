import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// テスト後のクリーンアップ
afterEach(() => {
  cleanup();
});

// グローバルなfetchのモック
globalThis.fetch = vi.fn<typeof fetch>();

// LocalStorageのモック
const localStorageMock: Storage = {
  getItem: vi.fn<Storage['getItem']>(),
  setItem: vi.fn<Storage['setItem']>(),
  removeItem: vi.fn<Storage['removeItem']>(),
  clear: vi.fn<Storage['clear']>(),
  key: vi.fn<Storage['key']>(),
  length: 0,
};

globalThis.localStorage = localStorageMock;
