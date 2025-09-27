const io = require('socket.io-client');

const socket = io('http://localhost:3002');

socket.on('connect', () => {
  console.log('✅ WebSocket接続成功: ', socket.id);

  // テストメッセージを送信
  socket.emit('chat:message', {
    text: 'WebSocketテストメッセージ',
    userId: 'test-user',
    timestamp: new Date().toISOString()
  });

  console.log('📤 テストメッセージ送信完了');

  // 接続を閉じる
  setTimeout(() => {
    socket.disconnect();
    console.log('🔌 WebSocket接続を切断しました');
    process.exit(0);
  }, 1000);
});

socket.on('chat:message', (message) => {
  console.log('📥 メッセージ受信:', message);
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket接続エラー:', error.message);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('🔌 WebSocket切断');
});