import React, { Suspense } from 'react';
import { UnsubscribeContent } from './UnsubscribeContent';

export const metadata = {
  title: 'Unsubscribe Confirmation | TaskNera Solutions',
  description: 'Manage your email preferences and unsubscribe from future communications.'
};

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-600">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
