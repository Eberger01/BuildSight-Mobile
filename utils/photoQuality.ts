export function photoQualityToExpo(quality: 'high' | 'medium' | 'low'): number {
  switch (quality) {
    case 'high':
      return 1;
    case 'medium':
      return 0.8;
    case 'low':
      return 0.5;
    default:
      return 0.8;
  }
}


