import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleCardProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultExpanded?: boolean;
  headerRight?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  defaultExpanded = true,
  headerRight,
  className = 'glass-panel',
  style,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  return (
    <div
      className={className}
      style={{
        padding: '14px 16px',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        ...style,
      }}
    >
      {/* Container Header */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          {icon && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {typeof title === 'string' ? (
                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {title}
                </h3>
              ) : (
                title
              )}
              {badge}
            </div>
            {subtitle && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Right Action & Down Arrow Button */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {headerRight}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? 'Collapse' : 'Show More'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: isExpanded ? 'var(--theme-primary, #60a5fa)' : 'var(--text-secondary, #94a3b8)',
              fontSize: '0.70rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Collapsible Content Body */}
      {isExpanded && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};
