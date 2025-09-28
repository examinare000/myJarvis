import * as chrono from 'chrono-node';

export interface ParsedEvent {
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
}

export interface ParseResult {
  success: boolean;
  event?: ParsedEvent;
  error?: string;
  originalText: string;
}

/**
 * 日本語自然言語からカレンダーイベントを解析
 */
export function parseNaturalLanguageEvent(text: string, referenceDate = new Date()): ParseResult {
  if (!text.trim()) {
    return {
      success: false,
      error: 'テキストが入力されていません',
      originalText: text
    };
  }

  try {
    // chrono-nodeで日本語解析
    const results = chrono.ja.parse(text, referenceDate);

    if (results.length === 0) {
      return {
        success: false,
        error: '日時を認識できませんでした',
        originalText: text
      };
    }

    const chronoResult = results[0];

    // 開始時間の取得
    const startTime = chronoResult.start.date();

    // 終了時間の取得（明示的に指定されている場合）
    let endTime: Date;
    if (chronoResult.end) {
      endTime = chronoResult.end.date();
    } else {
      // 終了時間が指定されていない場合、1時間後をデフォルトとする
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    }

    // イベントタイトルの抽出
    const title = extractEventTitle(text, chronoResult);

    return {
      success: true,
      event: {
        title,
        startTime,
        endTime,
        description: `自然言語入力: "${text}"`
      },
      originalText: text
    };

  } catch (error) {
    return {
      success: false,
      error: `解析エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
      originalText: text
    };
  }
}

/**
 * テキストからイベントタイトルを抽出
 */
function extractEventTitle(text: string, chronoResult: any): string {
  // chronoで解析された日時部分を除去してタイトルを抽出
  const dateText = text.substring(chronoResult.index, chronoResult.index + chronoResult.text.length);

  // 日時表現を除去
  let title = text.replace(dateText, '').trim();

  // 前後の助詞を除去（より包括的なパターン）
  title = title.replace(/^(に|で|の|を|が|は|へ|と|から|まで)\s*/g, '');
  title = title.replace(/\s*(に|で|の|を|が|は|へ|と|から|まで)$/g, '');

  // 複数の日時表現がある場合の追加クリーンアップ
  title = title.replace(/(午前|午後|朝|夕方|夜|昼)\d{1,2}時(半|[0-5]\d分?)?/g, '');
  title = title.replace(/\d{1,2}時(半|[0-5]\d分?)?/g, '');
  title = title.replace(/(から|まで|〜|～)/g, '');

  // 余分なスペースを除去
  title = title.replace(/\s+/g, ' ').trim();

  // 空の場合はデフォルトタイトル
  if (!title) {
    title = 'イベント';
  }

  return title;
}

/**
 * 自然言語テキストの例
 */
export const NATURAL_LANGUAGE_EXAMPLES = [
  '明日の午後2時に会議',
  '来週の金曜日の10時から12時まで研修',
  '3月15日の朝9時に歯医者',
  '今度の日曜日に家族との食事',
  '来月の第2火曜日の午後3時に定期検診',
  '明後日の夕方5時にミーティング',
  '今週末の午前10時にヨガクラス',
  '12月25日の夜7時にクリスマスパーティー'
];

/**
 * 解析テスト用関数
 */
export function testNaturalLanguageParsing() {
  console.log('=== 自然言語解析テスト ===');

  NATURAL_LANGUAGE_EXAMPLES.forEach((text, index) => {
    const result = parseNaturalLanguageEvent(text);
    console.log(`\n${index + 1}. "${text}"`);

    if (result.success && result.event) {
      console.log(`   タイトル: ${result.event.title}`);
      console.log(`   開始時間: ${result.event.startTime.toLocaleString('ja-JP')}`);
      console.log(`   終了時間: ${result.event.endTime.toLocaleString('ja-JP')}`);
    } else {
      console.log(`   エラー: ${result.error}`);
    }
  });
}