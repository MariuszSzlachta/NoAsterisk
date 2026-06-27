interface SectionLabelProps {
  readonly children: string;
}

export const SectionLabel = ({
  children,
}: SectionLabelProps): React.JSX.Element => {
  return (
    <h2 className="mt-1 px-3 text-[11px] font-medium uppercase tracking-widest text-subtle">
      {children}
    </h2>
  );
};
