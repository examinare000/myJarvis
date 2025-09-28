import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DateSelectArg, EventClickArg } from '@fullcalendar/core';
import { Box } from '@mui/material';
import CalendarView from './CalendarView';
import NaturalLanguageInput from './NaturalLanguageInput';
import { apiClient } from '@lib/api';
import { useCalendarStore, CalendarEvent } from '@stores/useCalendarStore';

const CalendarContainer: React.FC = () => {
  const queryClient = useQueryClient();
  const { setEvents, addEvent, updateEvent, removeEvent, setSelectedEvent } = useCalendarStore();

  // カレンダーイベント取得
  const { data: events, isLoading, error } = useQuery<CalendarEvent[], Error>({
    queryKey: ['calendarEvents'],
    queryFn: apiClient.getCalendarEvents,
  });

  React.useEffect(() => {
    if (events) {
      setEvents(events);
    }
  }, [events, setEvents]);

  // イベント作成ミューテーション
  const createEventMutation = useMutation<CalendarEvent, Error, {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    color?: string;
  }>({
    mutationFn: async (data) => apiClient.createCalendarEvent(data) as Promise<CalendarEvent>,
    onSuccess: (newEvent) => {
      addEvent(newEvent);
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });

  // イベント更新ミューテーション
  const updateEventMutation = useMutation<CalendarEvent, Error, {
    eventId: string;
    updates: Partial<CalendarEvent>;
  }>({
    mutationFn: async ({ eventId, updates }) =>
      apiClient.updateCalendarEvent(eventId, updates) as Promise<CalendarEvent>,
    onSuccess: (updatedEvent) => {
      updateEvent(updatedEvent.id, updatedEvent);
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });

  // イベント削除ミューテーション
  const deleteEventMutation = useMutation<void, Error, string>({
    mutationFn: apiClient.deleteCalendarEvent,
    onSuccess: (_, eventId) => {
      removeEvent(eventId);
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });

  // 日付選択時（新しいイベント作成）
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = prompt('イベントのタイトルを入力してください:');
    if (title) {
      createEventMutation.mutate({
        title,
        startTime: selectInfo.startStr,
        endTime: selectInfo.endStr,
      });
    }
    selectInfo.view.calendar.unselect();
  };

  // イベントクリック時
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events?.find(e => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);

      const action = confirm(
        `イベント: ${clickInfo.event.title}\n削除しますか？（キャンセルで編集）`
      );

      if (action) {
        deleteEventMutation.mutate(event.id);
      } else {
        const newTitle = prompt('新しいタイトル:', event.title);
        if (newTitle && newTitle !== event.title) {
          updateEventMutation.mutate({
            eventId: event.id,
            updates: { title: newTitle }
          });
        }
      }
    }
  };

  // イベントドロップ時（時間変更）
  const handleEventDrop = (info: any) => {
    const eventId = info.event.id;
    updateEventMutation.mutate({
      eventId,
      updates: {
        startTime: info.event.startStr,
        endTime: info.event.endStr,
      }
    });
  };

  // 自然言語入力からのイベント作成
  const handleNaturalLanguageCreate = (eventData: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    color?: string;
  }) => {
    createEventMutation.mutate(eventData);
  };

  // FullCalendar用のイベント形式に変換
  const fullCalendarEvents = events?.map(event => ({
    id: event.id,
    title: event.title,
    start: event.startTime,
    end: event.endTime,
    backgroundColor: event.color || undefined,
  })) || [];

  if (isLoading) {
    return <div>カレンダーを読み込み中...</div>;
  }

  if (error) {
    return <div>カレンダーの読み込みに失敗しました: {error.message}</div>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <NaturalLanguageInput
        onEventCreate={handleNaturalLanguageCreate}
        disabled={createEventMutation.isPending}
      />
      <CalendarView
        events={fullCalendarEvents}
        onDateSelect={handleDateSelect}
        onEventClick={handleEventClick}
        onEventDrop={handleEventDrop}
      />
    </Box>
  );
};

export default CalendarContainer;