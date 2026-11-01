import { HEX } from '../lib/constants';
import { fmtDate, placeLabel } from '../lib/format';
import type { Item } from '../types';

export default function ItemCard({ item, onOpen }: { item: Item; onOpen: (id: string) => void }) {
  return (
    <article className="card">
      <div className={`thumb ${item.type}`}>
        {item.photo_url ? (
          <img src={item.photo_url} alt={`Photograph of ${item.name}`} loading="lazy" />
        ) : (
          <span className="sw" style={{ background: HEX[item.colour] ?? '#9aa0ad' }} />
        )}
        <span className={`tag ${item.type}`}>{item.type.toUpperCase()}</span>
      </div>
      <div className="cbody">
        <h3>{item.name}</h3>
        <p className="m">{item.category}, {item.colour}</p>
        <p className="m loc">{placeLabel(item)}</p>
        <p className="m">{item.type === 'lost' ? 'Lost' : 'Found'} {fmtDate(item.item_date)}</p>
        <span className="spacer" />
        <button className="btn sm" type="button" onClick={() => onOpen(item.id)}>View details</button>
      </div>
    </article>
  );
}
