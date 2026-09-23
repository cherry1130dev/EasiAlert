import React, { useState } from 'react';
import { Phone, MessageCircle, Code2, Copy, Check, Wrench } from 'lucide-react';

export const DeveloperSupportCard: React.FC = () => {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const developers = [
    {
      name: 'Charan',
      phone: '7989604815',
      formattedPhone: '+91 79896 04815',
      role: 'Lead Hardware & IoT Developer',
    },
    {
      name: 'Mouli',
      phone: '7731943179',
      formattedPhone: '+91 77319 43179',
      role: 'Systems & App Architect',
    },
  ];

  const handleCopy = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedNumber(phone);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '18px 16px',
        borderRadius: 16,
        border: '1px solid rgba(245, 158, 11, 0.35)',
        background: 'linear-gradient(180deg, rgba(24, 30, 52, 0.9) 0%, rgba(13, 18, 32, 0.95) 100%)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}
          >
            <Wrench size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
              EASITRONICS Support
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                24/7 DEV HELP
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              If any bug or hardware issue, contact developers directly
            </div>
          </div>
        </div>
      </div>

      {/* Developers List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {developers.map((dev, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f1f5f9' }}>
                {dev.name}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>
                {dev.formattedPhone}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                {dev.role}
              </div>
            </div>

            {/* Quick Actions: Call & WhatsApp & Copy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <a
                href={`tel:${dev.phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  textDecoration: 'none',
                }}
              >
                <Phone size={13} /> Call
              </a>

              <a
                href={`https://wa.me/91${dev.phone}?text=Hi%20${dev.name},%20I%20am%20using%20the%20EasiAlert%20app%20and%20need%20assistance...`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(37, 211, 102, 0.15)',
                  color: '#25d366',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  textDecoration: 'none',
                }}
              >
                <MessageCircle size={13} /> WhatsApp
              </a>

              <button
                onClick={() => handleCopy(dev.phone)}
                title="Copy phone number"
                style={{
                  padding: '6px 8px',
                  borderRadius: 8,
                  fontSize: '0.72rem',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: copiedNumber === dev.phone ? '#22c55e' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {copiedNumber === dev.phone ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dev Tag / Signature */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.72rem',
          color: '#94a3b8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Code2 size={14} color="#f59e0b" />
          <span>EASITRONICS • make projects easier</span>
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: '0.70rem',
            padding: '2px 8px',
            borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            letterSpacing: '0.04em',
          }}
        >
          DEVELOPED BY DEV646
        </div>
      </div>
    </div>
  );
};
