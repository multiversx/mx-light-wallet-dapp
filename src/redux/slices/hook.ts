import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { decodeLoginToken } from 'helpers/sdkDapp/sdkDapp.helpers';
import { HooksEnum } from 'routes';

export interface HookSliceType {
  callbackUrl: string;
  hookUrl: string;
  loginToken?: string;
  hasNativeAuthToken?: boolean;
  type: HooksEnum | null;
  wasCancelled?: boolean;
  isWalletConnectV2Initializing?: boolean;
  signMessageOptions?: {
    title?: string;
    subtitle?: string;
    signMessageSource?: string;
  };
}

export const initialHookState: HookSliceType = {
  callbackUrl: '',
  hookUrl: '',
  type: null,
  isWalletConnectV2Initializing: false
};

export const hookSlice = createSlice({
  name: 'hookSlice',
  initialState: initialHookState,
  reducers: {
    setHook: (state: HookSliceType, action: PayloadAction<HookSliceType>) => {
      state = action.payload;
      state.hasNativeAuthToken =
        decodeLoginToken(String(action.payload.loginToken)) != null;
      state.wasCancelled = false;
      return state;
    },

    resetHook: (
      _: HookSliceType,
      action: PayloadAction<{ wasCancelled: boolean } | undefined>
    ) => {
      return {
        ...initialHookState,
        wasCancelled: action?.payload?.wasCancelled ?? false
      };
    },

    setIsWalletConnectV2Initializing: (
      state: HookSliceType,
      action: PayloadAction<boolean>
    ) => {
      state.isWalletConnectV2Initializing = action.payload;
      return state;
    }
  }
});

export const { setHook, resetHook, setIsWalletConnectV2Initializing } =
  hookSlice.actions;

export const hookReducer = hookSlice.reducer;
