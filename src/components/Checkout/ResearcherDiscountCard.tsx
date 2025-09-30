import React from 'react';

const ResearcherDiscountCard: React.FC = () => {
  return (
    <section className="card cardLg" role="region" aria-label="Researcher discount">
      <a
        href="https://www.traceaq.com/researcher-discount"
        target="_blank"
        rel="noopener noreferrer"
        className="rowTitle"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textDecoration: 'none',
          cursor: 'pointer'
        }}
      >
        <h3 className="sectionTitle" style={{ fontWeight: 600, fontSize: 16, margin: 0, color: '#4285F4', textAlign: 'left' }}>
          Apply for our exclusive researcher discount
        </h3>
        <i
          className="fa fa-chevron-right"
          aria-hidden="true"
          style={{ fontSize: 12, marginLeft: 8, color: 'grey' }}
        />
      </a>
    </section>
  );
};

export default ResearcherDiscountCard;
