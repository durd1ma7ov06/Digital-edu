import React from 'react';
import { useI18nStore } from '../store/useI18nStore';

const labels = {
  uz: {
    pending: "Kutilmoqda",
    approved: "Tasdiqlangan",
    rejected: "Rad etilgan",
  },
  ru: {
    pending: "Ожидает",
    approved: "Одобрено",
    rejected: "Отклонено",
  },
  en: {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  },
}

interface RoleRequestStatusProps {
  status: 'pending' | 'approved' | 'rejected';
}

const statusClasses = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

export const RoleRequestStatus: React.FC<RoleRequestStatusProps> = ({ status }) => {
  const { language } = useI18nStore();
  const L = labels[language];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusClasses[status]}`}
    >
      {L[status]}
    </span>
  );
};

export default RoleRequestStatus;
