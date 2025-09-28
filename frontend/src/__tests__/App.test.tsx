import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
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
        <App />
      </Provider>
    );

    // アプリケーションが正常にレンダリングされることを確認
    expect(screen.getByText('myJarvis')).toBeInTheDocument();
  });

  it('should display the application title', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // アプリケーションのタイトルが表示されることを確認
    expect(screen.getByText(/myJarvis/i)).toBeInTheDocument();
  });

  it('should have a navigation menu', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // ナビゲーションリンクの存在を確認
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /chat/i })).toBeInTheDocument();
  });

  it('should render login form when not authenticated', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // Loginページへのリンクが存在することを確認
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });
});