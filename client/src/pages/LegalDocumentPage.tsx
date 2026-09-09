import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type LegalDocument = 'privacy' | 'terms';
const LEGAL_SECTION_COUNT = 5;

interface LegalDocumentPageProps {
  readonly document: LegalDocument;
}

export const LegalDocumentPage = ({ document }: LegalDocumentPageProps): React.JSX.Element => {
  const { t } = useTranslation();
  const prefix = `legal.${document}`;
  const sections = Array.from({ length: LEGAL_SECTION_COUNT }, (_, index) => index);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <article className="mx-auto max-w-3xl space-y-6">
        <Link className="text-sm text-primary underline" to="/register">{t('legal.backToRegister')}</Link>
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">{t(`${prefix}.title`)}</h1>
          <p className="text-sm text-muted-foreground">{t(`${prefix}.version`)} · {t(`${prefix}.updated`)}</p>
        </header>
        <p className="rounded-md border border-expense bg-expense-soft p-4 text-sm">{t('legal.nonProductionNotice')}</p>
        <p className="leading-7 text-muted-foreground">{t(`${prefix}.intro`)}</p>
        <div className="space-y-5">
          {sections.map((index) => (
            <section key={`${document}-${index}`} className="leading-7 text-muted-foreground">
              <h2 className="mb-1 text-lg font-medium text-foreground">{t(`${prefix}.sectionTitles.${index}`)}</h2>
              <p>{t(`${prefix}.sections.${index}`)}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
};
