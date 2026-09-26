import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase.js';

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function BookingForm({ match }) {
  const [name, setName] = useState('');
  const [seats, setSeats] = useState('1');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  async function submitBooking(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setFailed(false);

    const { error: insertError } = await supabase.from('bookings').insert({
      match_id: match.id,
      customer_name: name.trim(),
      seats: Number(seats),
    });

    setSaving(false);
    if (insertError) {
      setFailed(true);
      setMessage(insertError.message.includes('row-level security')
        ? 'Bookings are not enabled yet. Ask the project owner to add the bookings insert policy.'
        : insertError.message);
      return;
    }

    setMessage('Booking saved. See you at the match!');
    setName('');
    setSeats('1');
  }

  return (
    <form className="booking-form" onSubmit={submitBooking}>
      <p className="form-title">Reserve seats</p>
      <label>
        Your name
        <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} placeholder="Enter your name" />
      </label>
      <div className="form-bottom">
        <label>
          Seats
          <input type="number" min="1" max="12" value={seats} onChange={(event) => setSeats(event.target.value)} required />
        </label>
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Book seats'}</button>
      </div>
      {message && <p className={`booking-message${failed ? ' booking-error' : ''}`} role="status">{message}</p>}
    </form>
  );
}

export default function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadMatches() {
      const { data, error: queryError } = await supabase
        .from('matches')
        .select('id, home_team, away_team, starts_at, venue, status')
        .order('starts_at', { ascending: true });

      if (!active) return;
      if (queryError) setError(queryError.message);
      else setMatches(data ?? []);
      setLoading(false);
    }

    loadMatches();

    const channel = supabase
      .channel('matches-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, loadMatches)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Matchday home">
          <span className="brand-mark">M</span>
          <span>matchday</span>
        </a>
        <span className="live-label"><i /> Supabase connected</span>
      </header>

      <section className="intro">
        <p className="eyebrow">THE FIXTURES</p>
        <h1>Every match,<br /><em>one place.</em></h1>
        <p className="intro-copy">Upcoming games, straight from your Supabase database.</p>
      </section>

      <section className="match-section" aria-labelledby="matches-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">UP NEXT</p>
            <h2 id="matches-heading">Matches</h2>
          </div>
          <span className="count-pill">{matches.length} {matches.length === 1 ? 'match' : 'matches'}</span>
        </div>

        {loading ? (
          <div className="message-card">Loading matches…</div>
        ) : error ? (
          <div className="message-card error-card">
            <strong>Couldn’t load matches</strong>
            <p>{error}</p>
            <small>Check that the matches read policy is saved in Supabase.</small>
          </div>
        ) : matches.length === 0 ? (
          <div className="message-card">No matches yet. Add a row to the <code>matches</code> table in Supabase.</div>
        ) : (
          <div className="match-list">
            {matches.map((match) => (
              <article className="match-card" key={match.id}>
                <div className="match-meta">
                  <span className="status"><i /> {(match.status || 'scheduled').replaceAll('_', ' ')}</span>
                  <span className="match-id">MATCH {String(match.id).padStart(3, '0')}</span>
                </div>
                <div className="teams">
                  <h3>{match.home_team}</h3>
                  <span className="versus">VS</span>
                  <h3>{match.away_team}</h3>
                </div>
                <div className="match-footer">
                  <span>{formatDate(match.starts_at)}</span>
                  {match.venue && <span>{match.venue}</span>}
                </div>
                <BookingForm match={match} />
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>Fixtures update from your Supabase database.</footer>
    </main>
  );
}
