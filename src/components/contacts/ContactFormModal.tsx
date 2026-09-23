import React, { useState, useEffect } from 'react';
import { X, Check, Phone, User, Tag, Star } from 'lucide-react';
import type { Contact, ContactRole } from '../../types/contact';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Omit<Contact, 'id'> | Contact) => void;
  editingContact: Contact | null;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingContact,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<ContactRole>('BOTH');
  const [isPriority, setIsPriority] = useState(false);
  const [relation, setRelation] = useState('Family');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingContact) {
      setName(editingContact.name);
      setPhone(editingContact.phone);
      setRole(editingContact.role);
      setIsPriority(editingContact.isPriority);
      setRelation(editingContact.relation || 'Family');
    } else {
      setName('');
      setPhone('');
      setRole('BOTH');
      setIsPriority(false);
      setRelation('Family');
    }
    setError('');
  }, [editingContact, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter contact name.');
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s-()]/g, '');
    if (!cleanPhone || !/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
      setError('Please enter a valid phone number (e.g. +15551234567).');
      return;
    }

    if (editingContact) {
      onSave({
        ...editingContact,
        name: name.trim(),
        phone: cleanPhone,
        role,
        isPriority,
        relation,
      });
    } else {
      onSave({
        name: name.trim(),
        phone: cleanPhone,
        role,
        isPriority,
        relation,
        enabled: true,
      });
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '24px',
          background: '#0d1424',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              fontSize: '0.8rem',
              marginBottom: 16,
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="form-input"
                style={{ paddingLeft: 36 }}
                autoFocus
              />
              <User size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Phone Number (with Country Code)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+15551234567"
                className="form-input"
                style={{ paddingLeft: 36 }}
              />
              <Phone size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
            </div>
          </div>

          {/* Relation Tag */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Relationship / Role
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 36 }}
              >
                <option value="Family">Family / Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Friend">Friend / Colleague</option>
                <option value="Doctor">Doctor / Caretaker</option>
                <option value="Security">Security / Police</option>
                <option value="Other">Other</option>
              </select>
              <Tag size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
            </div>
          </div>

          {/* Alert Action Role: SMS vs CALL vs BOTH */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Emergency Action For This Contact
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(['SMS', 'CALL', 'BOTH'] as ContactRole[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: role === r ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
                    background: role === r ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: role === r ? '#60a5fa' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {r === 'BOTH' ? 'SMS + CALL' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Star Checkbox */}
          <div
            onClick={() => setIsPriority(!isPriority)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: isPriority ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${isPriority ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            <Star size={18} fill={isPriority ? '#f59e0b' : 'none'} color={isPriority ? '#f59e0b' : '#64748b'} />
            <div style={{ fontSize: '0.82rem' }}>
              <div style={{ fontWeight: 600, color: isPriority ? '#fbbf24' : 'var(--text-primary)' }}>
                Mark as Priority Contact
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Targeted first for automated emergency phone call
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Check size={16} /> Save Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
