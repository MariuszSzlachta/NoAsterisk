interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps): React.JSX.Element => {
  return <div className={`animate-pulse rounded-md bg-surface-3 ${className}`} />;
};
