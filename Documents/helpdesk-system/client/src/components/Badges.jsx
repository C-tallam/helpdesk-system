const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');
export const StatusBadge = ({ value }) => <span className={`badge st-${slug(value)}`}>{value}</span>;
export const PriorityBadge = ({ value }) => <span className={`badge pr-${slug(value)}`}>{value}</span>;
