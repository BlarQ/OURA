'use client';

import React, { useState } from 'react';
import { TodayDashboard } from '@/components/dashboard/TodayDashboard';
import { QuickCreateModal } from '@/components/layout/QuickCreateModal';

export default function TodayPage() {
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  return (
    <>
      <TodayDashboard
        onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
        onOpenTimer={() => {
          window.location.href = '/activities';
        }}
      />

      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSelectOption={(type) => {
          switch (type) {
            case 'TASK': window.location.href = '/tasks'; break;
            case 'ACTIVITY': window.location.href = '/activities'; break;
            case 'EXPENSE': window.location.href = '/money/expenses'; break;
            case 'INCOME': window.location.href = '/money/income'; break;
            case 'PLAN': window.location.href = '/plans'; break;
          }
        }}
      />
    </>
  );
}
