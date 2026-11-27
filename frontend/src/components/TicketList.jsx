import React from 'react';
import { label, userLabel } from '../utils/tickets';
import LoadingIndicator from './LoadingIndicator';

export default function TicketList({ tickets, loading, error, pagination, page, hasFilters, onSelect, onPageChange }) {
  return <>
    <section className="ticket-list" aria-label="Tickets" aria-busy={loading}>
      {loading && <div className="empty"><LoadingIndicator>Loading tickets...</LoadingIndicator></div>}
      {!loading && tickets.map((ticket) => (
        <button className="ticket" key={ticket._id} onClick={() => onSelect(ticket._id)}>
          <div><span className={`badge ${ticket.status.toLowerCase()}`}>{label(ticket.status)}</span><h3>{ticket.title}</h3><p>{ticket.description}</p><small className="ticket-author">Created by: {userLabel(ticket.createdBy)}</small></div>
          <div className="ticket-meta"><span>{ticket.priority}</span><small>{ticket.category}</small></div>
        </button>
      ))}
      {!loading && !error && !tickets.length && <div className="empty">
        No tickets found. {hasFilters ? 'Try clearing your search or filters.' : 'Create your first ticket to get started.'}
      </div>}
    </section>
    {pagination && pagination.total > 0 && <div className="pagination">
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} tickets</span>
      <div>
        <button className="ghost" disabled={loading || page <= 1} onClick={() => onPageChange(-1)}>Previous</button>
        <button className="ghost" disabled={loading || page >= pagination.totalPages} onClick={() => onPageChange(1)}>Next</button>
      </div>
    </div>}
  </>;
}
