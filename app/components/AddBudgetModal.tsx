'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBudgetAdded: () => void;
}

interface FormData {
  name: string;
  amount: number;
}

export default function AddBudgetModal({ isOpen, onClose, onBudgetAdded }: AddBudgetModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setError("You must be logged in to create a budget.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'budgets'), {
        name: data.name,
        amount: Number(data.amount),
        createdBy: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      reset();
      onBudgetAdded();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-900">Add New Budget</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Budget Name
            </label>
            <input
              id="name"
              type="text"
              {...register('name', { required: 'Budget name is required' })}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Budget Amount
            </label>
            <input
              id="amount"
              type="number"
              {...register('amount', { required: 'Budget amount is required', valueAsNumber: true, min: { value: 0.01, message: 'Amount must be greater than 0' } })}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end pt-4 space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white rounded-md bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300"
            >
              {loading ? 'Adding...' : 'Add Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 