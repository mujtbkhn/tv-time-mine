

export const ShimmerDetail = () => {
  return (
    <div className="shimmer-wrapper" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="shimmer" style={{ width: '100%', height: '400px', borderRadius: 'var(--radius-lg)' }}></div>
      <div className="shimmer" style={{ width: '60%', height: '40px', borderRadius: 'var(--radius-sm)' }}></div>
      <div className="shimmer" style={{ width: '80%', height: '20px', borderRadius: 'var(--radius-sm)' }}></div>
      <div className="shimmer" style={{ width: '70%', height: '20px', borderRadius: 'var(--radius-sm)' }}></div>
    </div>
  );
};

export const ShimmerCard = () => {
  return (
    <div className="shimmer-wrapper" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div className="shimmer" style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
};
