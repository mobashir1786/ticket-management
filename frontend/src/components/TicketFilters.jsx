import React from 'react';
import { PRIORITIES, STATUSES, label } from '../utils/tickets';

export default function TicketFilters({ search, setSearch, filters, changeFilters }) {
  return (
    <form className="filters" onSubmit={(event) => { event.preventDefault(); changeFilters({ search: search.trim() }); }}>
      <input aria-label="Search tickets" placeholder="Search tickets..." value={search} maxLength="100" onChange={(event) => setSearch(event.target.value)} />
      <select aria-label="Filter by status" value={filters.status} onChange={(event) => changeFilters({ status: event.target.value })}>
        <option value="">All statuses</option>{STATUSES.map((x) => <option key={x} value={x}>{label(x)}</option>)}
      </select>
      <select aria-label="Filter by priority" value={filters.priority} onChange={(event) => changeFilters({ priority: event.target.value })}>
        <option value="">All priorities</option>{PRIORITIES.map((x) => <option key={x} value={x}>{label(x)}</option>)}
      </select>
      <select aria-label="Sort tickets" value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(event) => {
        const [sortBy, sortOrder] = event.target.value.split(':');
        changeFilters({ sortBy, sortOrder });
      }}>
        <option value="createdAt:desc">Newest first</option>
        <option value="createdAt:asc">Oldest first</option>
        <option value="updatedAt:desc">Recently updated</option>
      </select>
      <button type="submit">Search</button>
    </form>
  );
}
