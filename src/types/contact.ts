export type ContactRole = 'SMS' | 'CALL' | 'BOTH';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  role: ContactRole;
  isPriority: boolean;
  relation?: string;
  enabled: boolean;
}

export const DEFAULT_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Primary Contact (Mom/Spouse)',
    phone: '+15551234567',
    role: 'BOTH',
    isPriority: true,
    relation: 'Family',
    enabled: true,
  },
  {
    id: 'c2',
    name: 'Emergency Services / Local Guard',
    phone: '+15559876543',
    role: 'CALL',
    isPriority: false,
    relation: 'Security',
    enabled: true,
  },
  {
    id: 'c3',
    name: 'Trusted Friend',
    phone: '+15554567890',
    role: 'SMS',
    isPriority: false,
    relation: 'Friend',
    enabled: true,
  },
];
