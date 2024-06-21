import { ChangeEventHandler, useEffect, useState } from 'react';
import { PartialNftType } from '@multiversx/sdk-dapp-form';
import BigNumber from 'bignumber.js';
import { useFormik } from 'formik';
import { useSearchParams } from 'react-router-dom';
import { number, object, string } from 'yup';
import {
  prepareTransaction,
  getEgldLabel,
  useGetAccountInfo,
  useGetNetworkConfig,
  computeNftDataField,
  computeTokenDataField,
  calculateNftGasLimit,
  addressIsValid,
  calculateGasLimit
} from 'lib';
import {
  DECIMALS,
  GAS_LIMIT,
  GAS_PRICE,
  SearchParamsEnum
} from 'localConstants';
import { useSendTransactions } from './useSendTransactions';
import { useTokenOptions } from './useTokenOptions';
import { getSelectedTokenBalance } from '../helpers';
import { FormFieldsEnum, SendTypeEnum, TokenOptionType } from '../types';

export const useSendForm = () => {
  const { address, account } = useGetAccountInfo();
  const { chainID } = useGetNetworkConfig();
  const { sendTransactions } = useSendTransactions();
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenIdParam = searchParams.get(SearchParamsEnum.tokenId);
  const isNftParam = searchParams.get(SearchParamsEnum.isNFT);
  const [sendType, setSendType] = useState(
    isNftParam ? SendTypeEnum.nft : SendTypeEnum.esdt
  );

  const egldLabel = getEgldLabel();
  const isNFT = sendType === SendTypeEnum.nft;
  const { tokenOptions, isLoading, tokens } = useTokenOptions(sendType);
  const defaultTokenOption = tokenIdParam
    ? tokenOptions?.find((option) => option.value === tokenIdParam)
    : tokenOptions?.[0];

  const formik = useFormik({
    initialValues: {
      [FormFieldsEnum.amount]: '',
      [FormFieldsEnum.data]: '',
      [FormFieldsEnum.gasLimit]: GAS_LIMIT,
      [FormFieldsEnum.receiver]: '',
      [FormFieldsEnum.token]: defaultTokenOption,
      [FormFieldsEnum.type]: SendTypeEnum.esdt
    },
    validationSchema: object({
      [FormFieldsEnum.receiver]: string()
        .test(
          'addressIsValid',
          'Address is invalid',
          (value) => !value || addressIsValid(value)
        )
        .test(
          'differentSender',
          'Receiver should be different than current account',
          (value) => !value || !isNFT || value !== address
        )
        .required('Receiver is required'),
      [FormFieldsEnum.amount]: number()
        .required('Amount is required')
        .min(0, 'Amount must be greater than or equal to 0')
        .test('insufficientBalance', 'Insufficient balance', (value) => {
          if (!value || !formik.values[FormFieldsEnum.token]) {
            return true;
          }

          const selectedTokenOption = formik.values[
            FormFieldsEnum.token
          ] as TokenOptionType;

          const selectedTokenBalance = getSelectedTokenBalance({
            tokens,
            tokenOption: selectedTokenOption
          });

          return new BigNumber(selectedTokenBalance).isGreaterThanOrEqualTo(
            new BigNumber(value)
          );
        }),
      [FormFieldsEnum.gasLimit]: number()
        .required('Gas limit is required')
        .positive('Gas limit must be a positive number'),
      [FormFieldsEnum.token]: object().nullable().required('Token is required'),
      [FormFieldsEnum.type]: string().required('Type is required')
    }),
    onSubmit: async (values) => {
      const isEgldSend = values[FormFieldsEnum.token]?.value === egldLabel;

      const transaction = prepareTransaction({
        amount: isEgldSend ? String(values.amount) : '0',
        balance: account.balance,
        chainId: chainID,
        data: values[FormFieldsEnum.data].trim(),
        gasLimit: String(values[FormFieldsEnum.gasLimit]),
        gasPrice: String(GAS_PRICE),
        nonce: account.nonce,
        receiver: isNFT ? address : values.receiver,
        sender: address
      });

      await sendTransactions([transaction]);

      formik.resetForm();
    }
  });

  const selectedToken = tokens?.find(
    (token) => token.identifier === formik.values[FormFieldsEnum.token]?.value
  );

  const isEgldToken = selectedToken?.identifier === egldLabel;
  const availableAmount = getSelectedTokenBalance({
    tokens,
    tokenOption: formik.values[FormFieldsEnum.token]
  });

  const canEditNftAmount = new BigNumber(availableAmount).isGreaterThan(1);

  const resetFormAndGetBalance = () => {
    const balance = defaultTokenOption
      ? getSelectedTokenBalance({ tokens, tokenOption: defaultTokenOption })
      : '';

    formik.setFieldValue(FormFieldsEnum.data, '');
    formik.setFieldValue(FormFieldsEnum.token, defaultTokenOption);
    formik.setFieldValue(FormFieldsEnum.amount, isNFT ? balance : '0');
    formik.setFieldValue(FormFieldsEnum.gasLimit, GAS_LIMIT);

    return balance;
  };

  const handleOnDataChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    if (!isEgldToken) {
      return;
    }

    const gasLimit = calculateGasLimit({
      data: event.target.value
    });

    formik.setFieldValue(FormFieldsEnum.gasLimit, gasLimit);

    return formik.handleChange(event);
  };

  const handleOnSendTypeChange: (
    sendType: SendTypeEnum
  ) => ChangeEventHandler<HTMLInputElement> =
    (selectedType: SendTypeEnum) => (event) => {
      setSendType(selectedType);

      return formik.handleChange(event);
    };

  useEffect(() => {
    const formTokenValue = formik.values[FormFieldsEnum.token]?.value;
    const selectedTokenValue = defaultTokenOption?.value;

    if (!formTokenValue && formTokenValue !== selectedTokenValue) {
      formik.setFieldValue(FormFieldsEnum.token, defaultTokenOption);
      resetFormAndGetBalance();
      setSearchParams();
    }
  }, [defaultTokenOption, tokenIdParam]);

  useEffect(() => {
    const balance = resetFormAndGetBalance();

    if (!defaultTokenOption || !isNFT) {
      return;
    }

    const defaultToken = tokens?.find(
      (token) => token.identifier === defaultTokenOption.value
    );

    const data = computeNftDataField({
      nft: defaultToken as PartialNftType,
      amount: balance,
      receiver: formik.values[FormFieldsEnum.receiver],
      errors: false
    });

    formik.setFieldValue(FormFieldsEnum.data, data);
  }, [sendType]);

  useEffect(() => {
    if (!selectedToken || isEgldToken) {
      formik.setFieldValue(FormFieldsEnum.data, '');
      formik.setFieldValue(FormFieldsEnum.gasLimit, GAS_LIMIT);
      return;
    }

    let data, gasLimit;

    if (isNFT) {
      data = computeNftDataField({
        nft: selectedToken as PartialNftType,
        amount: formik.values[FormFieldsEnum.amount],
        receiver: formik.values[FormFieldsEnum.receiver],
        errors: false
      });

      gasLimit = calculateNftGasLimit(data);
    } else {
      data = computeTokenDataField({
        tokenId: selectedToken.identifier,
        amount: formik.values[FormFieldsEnum.amount],
        decimals: selectedToken?.decimals ?? DECIMALS
      });

      gasLimit = calculateGasLimit({ data });
    }

    formik.setFieldValue(FormFieldsEnum.data, data);
    formik.setFieldValue(FormFieldsEnum.gasLimit, gasLimit);
  }, [
    formik.values[FormFieldsEnum.amount],
    formik.values[FormFieldsEnum.receiver],
    formik.values[FormFieldsEnum.token]
  ]);

  return {
    availableAmount,
    canEditNftAmount,
    formik,
    handleOnDataChange,
    handleOnSendTypeChange,
    isEgldToken,
    isLoading,
    isNFT,
    tokenOptions
  };
};
