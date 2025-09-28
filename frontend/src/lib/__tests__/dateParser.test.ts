import { parseNaturalLanguageEvent, NATURAL_LANGUAGE_EXAMPLES } from '../dateParser';

describe('日本語自然言語日時解析', () => {
  // 基準日時を固定（2024年3月1日 金曜日 午前10時）
  const referenceDate = new Date('2024-03-01T10:00:00+09:00');

  describe('基本的な日時解析', () => {
    test('明日の午後2時に会議', () => {
      const result = parseNaturalLanguageEvent('明日の午後2時に会議', referenceDate);

      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();

      if (result.event) {
        expect(result.event.title).toContain('会議');
        expect(result.event.startTime.getHours()).toBe(14);
        expect(result.event.startTime.getDate()).toBe(2); // 翌日
        expect(result.event.endTime.getTime() - result.event.startTime.getTime())
          .toBe(60 * 60 * 1000); // 1時間後
      }
    });

    test('来週の金曜日の10時から12時まで研修', () => {
      const result = parseNaturalLanguageEvent('来週の金曜日の10時から12時まで研修', referenceDate);

      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();

      if (result.event) {
        expect(result.event.title).toContain('研修');
        expect(result.event.startTime.getHours()).toBe(10);
        expect(result.event.endTime.getHours()).toBe(12);
        expect(result.event.startTime.getDay()).toBe(5); // 金曜日
      }
    });

    test('3月15日の朝9時に歯医者', () => {
      const result = parseNaturalLanguageEvent('3月15日の朝9時に歯医者', referenceDate);

      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();

      if (result.event) {
        expect(result.event.title).toContain('歯医者');
        expect(result.event.startTime.getHours()).toBe(9);
        expect(result.event.startTime.getMonth()).toBe(2); // 3月（0ベース）
        expect(result.event.startTime.getDate()).toBe(15);
      }
    });
  });

  describe('時間表現のバリエーション', () => {
    test('午前9時', () => {
      const result = parseNaturalLanguageEvent('明日の午前9時にミーティング', referenceDate);

      expect(result.success).toBe(true);
      if (result.event) {
        expect(result.event.startTime.getHours()).toBe(9);
      }
    });

    test('夕方5時', () => {
      const result = parseNaturalLanguageEvent('明日の夕方5時にディナー', referenceDate);

      expect(result.success).toBe(true);
      if (result.event) {
        expect(result.event.startTime.getHours()).toBe(17);
      }
    });

    test('朝8時半', () => {
      const result = parseNaturalLanguageEvent('明日の朝8時半に出発', referenceDate);

      expect(result.success).toBe(true);
      if (result.event) {
        expect(result.event.startTime.getHours()).toBe(8);
        expect(result.event.startTime.getMinutes()).toBe(30);
      }
    });
  });

  describe('相対日付表現', () => {
    test('明後日', () => {
      const result = parseNaturalLanguageEvent('明後日の午後3時に面接', referenceDate);

      expect(result.success).toBe(true);
      if (result.event) {
        expect(result.event.startTime.getDate()).toBe(3); // 2日後
        expect(result.event.title).toBe('面接');
      }
    });

    test('来月', () => {
      const result = parseNaturalLanguageEvent('来月の1日に月次会議', referenceDate);

      expect(result.success).toBe(true);
      if (result.event) {
        expect(result.event.startTime.getMonth()).toBe(3); // 4月（0ベース）
        expect(result.event.startTime.getDate()).toBe(1);
        expect(result.event.title).toBe('月次会議');
      }
    });

    test('今度の日曜日', () => {
      const result = parseNaturalLanguageEvent('今度の日曜日に家族との食事', referenceDate);

      expect(result.success).toBe(true);
      if (result.event) {
        expect(result.event.startTime.getDay()).toBe(0); // 日曜日
        expect(result.event.title).toBe('家族との食事');
      }
    });
  });

  describe('エラーハンドリング', () => {
    test('空文字列', () => {
      const result = parseNaturalLanguageEvent('', referenceDate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('テキストが入力されていません');
    });

    test('日時を含まないテキスト', () => {
      const result = parseNaturalLanguageEvent('ただの文章です', referenceDate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('日時を認識できませんでした');
    });

    test('スペースのみ', () => {
      const result = parseNaturalLanguageEvent('   ', referenceDate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('テキストが入力されていません');
    });
  });

  describe('タイトル抽出', () => {
    test('助詞の除去', () => {
      const testCases = [
        { input: '明日の午後2時に会議', expected: '会議' },
        { input: '会議を明日の午後2時に', expected: '会議' },
        { input: '明日の午後2時で打ち合わせ', expected: '打ち合わせ' },
        { input: '歯医者の予約が明日の朝9時', expected: '歯医者の予約' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseNaturalLanguageEvent(input, referenceDate);
        expect(result.success).toBe(true);
        if (result.event) {
          expect(result.event.title).toBe(expected);
        }
      });
    });

    test('デフォルトタイトル', () => {
      const result = parseNaturalLanguageEvent('明日の午後2時', referenceDate);

      expect(result.success).toBe(true);
      if (result.event) {
        expect(result.event.title).toBe('イベント');
      }
    });
  });

  describe('例文の全件テスト', () => {
    test('全ての例文が正常に解析される', () => {
      NATURAL_LANGUAGE_EXAMPLES.forEach((example, index) => {
        const result = parseNaturalLanguageEvent(example, referenceDate);

        expect(result.success).toBe(true);
        expect(result.event).toBeDefined();
        expect(result.event?.title).toBeTruthy();
        expect(result.event?.startTime).toBeInstanceOf(Date);
        expect(result.event?.endTime).toBeInstanceOf(Date);

        // 終了時間は開始時間より後である必要がある
        if (result.event) {
          expect(result.event.endTime.getTime())
            .toBeGreaterThan(result.event.startTime.getTime());
        }
      });
    });
  });

  describe('日時の妥当性チェック', () => {
    test('開始時間と終了時間の関係', () => {
      const result = parseNaturalLanguageEvent('明日の10時から12時まで会議', referenceDate);

      expect(result.success).toBe(true);
      if (result.event) {
        expect(result.event.startTime.getHours()).toBe(10);
        expect(result.event.endTime.getHours()).toBe(12);
        expect(result.event.endTime.getTime() - result.event.startTime.getTime())
          .toBe(2 * 60 * 60 * 1000); // 2時間
      }
    });

    test('終了時間が指定されない場合のデフォルト（1時間後）', () => {
      const result = parseNaturalLanguageEvent('明日の午後3時に面談', referenceDate);

      expect(result.success).toBe(true);
      if (result.event) {
        expect(result.event.endTime.getTime() - result.event.startTime.getTime())
          .toBe(60 * 60 * 1000); // 1時間
      }
    });
  });
});