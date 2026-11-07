import { COUNTRY_CODES } from '../lib/constants';

interface Props {
  id: string;
  value: string;
  onChange: (v: string) => void;
  cc: string;
  onCc: (v: string) => void;
}

export default function PhoneInput({ id, value, onChange, cc, onCc }: Props) {
  return (
    <div className="phone-row">
      <select aria-label="Country code" value={cc} onChange={(e) => onCc(e.target.value)}>
        {COUNTRY_CODES.map((c) => (
          <option key={c.label} value={c.code}>{c.label}</option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={cc ? '9876543210' : '+14155550123'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
