import React from 'react';
import 'font-awesome/css/font-awesome.min.css';

const ResearcherDiscountCard: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <section className={`card cardLg${open ? ' is-open' : ''}`} role="region" aria-label="Researcher discount">
      <button
        type="button"
        className="rowTitle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <h3 className="sectionTitle" style={{ fontWeight: 600, fontSize: 18, margin: 0, color: '#4285F4', textAlign: 'left' }}>
          Apply for our exclusive researcher discount
        </h3>
        <i className="fa fa-chevron-down" aria-hidden="true" style={{ fontSize: 14, marginLeft: 8, color: 'grey' }} />
      </button>

      {open && (
        <div className="collapsible" aria-hidden={!open}>
          <div style={{ marginTop: 18 }}>
            <button
              className="btn"
              type="button"
              aria-label="Apply for researcher discount"
              onClick={() => {
                window.open('https://www.traceaq.com/researcher-discount', '_blank', 'noopener,noreferrer');
              }}

              style={{
                display: 'inline-block',
                textAlign: 'center',
                background: '#000D94',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                width: '50%',
                fontSize: 16,
                fontWeight: 600
              }}
            >
              Apply Now
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ResearcherDiscountCard;
