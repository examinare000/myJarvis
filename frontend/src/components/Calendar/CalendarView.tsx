import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Paper, useTheme } from '@mui/material';
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';

interface CalendarViewProps {
  events?: EventInput[];
  onDateSelect?: (selectInfo: DateSelectArg) => void;
  onEventClick?: (clickInfo: EventClickArg) => void;
  onEventDrop?: (info: any) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events = [],
  onDateSelect,
  onEventClick,
  onEventDrop,
}) => {
  const theme = useTheme();
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    // カレンダーのリサイズ対応
    const handleResize = () => {
      if (calendarRef.current) {
        calendarRef.current.getApi().updateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        selectable={true}
        selectMirror={true}
        editable={true}
        droppable={true}
        dayMaxEvents={true}
        weekends={true}
        height="auto"

        // イベントハンドラー
        select={onDateSelect}
        eventClick={onEventClick}
        eventDrop={onEventDrop}

        // 日本語ローカライゼーション
        locale="ja"
        firstDay={1} // 月曜日始まり

        // Material-UIテーマとの統合
        themeSystem="standard"

        // カスタムスタイル
        eventDisplay="block"
        eventBackgroundColor={theme.palette.primary.main}
        eventBorderColor={theme.palette.primary.dark}
        eventTextColor={theme.palette.primary.contrastText}

        // 日本語の時間表示
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          hour12: false
        }}

        // イベントの時間表示フォーマット
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          hour12: false
        }}
      />
    </Paper>
  );
};

export default CalendarView;