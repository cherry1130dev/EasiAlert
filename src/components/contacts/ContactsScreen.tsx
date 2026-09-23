import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Star,
  Trash2,
  Edit3,
  Send,
  CheckCircle2,
  Smartphone,
  MapPin,
  ExternalLink,
  Copy,
  Loader2,
  Navigation as NavIcon,
  BookOpen,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Contact } from '../../types/contact';
import type { GeoLocationCoords } from '../../types/emergency';
import { ContactFormModal } from './ContactFormModal';
import { SmsService } from '../../services/smsService';
import { LocationService } from '../../services/locationService';
import { permissionService } from '../../services/permissionService';
import { CollapsibleCard } from '../common/CollapsibleCard';

export const ContactsScreen: React.FC = () => {
  const {
    contacts,
    addContact,
    updateContact,
    deleteContact,
    toggleContactEnabled,
    setPriorityContact,
    userName,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [testStatus, setTestStatus] = useState<{ id: string; msg: string } | null>(null);

  // Phonebook modal states
  const [isPhonebookModalOpen, setIsPhonebookModalOpen] = useState(false);
  const [phonebookList, setPhonebookList] = useState<Array<{ name: string; phone: string }>>([]);
  const [phonebookSearch, setPhonebookSearch] = useState('');
  const [isLoadingPhonebook, setIsLoadingPhonebook] = useState(false);

  // Live Location states
  const [isLocating, setIsLocating] = useState(false);
  const [locationResult, setLocationResult] = useState<{
    coords: GeoLocationCoords;
    mapsUrl: string;
    isSimulated: boolean;
    isLastKnown?: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Register native contact pick callback from Android
  useEffect(() => {
    window.onNativeContactPicked = (name: string, phone: string) => {
      if (phone) {
        addContact({
          name: name || 'Mobile Contact',
          phone: phone.replace(/\s+/g, ''),
          role: 'BOTH',
          relation: 'Phone Contact',
          enabled: true,
          isPriority: false,
        });
      }
    };

    return () => {
      delete window.onNativeContactPicked;
    };
  }, [addContact]);

  const handleFetchLocation = async () => {
    setIsLocating(true);
    await permissionService.requestLocationPermission();
    try {
      const result = await LocationService.getCurrentLocation();
      setLocationResult(result);
    } catch (err) {
      console.warn('Manual location fetch failed:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const handleCopyLink = () => {
    if (!locationResult?.mapsUrl) return;
    navigator.clipboard?.writeText(locationResult.mapsUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  // 1. Native Contact Picker (Launches phone's native contact chooser)
  const handlePickFromNativeContacts = async () => {
    await permissionService.requestContactsPermission();

    // Android Native Bridge
    if (typeof window !== 'undefined' && window.AndroidBridge?.pickContact) {
      window.AndroidBridge.pickContact();
      return;
    }

    // Web Contact Picker API (Chrome)
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const selected = await (navigator as unknown as { contacts: { select: (props: string[], options: { multiple: boolean }) => Promise<Array<{ name?: string[]; tel?: string[] }>> } }).contacts.select(props, { multiple: false });
        if (selected && selected.length > 0) {
          const c = selected[0];
          const name = (c.name && c.name[0]) || 'Mobile Contact';
          const tel = (c.tel && c.tel[0]) || '';
          if (tel) {
            addContact({
              name,
              phone: tel.replace(/\s+/g, ''),
              role: 'BOTH',
              relation: 'Phone Contact',
              enabled: true,
              isPriority: false,
            });
          }
          return;
        }
      } catch (err) {
        console.warn('Web contact picker error:', err);
      }
    }

    // Fallback: Open manual modal
    handleAdd();
  };

  // 2. Query Entire Device Phonebook
  const handleOpenPhonebook = async () => {
    setIsLoadingPhonebook(true);
    await permissionService.requestContactsPermission();

    if (typeof window !== 'undefined' && window.AndroidBridge?.getPhonebookContacts) {
      try {
        const json = window.AndroidBridge.getPhonebookContacts(250);
        const parsed = JSON.parse(json || '[]');
        if (parsed.length > 0) {
          setPhonebookList(parsed);
          setIsPhonebookModalOpen(true);
          setIsLoadingPhonebook(false);
          return;
        }
      } catch (e) {
        console.warn('Error reading phonebook contacts:', e);
      }
    }

    setIsLoadingPhonebook(false);
    // If phonebook couldn't be queried directly, trigger native picker
    handlePickFromNativeContacts();
  };

  const handleSelectPhonebookContact = (entry: { name: string; phone: string }) => {
    addContact({
      name: entry.name,
      phone: entry.phone.replace(/\s+/g, ''),
      role: 'BOTH',
      relation: 'Phonebook',
      enabled: true,
      isPriority: false,
    });
    setIsPhonebookModalOpen(false);
  };

  const handleSave = (contactData: Omit<Contact, 'id'> | Contact) => {
    if ('id' in contactData) {
      updateContact(contactData as Contact);
    } else {
      addContact(contactData);
    }
  };

  const handleTestSms = async (contact: Contact) => {
    setTestStatus({ id: contact.id, msg: 'Dispatching...' });
    const msg = `[EASITRONICS Safety Test] Hi ${contact.name}, this is an emergency verification alert from ${userName}. No actual distress.`;
    const res = await SmsService.sendSms(contact, msg);
    if (res.success) {
      setTestStatus({ id: contact.id, msg: 'SMS Sent / Opened!' });
      setTimeout(() => setTestStatus(null), 3500);
    } else {
      setTestStatus({ id: contact.id, msg: 'Failed!' });
      setTimeout(() => setTestStatus(null), 3500);
    }
  };

  // Filter phonebook
  const filteredPhonebook = phonebookList.filter((item) => {
    const q = phonebookSearch.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.phone.includes(q);
  });

  return (
    <div>
      {/* Location Features Section */}
      <CollapsibleCard
        title="Live Location & GPS Engine"
        subtitle="Current GPS coordinates & Google Maps link used in SOS"
        icon={<MapPin size={18} color="#60a5fa" />}
        defaultExpanded={true}
        style={{ marginBottom: 20 }}
        headerRight={
          <button
            onClick={handleFetchLocation}
            disabled={isLocating}
            className="btn btn-outline btn-sm"
            style={{
              borderColor: 'rgba(59, 130, 246, 0.4)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.70rem',
              padding: '4px 8px',
            }}
          >
            {isLocating ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Locating...
              </>
            ) : (
              <>
                <NavIcon size={12} /> Refresh
              </>
            )}
          </button>
        }
      >
        {locationResult ? (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 10,
              padding: '12px 14px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8' }}>
                {locationResult.coords.latitude.toFixed(6)}, {locationResult.coords.longitude.toFixed(6)}
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: locationResult.isLastKnown
                    ? 'rgba(245, 158, 11, 0.18)'
                    : locationResult.isSimulated
                    ? 'rgba(100, 116, 139, 0.2)'
                    : 'rgba(16, 185, 129, 0.15)',
                  color: locationResult.isLastKnown
                    ? '#fbbf24'
                    : locationResult.isSimulated
                    ? '#94a3b8'
                    : '#34d399',
                  border: `1px solid ${locationResult.isLastKnown ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
                  fontWeight: 700,
                }}
              >
                {locationResult.isLastKnown
                  ? 'Last Known Cached Location'
                  : locationResult.isSimulated
                  ? 'Default Baseline GPS'
                  : `Live GPS (±${locationResult.coords.accuracy?.toFixed(0) || 5}m)`}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <a
                href={locationResult.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{
                  textDecoration: 'none',
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.78rem',
                  padding: '6px 10px',
                }}
              >
                <ExternalLink size={13} /> Open in Google Maps
              </a>
              <button
                onClick={handleCopyLink}
                className="btn btn-outline btn-sm"
                style={{
                  fontSize: '0.78rem',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copiedLink ? <CheckCircle2 size={13} color="#34d399" /> : <Copy size={13} />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Tap <strong>Refresh</strong> to locate and cache GPS coordinates for emergency alerts.
          </div>
        )}
      </CollapsibleCard>

      {/* Emergency Contacts Directory */}
      <CollapsibleCard
        title="Emergency Contacts"
        subtitle="Recipients notified on emergency triggers"
        icon={<Users size={18} color="#f59e0b" />}
        badge={
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            {contacts.length} Active
          </span>
        }
        defaultExpanded={true}
      >
        {/* Quick Action Button Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <button
            onClick={handleOpenPhonebook}
            disabled={isLoadingPhonebook}
            className="btn btn-outline btn-sm"
            title="Browse all Phonebook Contacts"
            style={{ fontSize: '0.74rem', padding: '8px 4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
          >
            {isLoadingPhonebook ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />} Phonebook
          </button>
          <button
            onClick={handlePickFromNativeContacts}
            className="btn btn-outline btn-sm"
            title="Pick a Contact from Phone"
            style={{ fontSize: '0.74rem', padding: '8px 4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
          >
            <Smartphone size={13} /> Pick
          </button>
          <button
            onClick={handleAdd}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.74rem', padding: '8px 4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
          >
            <UserPlus size={13} /> Add
          </button>
        </div>

        {/* Contacts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="glass-panel"
            style={{
              padding: '14px 16px',
              borderLeft: contact.isPriority ? '4px solid #f59e0b' : '1px solid var(--border-subtle)',
              opacity: contact.enabled ? 1 : 0.6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Priority Star button */}
                <button
                  onClick={() => setPriorityContact(contact.id)}
                  title={contact.isPriority ? 'Priority Contact' : 'Mark as Priority'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    marginTop: 2,
                  }}
                >
                  <Star
                    size={20}
                    fill={contact.isPriority ? '#f59e0b' : 'none'}
                    color={contact.isPriority ? '#f59e0b' : '#64748b'}
                  />
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{contact.name}</span>
                    {contact.relation && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                        {contact.relation}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {contact.phone}
                  </div>
                </div>
              </div>

              {/* Enable / Disable Switch */}
              <label className="switch" style={{ transform: 'scale(0.8)' }}>
                <input
                  type="checkbox"
                  checked={contact.enabled}
                  onChange={() => toggleContactEnabled(contact.id)}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Badges & Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              {/* Role badge */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background:
                      contact.role === 'BOTH'
                        ? 'rgba(168, 85, 247, 0.15)'
                        : contact.role === 'CALL'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(59, 130, 246, 0.15)',
                    color:
                      contact.role === 'BOTH'
                        ? '#c084fc'
                        : contact.role === 'CALL'
                        ? '#34d399'
                        : '#60a5fa',
                  }}
                >
                  {contact.role === 'BOTH' && 'SMS + CALL'}
                  {contact.role === 'SMS' && 'SMS ONLY'}
                  {contact.role === 'CALL' && 'PHONE CALL ONLY'}
                </span>
                {contact.isPriority && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b' }}>
                    ★ PRIORITY
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Test SMS */}
                <button
                  onClick={() => handleTestSms(contact)}
                  title="Send test SMS / Launch messaging app"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: testStatus?.id === contact.id ? '#34d399' : 'var(--text-muted)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  {testStatus?.id === contact.id ? (
                    <>
                      <CheckCircle2 size={12} /> {testStatus.msg}
                    </>
                  ) : (
                    <>
                      <Send size={12} /> Test SMS
                    </>
                  )}
                </button>

                {/* Edit */}
                <button
                  onClick={() => handleEdit(contact)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  <Edit3 size={15} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${contact.name}?`)) deleteContact(contact.id);
                  }}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {contacts.length === 0 && (
          <div className="glass-panel" style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>
            No emergency contacts added yet. Tap <strong>Phonebook</strong> or <strong>Pick</strong> above to add contacts from your phone.
          </div>
        )}
        </div>
      </CollapsibleCard>

      {/* Phonebook Selection Modal */}
      {isPhonebookModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-container glass-panel"
            style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Select From Phonebook</h3>
              </div>
              <button
                onClick={() => setIsPhonebookModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={phonebookSearch}
                onChange={(e) => setPhonebookSearch(e.target.value)}
                placeholder="Search contact name or number..."
                className="form-input"
                style={{ paddingLeft: 34 }}
              />
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 200 }}>
              {filteredPhonebook.map((item, idx) => (
                <div
                  key={`${item.phone}_${idx}`}
                  onClick={() => handleSelectPhonebookContact(item)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.phone}</div>
                  </div>
                  <button className="btn btn-outline btn-sm" style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                    + Select
                  </button>
                </div>
              ))}

              {filteredPhonebook.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No contacts found in phonebook matching &quot;{phonebookSearch}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Contact Modal */}
      <ContactFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingContact={editingContact}
      />
    </div>
  );
};
