import { CreateRecoverFieldNamesEnum } from 'components/CreateRecoverPassword/types';

export interface PasswordFormInitialValuesType {
  [CreateRecoverFieldNamesEnum.password]: string;
  [CreateRecoverFieldNamesEnum.passwordRepeat]: string;
  [CreateRecoverFieldNamesEnum.check]: boolean;
}

export type PasswordFormPasswordFieldType = Pick<
  PasswordFormInitialValuesType,
  CreateRecoverFieldNamesEnum.password
>;
