import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BroumyCard } from '../../../components/ui';
import type { FormCatalogEntry } from '../types/form';

export interface FormCardProps {
  entry: FormCatalogEntry;
}

/** Catalog tile: form title/description in the active language + department. */
export function FormCard({ entry }: FormCardProps) {
  const { i18n, t } = useTranslation('catalog');
  const navigate = useNavigate();
  const lang = i18n.language.startsWith('en') ? 'en' : 'cs';
  const title = entry.title[lang] ?? entry.title.cs ?? entry.formKey;
  const description = entry.description[lang] ?? entry.description.cs ?? '';

  return (
    <BroumyCard
      title={title}
      titleAs="h2"
      variant="elevated"
      onPress={() => navigate(`/form/${encodeURIComponent(entry.formKey)}`)}
      aria-label={`${title} - ${t('viewForm')}`}
    >
      <p className="mb-sm">{description}</p>
      <p className="text-sm text-muted">
        {t('department')}: {entry.department}
      </p>
    </BroumyCard>
  );
}
