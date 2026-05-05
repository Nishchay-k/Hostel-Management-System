export default function StatCard({ label, value, icon: Icon, tone = "blue" }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {Icon ? <Icon size={24} /> : null}
    </article>
  );
}
