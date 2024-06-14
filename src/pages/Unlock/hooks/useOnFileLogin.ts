import { useDispatch, useSelector } from 'react-redux';

import { useNavigate } from 'react-router-dom';
import { getToken, loginWithExternalProvider } from 'helpers';
import { useGetAccountInfo, useLoginService } from 'hooks';
import { hookSelector } from 'redux/selectors';

import {
  setAccountAddress,
  setExternalNativeAuthToken,
  setTokenLogin
} from 'redux/slices';
import { routeNames } from 'routes';
import { signMessage } from '../helpers';

interface UseOnLoginType {
  address: string;
  loginToken?: string;
  privateKey: string;
}

export const generateTokenSignature = ({
  address,
  loginToken,
  privateKey
}: UseOnLoginType) => {
  const message = `${address}${loginToken}{}`;
  return signMessage({ message, privateKey });
};

export const useOnFileLogin = () => {
  const dispatch = useDispatch();
  const { loginToken, hasNativeAuthToken } = useSelector(hookSelector);
  const { address: loggedInAddress } = useGetAccountInfo();
  const loginService = useLoginService();
  const navigate = useNavigate();

  return async ({
    address,
    noRedirect,
    privateKey,
    token
  }: UseOnLoginType & {
    noRedirect?: boolean;
    token?: string;
  }) => {
    const usedToken = loginToken || token;
    let signature = '';

    if (usedToken) {
      signature = (
        await generateTokenSignature({
          address,
          loginToken: usedToken,
          privateKey
        })
      ).signature.toString('hex');
    }

    if (loginToken && hasNativeAuthToken) {
      const externalNativeAuthToken = getToken({
        address,
        token: loginToken,
        signature
      });

      dispatch(setExternalNativeAuthToken(externalNativeAuthToken));
    } else if (token) {
      dispatch(setTokenLogin({ loginToken: token, signature }));

      if (signature) {
        loginService.setLoginToken(token);
        loginService.setTokenLoginInfo({
          signature,
          address
        });
      }
    }

    loginWithExternalProvider(address);
    dispatch(setAccountAddress(address));

    if (noRedirect) {
      return;
    }

    if (!loggedInAddress) {
      navigate(routeNames.dashboard, {
        replace: true
      });
    }
  };
};
