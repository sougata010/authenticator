import { NativeModules } from 'react-native';

const { AuthenticatorModule } = NativeModules;

export interface AuthenticatorBridgeType {
  getTOTP(secret: string): Promise<string>;
}

export default AuthenticatorModule as AuthenticatorBridgeType;
