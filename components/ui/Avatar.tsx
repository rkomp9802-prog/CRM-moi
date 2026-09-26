import { initials } from '@/lib/avatar';

type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, string> = {
  sm: 'size-7 text-[10px]',
  md: 'size-9 text-xs',
  lg: 'size-24 text-2xl',
};

interface Props {
  name: string;
  src?: string | null;
  size?: Size;
}

export function Avatar({ name, src, size = 'md' }: Props) {
  const className = `${sizes[size]} shrink-0 overflow-hidden rounded-full border border-line`;

  if (src) {
    return (
      // next/image здесь не подходит: в src либо data:-картинка, либо произвольная
      // ссылка пользователя — заранее перечислить домены в remotePatterns нельзя.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${className} bg-canvas object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${className} flex items-center justify-center bg-canvas font-medium text-muted`}
    >
      {initials(name)}
    </span>
  );
}
