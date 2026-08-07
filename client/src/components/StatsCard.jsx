"use client";

export default function StatsCard({
  title,
  value,
  icon,
  gradient,
  delay = 0,
  note,
  trend,
  trendType = "positive",
}) {
  const animationDelay = `${Math.max(0, Number(delay) || 0) * 70}ms`;

  return (
    <article
      className="stat-card animate-fade-in"
      style={{ animationDelay }}
      aria-label={`${title}: ${value}`}
    >
      <div className="stat-card-accent" style={{ background: gradient }} />

      <div className="stat-card-top">
        <span
          className="stat-icon"
          style={{ background: gradient }}
          aria-hidden="true"
        >
          {icon}
        </span>

        {trend ? (
          <span className={`stat-trend stat-trend-${trendType}`}>
            {trend}
          </span>
        ) : (
          <span className="stat-dot" aria-hidden="true" />
        )}
      </div>

      <div className="stat-card-body">
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>

        {note && <p className="stat-note">{note}</p>}
      </div>
    </article>
  );
}