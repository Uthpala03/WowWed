import OnboardingIcon from './OnboardingIcon';
import { optionStyle } from '../../data/formOptions';

function OnboardingOption({ option, selected, onSelect, tile = false }) {
  return (
    <button
      type="button"
      className={`onboarding__option${tile ? ' onboarding__option--tile' : ''}${selected ? ' is-on' : ''}`}
      style={optionStyle(option.accent)}
      onClick={onSelect}
    >
      <span className={`onboarding__option-icon${tile ? ' onboarding__option-icon--tile' : ''}`}>
        <OnboardingIcon name={option.icon} />
      </span>
      {option.label}
    </button>
  );
}

export default OnboardingOption;
