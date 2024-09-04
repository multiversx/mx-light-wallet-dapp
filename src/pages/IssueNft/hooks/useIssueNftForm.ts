import { useEffect, useState } from 'react';
import {
  Address,
  TokenManagementTransactionsFactory,
  TransactionsFactoryConfig
} from '@multiversx/sdk-core/out';

import { useFormik } from 'formik';
import { number, object, string } from 'yup';
import { useSendTransactions } from 'hooks';
import { useGetAccount, useGetNetworkConfig } from 'lib';
import { useGetCollectionsQuery } from 'redux/endpoints';
import { CollectionType } from 'types';
import { IssueNftFieldsEnum } from '../types';

export const useIssueNftForm = () => {
  const { address } = useGetAccount();
  const { sendTransactions } = useSendTransactions();
  const { isLoading, data } = useGetCollectionsQuery(address);
  const {
    network: { chainId }
  } = useGetNetworkConfig();
  const [selectedCollection, setSelectedCollection] =
    useState<CollectionType>();

  const collections =
    data?.map((collection) => ({
      label: collection.name,
      value: collection.ticker
    })) || [];

  const factory = new TokenManagementTransactionsFactory({
    config: new TransactionsFactoryConfig({ chainID: chainId })
  });

  const formik = useFormik({
    initialValues: {
      [IssueNftFieldsEnum.name]: '',
      [IssueNftFieldsEnum.quantity]: 1,
      [IssueNftFieldsEnum.royalties]: 1,
      [IssueNftFieldsEnum.collection]: { label: '', value: '' },
      [IssueNftFieldsEnum.imageUrl]: ''
    },
    validationSchema: object().shape({
      name: string()
        .required('Required')
        .matches(/^[a-zA-Z0-9]*$/, 'Alphanumeric characters only')
        .test(
          'validLength',
          'Must be between 3 - 50 characters long',
          (value) => Boolean(value && value.length >= 3 && value.length <= 50)
        ),
      quantity: number()
        .required('Required')
        .min(1, 'Should be greater than or equal to 1'),
      royalties: number()
        .required('Required')
        .min(1, 'Should be greater than or equal to 1')
        .max(100, 'Should be less than or equal to 100'),
      collection: object().nullable().required('Collection is required'),
      imageUrl: string().required('Required')
    }),
    onSubmit: async (values) => {
      try {
        const transaction = factory.createTransactionForCreatingNFT({
          sender: new Address(address),
          name: values.name,
          tokenIdentifier: values.collection.value,
          royalties: values.royalties,
          initialQuantity: BigInt(values.quantity),
          hash: '',
          attributes: new Uint8Array(),
          uris: [values.imageUrl]
        });

        await sendTransactions([transaction]);
      } catch (err) {
        //setErrors({ amount: err.message });
      }

      formik.resetForm();
    }
  });

  useEffect(() => {
    const collection = data?.find(
      (col) => col.ticker === formik.values[IssueNftFieldsEnum.collection].value
    );

    setSelectedCollection(collection);
  }, [formik.values[IssueNftFieldsEnum.collection]]);

  return { formik, isLoading, collections, selectedCollection };
};
