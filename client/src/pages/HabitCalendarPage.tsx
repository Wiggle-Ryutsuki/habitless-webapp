import React from 'react';
import { Header } from '../components/Header.js';
import { TodayChecklist } from '../components/TodayChecklist.js';

export const HabitCalendarPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--powder-blush)' }}>
      <Header />
      <main>
        <TodayChecklist />
      </main>
    </div>
  );
};

