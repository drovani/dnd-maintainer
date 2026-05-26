import { useTranslation } from 'react-i18next';
import { ProficienciesStep } from './ProficienciesStep';
import { SkillsStep } from './SkillsStep';

export function DetailsStep() {
  const { t: tc } = useTranslation('common');
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-base font-semibold mb-3">{tc('characterBuilder.steps.skills')}</h3>
        <SkillsStep />
      </section>
      <section>
        <h3 className="text-base font-semibold mb-3">{tc('characterBuilder.steps.proficiencies')}</h3>
        <ProficienciesStep />
      </section>
    </div>
  );
}
