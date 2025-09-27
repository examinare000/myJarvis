import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../App';

// 簡易的なストアモック
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: false, user: null }) => state,
      tasks: (state = { items: [], loading: false }) => state,
      schedules: (state = { items: [], loading: false }) => state,
    },
  });
};

describe('App Component', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
  });

  it('should render without crashing', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );

    // このテストは最初は失敗する可能性がある（Red段階）
    expect(document.querySelector('#root')).toBeInTheDocument();
  });

  it('should display the application title', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );

    // アプリケーションのタイトルが表示されることを確認
    expect(screen.getByText(/myJarvis/i)).toBeInTheDocument();
  });

  it('should have a navigation menu', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );

    // ナビゲーションメニューの存在を確認
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should render login form when not authenticated', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );

    // 未認証時はログインフォームが表示される
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});