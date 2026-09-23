import React, { useRef, useState } from 'react';
import {
  User,
  FileText,
  Clock,
  CheckCircle2,
  Palette,
  RotateCcw,
  Phone,
  MessageCircle,
  Paintbrush,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APP_THEMES, type AppThemeId } from '../../types/theme';
import { formatEmergencyMessage } from '../../utils/messageFormatter';
import { CollapsibleCard } from '../common/CollapsibleCard';

export const AlertsScreen: React.FC = () => {
  const {
    activeProfile,
    updateActiveProfile,
    userName,
    setUserName,
    activeTheme,
    setActiveTheme,
    themeConfig,
    customTheme,
    updateCustomTheme,
  } = useApp();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [customColor, setCustomColor] = useState<string>(customTheme?.primaryColor || '#38bdf8');
  const [customName, setCustomName] = useState<string>(customTheme?.name || 'My Custom Shield');

  // Helper to insert placeholders into message template
  const handleInsertPlaceholder = (token: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const current = activeProfile.messageTemplate;
      const updated = current.substring(0, start) + token + current.substring(end);
      updateActiveProfile({
        ...activeProfile,
        messageTemplate: updated,
      });
      // Move cursor after inserted token
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + token.length, start + token.length);
      }, 50);
    } else {
      updateActiveProfile({
        ...activeProfile,
        messageTemplate: activeProfile.messageTemplate + ' ' + token,
      });
    }
  };

  const handleSelectTheme = (themeId: AppThemeId) => {
    setActiveTheme(themeId);
    if (themeId === 'CUSTOM') {
      if (customTheme?.defaultTemplate) {
        updateActiveProfile({
          ...activeProfile,
          messageTemplate: customTheme.defaultTemplate,
        });
      }
      return;
    }
    const targetTheme = APP_THEMES[themeId];
    if (targetTheme) {
      // Auto-load theme's default message template
      updateActiveProfile({
        ...activeProfile,
        messageTemplate: targetTheme.defaultTemplate,
      });
    }
  };

  const handleApplyCustomColor = (color: string) => {
    setCustomColor(color);
    updateCustomTheme({ color, name: customName });
  };

  const handleApplyCustomName = (name: string) => {
    setCustomName(name);
    updateCustomTheme({ color: customColor, name });
  };

  const handleResetToThemeDefault = () => {
    if (themeConfig?.defaultTemplate) {
      updateActiveProfile({
        ...activeProfile,
        messageTemplate: themeConfig.defaultTemplate,
      });
    }
  };

  // Generate live preview with real time & simulated GPS map link
  const previewMessage = formatEmergencyMessage(activeProfile.messageTemplate, {
    name: userName || 'User',
    location: 'https://maps.google.com/?q=37.7749,-122.4194',
    battery: '88%',
  });

  const charCount = activeProfile.messageTemplate.length;
  const previewLength = previewMessage.length;
  const smsSegments = Math.ceil(previewLength / 160) || 1;

  const themesList = [
    ...Object.values(APP_THEMES).filter((t) => t.id !== 'CUSTOM'),
    customTheme,
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Alerts & Dynamic Themes</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Configure emergency SMS templates, location placeholders, and customize protection themes
        </p>
      </div>

      {/* 1. Dynamic Profiles & Themes Selector with Custom Theme Builder */}
      <CollapsibleCard
        title="Dynamic Protection Themes"
        subtitle="Tap theme preset or directly customize colors & styling"
        icon={<Palette size={18} color="var(--theme-primary)" />}
        badge={
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 10,
              background: themeConfig.badgeBg,
              color: themeConfig.badgeColor,
              border: `1px solid ${themeConfig.borderAccent}`,
            }}
          >
            ACTIVE: {themeConfig.name.toUpperCase()}
          </span>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10,
            marginBottom: 10,
          }}
        >
          {themesList.map((theme) => {
            const isSelected = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px 10px',
                  borderRadius: 12,
                  border: isSelected ? `2px solid ${theme.primaryColor}` : '1px solid var(--border-subtle)',
                  background: isSelected ? theme.badgeBg : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: theme.primaryColor,
                      boxShadow: isSelected ? `0 0 8px ${theme.primaryColor}` : 'none',
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isSelected ? theme.badgeColor : 'var(--text-primary)' }}>
                    {theme.name}
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {theme.tagline}
                </span>

                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      color: theme.primaryColor,
                    }}
                  >
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Theme Direct Customization Box */}
        {activeTheme === 'CUSTOM' && (
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${customTheme.borderAccent}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Paintbrush size={15} color={customTheme.primaryColor} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                Directly Customize Your Theme
              </span>
            </div>

            {/* Custom Theme Name */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Custom Theme Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => handleApplyCustomName(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                placeholder="e.g. My Campus Shield"
              />
            </div>

            {/* Color Picker & Preset Swatches */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Primary Accent Color (Tap Swatch or Pick Custom Hex)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleApplyCustomColor(e.target.value)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    background: 'none',
                    padding: 0,
                  }}
                  title="Choose any custom color"
                />

                {[
                  '#38bdf8', // Neon Sky Blue
                  '#a855f7', // Electric Violet
                  '#ec4899', // Hot Pink
                  '#f59e0b', // Amber Gold
                  '#10b981', // Emerald Mint
                  '#ef4444', // Danger Crimson
                  '#f97316', // Orange Flame
                  '#06b6d4', // Cyan
                  '#84cc16', // Lime Green
                  '#e2e8f0', // Ice White
                ].map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => handleApplyCustomColor(swatch)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: swatch,
                      border: customColor.toLowerCase() === swatch.toLowerCase() ? '3px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: customColor.toLowerCase() === swatch.toLowerCase() ? `0 0 10px ${swatch}` : 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                      transform: customColor.toLowerCase() === swatch.toLowerCase() ? 'scale(1.15)' : 'scale(1)',
                    }}
                    title={swatch}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </CollapsibleCard>

      {/* 2. Message Template Editor with Placeholders */}
      <CollapsibleCard
        title="Custom Emergency Message Template"
        subtitle={`${charCount} chars template • ${previewLength} chars formatted • ${smsSegments} SMS`}
        icon={<FileText size={18} color="var(--theme-primary)" />}
        headerRight={
          <button
            onClick={handleResetToThemeDefault}
            title="Reset to theme default template"
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.70rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        }
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={activeProfile.messageTemplate}
          onChange={(e) => updateActiveProfile({ ...activeProfile, messageTemplate: e.target.value })}
          rows={4}
          className="form-input"
          style={{
            width: '100%',
            fontFamily: 'inherit',
            fontSize: '0.84rem',
            lineHeight: 1.5,
            padding: '10px 12px',
            resize: 'vertical',
            marginBottom: 10,
          }}
          placeholder="Enter emergency SMS format with /{location}, /{time}, /{date}..."
        />

        {/* Clickable Placeholder Chips */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            Click tags below to insert placeholders into template:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { token: '/{location}', label: '+ /{location}', desc: 'Google Maps Link' },
              { token: '/{time}', label: '+ /{time}', desc: 'Current Time (e.g. 03:45 PM)' },
              { token: '/{date}', label: '+ /{date}', desc: 'Current Date (e.g. Sep 23, 2026)' },
              { token: '/{name}', label: '+ /{name}', desc: 'Sender Name' },
              { token: '/{battery}', label: '+ /{battery}', desc: 'Battery %' },
            ].map((tag) => (
              <button
                key={tag.token}
                type="button"
                onClick={() => handleInsertPlaceholder(tag.token)}
                className="btn btn-outline btn-sm"
                title={tag.desc}
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  fontFamily: 'monospace',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--theme-primary)',
                  fontWeight: 700,
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Live SMS Preview Card */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: 12,
            padding: '12px 14px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              LIVE OUTGOING SMS PREVIEW
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {charCount} chars template • {previewLength} chars formatted • {smsSegments} SMS segment{smsSegments > 1 ? 's' : ''}
            </span>
          </div>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              borderLeft: `3px solid var(--theme-primary)`,
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              lineHeight: 1.45,
              wordBreak: 'break-word',
            }}
          >
            {previewMessage}
          </div>
        </div>
      </CollapsibleCard>

      {/* 3. User Identity Settings */}
      <CollapsibleCard
        title="Sender Identification"
        subtitle={`Current Sender Name: ${userName || 'Not Set'}`}
        icon={<User size={18} color="var(--theme-primary)" />}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            Your Name (replaces <code>/{'{name}'}</code> in SMS)
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="form-input"
            placeholder="e.g. Jane Doe"
          />
        </div>
      </CollapsibleCard>

      {/* 4. Alert Parameters (Countdown & Timers) */}
      <CollapsibleCard
        title="Emergency Execution Parameters"
        subtitle={`Grace: ${activeProfile.gracePeriodSeconds}s • Repeat: ${!activeProfile.isRepeatEnabled ? 'None' : activeProfile.repeatIntervalSeconds + 's'}`}
        icon={<Clock size={18} color="var(--theme-primary)" />}
      >
        {/* Grace Period */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cancellation Grace Period</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--theme-primary)' }}>
              {activeProfile.gracePeriodSeconds}s
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            Countdown timer to abort accidental trigger before SMS dispatch (0 = instant send)
          </p>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={activeProfile.gracePeriodSeconds}
            onChange={(e) =>
              updateActiveProfile({ ...activeProfile, gracePeriodSeconds: Number(e.target.value) })
            }
            style={{ width: '100%' }}
          />
        </div>

        {/* Repeat Alert Interval */}
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Repeat Alert Interval</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--theme-primary)' }}>
              {!activeProfile.isRepeatEnabled
                ? 'One-Time Only'
                : `Every ${activeProfile.repeatIntervalSeconds}s`}
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            Periodically re-sends updated live GPS location to contacts until dismissed
          </p>
          <input
            type="range"
            min="15"
            max="180"
            step="15"
            value={activeProfile.repeatIntervalSeconds}
            onChange={(e) =>
              updateActiveProfile({
                ...activeProfile,
                repeatIntervalSeconds: Number(e.target.value),
                isRepeatEnabled: true,
              })
            }
            style={{ width: '100%' }}
          />
        </div>

        {/* Audible Siren Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 12,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Audible Emergency Alarm</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Plays loud siren sound on phone speakers upon trigger
            </div>
          </div>
          <label className="switch" style={{ transform: 'scale(0.8)' }}>
            <input
              type="checkbox"
              checked={activeProfile.soundAlarmOnPhone}
              onChange={(e) => updateActiveProfile({ ...activeProfile, soundAlarmOnPhone: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>
      </CollapsibleCard>

      {/* 5. Discreet Watermark Developer Support (Alerts Screen Only) */}
      <div
        style={{
          marginTop: 8,
          marginBottom: 16,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.08)',
          opacity: 0.65,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8', textTransform: 'uppercase' }}>
            System Watermark • Dev Support
          </span>
          <span style={{ fontSize: '0.60rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.05em' }}>
            DEV646
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, fontSize: '0.68rem', color: '#cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Charan: <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>79896 04815</strong></span>
            <a href="tel:7989604815" style={{ color: '#4ade80', textDecoration: 'none' }} title="Call Charan">
              <Phone size={11} />
            </a>
            <a href="https://wa.me/917989604815" target="_blank" rel="noreferrer" style={{ color: '#25d366', textDecoration: 'none' }} title="WhatsApp Charan">
              <MessageCircle size={11} />
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Mouli: <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>77319 43179</strong></span>
            <a href="tel:7731943179" style={{ color: '#4ade80', textDecoration: 'none' }} title="Call Mouli">
              <Phone size={11} />
            </a>
            <a href="https://wa.me/917731943179" target="_blank" rel="noreferrer" style={{ color: '#25d366', textDecoration: 'none' }} title="WhatsApp Mouli">
              <MessageCircle size={11} />
            </a>
          </div>
        </div>

        <div style={{ fontSize: '0.58rem', color: '#64748b', textAlign: 'center', marginTop: 2 }}>
          EASITRONICS • make projects easier • EasiAlert v2.4
        </div>
      </div>
    </div>
  );
};
