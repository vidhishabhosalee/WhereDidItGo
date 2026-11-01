import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fmtDate, placeLabel, showPhone, waLink } from '../lib/format';
import { matchesFor } from '../lib/matching';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import type { Item } from '../types';
import MatchList from './MatchList';
import Modal from './Modal';

interface Props {
  item: Item | null;
  items: Item[];
  onClose: () => void;
  onOpen: (id: string) => void;
  onChanged: () => void;
}

function Body({ item, items, onClose, onOpen, onChanged }: Props & { item: Item }) {
  const { session } = useAuth();
  const mine = session?.user.id === item.user_id;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const matches = useMemo(() => matchesFor(item, items), [item, items]);
  const returned = item.status === 'returned';

  async function markReturned() {
    setBusy(true);
    const { error } = await supabase.from('items').update({ status: 'returned' }).eq('id', item.id);
    setBusy(false);
    if (error) return toast(error.message);
    toast('Marked as returned');
    onChanged();
    onClose();
  }

  async function remove() {
    setBusy(true);
    const { error } = await supabase.from('items').delete().eq('id', item.id);
    if (!error && item.photo_url) {
      const marker = '/item-photos/';
      const i = item.photo_url.indexOf(marker);
      if (i > -1) await supabase.storage.from('item-photos').remove([item.photo_url.slice(i + marker.length)]);
    }
    setBusy(false);
    if (error) return toast(error.message);
    toast('Report deleted');
    onChanged();
    onClose();
  }

  return (
    <>
      <div className="dhead">
        <div>
          <span className={`tag static ${returned ? 'done' : item.type}`}>{returned ? 'RETURNED' : item.type.toUpperCase()}</span>
          <h3 id="item-title">{item.name}</h3>
        </div>
        <button type="button" className="btn plain sm" onClick={onClose}>Close</button>
      </div>
      <div className="dbody">
        {item.photo_url && <img className="dphoto" src={item.photo_url} alt={`Photograph of ${item.name}`} />}
        <dl className="facts">
          <div><dt>{item.type === 'lost' ? 'Last seen' : 'Found at'}</dt><dd>{placeLabel(item)}</dd></div>
          <div><dt>Date and time</dt><dd>{fmtDate(item.item_date)}{item.item_time ? `, ${item.item_time.slice(0, 5)}` : ''}</dd></div>
          <div><dt>Category</dt><dd>{item.category}</dd></div>
          <div><dt>Colour and brand</dt><dd>{item.colour}{item.brand ? `, ${item.brand}` : ', brand unknown'}</dd></div>
          <div style={{ gridColumn: '1 / -1' }}><dt>Description</dt><dd>{item.description || 'No description added.'}</dd></div>
        </dl>

        {!returned && (
          <div className="contactcard">
            <h4>{item.type === 'found' ? 'Is this yours? Contact the finder' : 'Found this? Contact the owner'}</h4>
            <p><b>{item.contact_name}</b></p>
            <p className="num">{showPhone(item.contact_phone)}</p>
            <div className="row">
              <a className="btn cobalt sm" href={`tel:${item.contact_phone}`}>Call</a>
              <a className="btn plain sm" href={waLink(item.contact_phone)} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
            <p className="warn">Meet in a public place on campus such as the library or main gate, and check that the item matches before handing it over.</p>
          </div>
        )}
        {returned && <p className="warn">This item has been returned to its owner.</p>}

        {!returned && (
          <div>
            <h4 className="sub-h">Potential matches</h4>
            <MatchList matches={matches} onOpen={onOpen} />
          </div>
        )}

        {mine && !returned && (
          <div className="contactcard">
            <h4>Your report</h4>
            <div className="row">
              <button type="button" className="btn sm" disabled={busy} onClick={markReturned}>Mark as returned</button>
              {!confirmDelete ? (
                <button type="button" className="btn plain sm" onClick={() => setConfirmDelete(true)}>Delete report</button>
              ) : (
                <>
                  <button type="button" className="btn lost sm" disabled={busy} onClick={remove}>Yes, delete it</button>
                  <button type="button" className="btn plain sm" onClick={() => setConfirmDelete(false)}>Keep it</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function ItemDialog(props: Props) {
  return (
    <Modal open={props.item !== null} onClose={props.onClose} labelledBy="item-title">
      {props.item && <Body {...props} item={props.item} />}
    </Modal>
  );
}
