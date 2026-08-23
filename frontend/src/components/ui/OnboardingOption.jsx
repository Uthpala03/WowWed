import OnboardingIcon from './OnboardingIcon';
import { optionStyle } from '../../data/formOptions';

function OnboardingOption({ option, selected, onSelect, tile = false, multi = false }) {
  return (
    <button
      type="button"
      className={`onboarding__option${tile ? ' onboarding__option--tile' : ''}${selected ? ' is-on' : ''}${multi ? ' onboarding__option--multi' : ''}`}
      style={optionStyle(option.accent)}
      onClick={onSelect}
      aria-pressed={multi ? selected : undefined}
    >
      {multi && (
        <span className="onboarding__option-check" aria-hidden="true">
          {selected ? '✓' : ''}
        </span>
      )}
      <span className={`onboarding__option-icon${tile ? ' onboarding__option-icon--tile' : ''}`}>
        <OnboardingIcon name={option.icon} />
      </span>
      <span className="onboarding__option-copy">
        <span className="onboarding__option-label">{option.label}</span>
        {option.hint && <span className="onboarding__option-hint">{option.hint}</span>}
      </span>
    </button>
  );
}

export default OnboardingOption;
