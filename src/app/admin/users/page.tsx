'use client';

import { useAdminUsers } from './lib/useAdminUsers';
import UserSearchInput from './components/UserSearchInput';
import UserDetail from './components/UserDetail';

export default function AdminUsersPage() {
  const {
    query,
    setQuery,
    user,
    searching,
    searchError,
    search,
    toggleAdmin,
    creditWallet,
    transactions,
    txnsLoading,
    txnsLoadingMore,
    txnsHasMore,
    loadMoreTransactions
  } = useAdminUsers();

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Users</h1>
      <p className="mt-1 text-sm text-ink/60">Search for a user by email to view their details, fund their wallet, or review their transactions.</p>

      <div className="mt-5">
        <UserSearchInput value={query} onChange={setQuery} onSearch={search} searching={searching} />
      </div>

      {searchError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchError}</p>}

      {user && (
        <UserDetail
          user={user}
          onToggleAdmin={toggleAdmin}
          onCredit={creditWallet}
          transactions={transactions}
          txnsLoading={txnsLoading}
          txnsLoadingMore={txnsLoadingMore}
          txnsHasMore={txnsHasMore}
          onLoadMoreTransactions={loadMoreTransactions}
        />
      )}

      {!user && !searchError && !searching && (
        <p className="mt-6 rounded-2xl bg-white p-6 text-center text-sm text-ink/40 shadow-sm">
          Search for a user by email to get started.
        </p>
      )}
    </div>
  );
}
