/**
 * SettingsRow — single row inside a SettingsGroup.
 *
 * Variants:
 *  - nav       : chevron on the right; pushes a subpage or navigates
 *  - toggle    : right-aligned Switch
 *  - value     : read-only value on the right
 *  - destructive: red text, no chevron
 */
import * as React from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useIdentitySheetSafe } from './IdentitySheet';

type BaseProps = {
  icon?: LucideIcon;
  label: string;
  description?: string;
  className?: string;
};

type NavProps = BaseProps & {
  variant?: 'nav';
  value?: React.ReactNode;
  onClick?: () => void;
  /** If provided, pushes this content as a subpage inside the IdentitySheet. */
  subpage?: { id: string; title: string; content: React.ReactNode };
};

type ToggleProps = BaseProps & {
  variant: 'toggle';
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

type ValueProps = BaseProps & {
  variant: 'value';
  value: React.ReactNode;
};

type DestructiveProps = BaseProps & {
  variant: 'destructive';
  onClick: () => void;
};

export type SettingsRowProps = NavProps | ToggleProps | ValueProps | DestructiveProps;

export function SettingsRow(props: SettingsRowProps) {
  const { icon: Icon, label, description, className } = props;

  const iconEl = Icon ? (
    <Icon
      className={cn(
        'h-5 w-5 shrink-0',
        props.variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground',
      )}
      aria-hidden="true"
    />
  ) : null;

  const labelEl = (
    <div className="flex-1 min-w-0 text-left">
      <div
        className={cn(
          'text-body font-normal',
          props.variant === 'destructive' ? 'text-destructive' : 'text-foreground',
        )}
      >
        {label}
      </div>
      {description ? (
        <div className="mt-0.5 text-meta text-muted-foreground">{description}</div>
      ) : null}
    </div>
  );

  const rowClass = cn(
    'flex w-full items-center gap-3 px-4 py-3 min-h-touch text-left',
    'transition-colors',
    className,
  );

  if (props.variant === 'toggle') {
    return (
      <div className={rowClass}>
        {iconEl}
        {labelEl}
        <Switch
          checked={props.checked}
          onCheckedChange={props.onCheckedChange}
          disabled={props.disabled}
          aria-label={label}
        />
      </div>
    );
  }

  if (props.variant === 'value') {
    return (
      <div className={rowClass}>
        {iconEl}
        {labelEl}
        <div className="shrink-0 text-meta text-muted-foreground">{props.value}</div>
      </div>
    );
  }

  if (props.variant === 'destructive') {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className={cn(rowClass, 'hover:bg-destructive/5')}
      >
        {iconEl}
        {labelEl}
      </button>
    );
  }

  // nav
  return <NavRow {...props} rowClass={rowClass} iconEl={iconEl} labelEl={labelEl} />;
}

function NavRow({
  value,
  onClick,
  subpage,
  rowClass,
  iconEl,
  labelEl,
}: NavProps & { rowClass: string; iconEl: React.ReactNode; labelEl: React.ReactNode }) {
  const sheet = useIdentitySheetSafe();

  const handleClick = () => {
    if (subpage && sheet) {
      sheet.push({ id: subpage.id, title: subpage.title, node: subpage.content });
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button type="button" onClick={handleClick} className={cn(rowClass, 'hover:bg-muted/50')}>
      {iconEl}
      {labelEl}
      {value ? (
        <span className="shrink-0 text-meta text-muted-foreground">{value}</span>
      ) : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
