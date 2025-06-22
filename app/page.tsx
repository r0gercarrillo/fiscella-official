'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import AddBudgetModal from '@/components/AddBudgetModal';
import { Budget } from '@/types/index';

export default function HomePage() {
  const { user, loading: authLoading, dbUser } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchBudgets = useCallback(() => {
    if (!user) return;
    setLoadingBudgets(true);
    const q = query(collection(db, 'budgets'), where('members', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const budgetsData: Budget[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        budgetsData.push({ id: doc.id, ...doc.data() } as Budget);
      });
      setBudgets(budgetsData);
      setLoadingBudgets(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = fetchBudgets();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  }, [fetchBudgets]);

  const handleBudgetAdded = () => {
    fetchBudgets(); 
  };
  
  if (authLoading || loadingBudgets) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white rounded-md bg-primary-600 hover:bg-primary-700"
              >
                Add Budget
              </button>
              <button
                onClick={() => auth.signOut()}
                className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-md hover:bg-danger-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold">Welcome, {dbUser?.displayName || user.email}!</h2>
              <p className="mt-2 text-gray-600">
                Here are your budgets.
              </p>
            </div>
            
            <div className="mt-6">
              {budgets.length > 0 ? (
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {budgets.map((budget) => (
                    <li key={budget.id} className="p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-lg">
                      <h3 className="text-lg font-semibold">{budget.name}</h3>
                      <p className="text-gray-600">Amount: ${budget.amount.toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 mt-6 text-center bg-white rounded-lg shadow">
                  <p>No budgets found. Add one to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <AddBudgetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onBudgetAdded={handleBudgetAdded}
      />
    </div>
  );
}
