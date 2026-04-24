export class Step {
  label: string;
  stepIcon?: string;

  constructor(label: string, stepIcon?: string) {
    this.label = label;
    this.stepIcon = stepIcon;
  }
}