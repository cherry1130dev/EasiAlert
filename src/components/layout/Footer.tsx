import React, { useState } from 'react';
import { Phone, MessageCircle, Copy, Check, Wrench, Code } from 'lucide-react';

export const Footer: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const developers = [
    {
      name: 'Charan',
      phone: '7989604815',
      display: '79896 04815',
    },
    {
      name: 'Mouli',
      phone: '7731943179',
      display: '77319 43179',
    },
  ];

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(num);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <footer
      style={{
        marginTop: '28px',
        padding: '16px 12px 20px 12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(5, 8, 18, 0.5)',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Title & Help Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wrench size={14} color="#f59e0b" />
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
            EASITRONICS Developer Support
          </span>
        </div>
        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
          Report bugs or contact devs directly:
        </span>
      </div>

      {/* Developer Contact Chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
        {developers.map((dev) => (
          <div
            key={dev.phone}
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f1f5f9' }}>
                {dev.name}
              </div>
              <div style={{ fontSize: '0.70rem', color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>
                {dev.display}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <a
                href={`tel:${dev.phone}`}
                title={`Call ${dev.name}`}
                style={{
                  padding: '4px 6px',
                  borderRadius: 6,
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Phone size={11} />
              </a>

              <a
                href={`https://wa.me/91${dev.phone}?text=Hi%20${dev.name},%20regarding%20EasiAlert%20app...`}
                target="_blank"
                rel="noreferrer"
                title={`WhatsApp ${dev.name}`}
                style={{
                  padding: '4px 6px',
                  borderRadius: 6,
                  background: 'rgba(37, 211, 102, 0.15)',
                  color: '#25d366',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <MessageCircle size={11} />
              </a>

              <button
                onClick={() => handleCopy(dev.phone)}
                title="Copy Number"
                style={{
                  padding: '4px 6px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: copied === dev.phone ? '#22c55e' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {copied === dev.phone ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Signature & DEV646 Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.68rem',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Code size={12} color="#f59e0b" />
          <span>EASITRONICS • make projects easier</span>
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: '0.64rem',
            padding: '2px 6px',
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            letterSpacing: '0.04em',
          }}
        >
          DEVELOPED BY DEV646
        </div>
      </div>
    </footer>
  );
};
