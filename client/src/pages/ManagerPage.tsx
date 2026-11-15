import React from 'react';
import { Header } from '../components/Header.js';
import { ProgramBuilder } from '../components/ProgramBuilder.js';

export const ManagerPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--powder-blush)' }}>
      <Header />
      <main style={{ maxWidth: '1200px', margin: '1.5rem auto', padding: '0 1rem' }}>
        <ProgramBuilder />
      </main>
    </div>
  );
};
