export type MarqueeLogo = { name: string; logo: string; link?: string };

type Props = { items: MarqueeLogo[]; label: string };

function LogoTile({ item, hidden }: { item: MarqueeLogo; hidden: boolean }) {
  const img = <img src={item.logo} alt={hidden ? "" : item.name} decoding="async" draggable={false} />;

  if (!item.link) {
    return <div className="logo-tile">{img}</div>;
  }

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="logo-tile"
      tabIndex={hidden ? -1 : undefined}
      title={item.name}
    >
      {img}
    </a>
  );
}

/**
 * Pure-CSS infinite logo strip. The list is rendered twice so the track can
 * loop seamlessly; the second copy is hidden from assistive tech.
 */
export function LogoMarquee({ items, label }: Props) {
  return (
    <div className="logo-marquee" role="region" aria-label={label}>
      <div className="logo-marquee-track">
        {[false, true].map((hidden) => (
          <ul key={String(hidden)} className="logo-marquee-group" aria-hidden={hidden || undefined}>
            {items.map((item) => (
              <li key={item.name}>
                <LogoTile item={item} hidden={hidden} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
