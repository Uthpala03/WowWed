/** Onboarding entry routes for couples and vendors */
export class OnboardingPath {
  constructor({ id, label, route, description }) {
    this.id = id;
    this.label = label;
    this.route = route;
    this.description = description;
  }
}

export const coupleOnboarding = new OnboardingPath({
  id: 'couple',
  label: 'Start planning',
  route: '/get-started/couple',
  description: 'Wedding planning for couples',
});

coupleOnboarding.freshRoute = '/get-started/couple?new=1';

export const vendorOnboarding = new OnboardingPath({
  id: 'vendor',
  label: 'Join as a vendor',
  route: '/get-started/vendor',
  description: 'List your wedding business',
});
