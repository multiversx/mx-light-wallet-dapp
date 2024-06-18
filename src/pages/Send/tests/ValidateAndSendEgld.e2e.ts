import { DEFAULT_PAGE_LOAD_DELAY_MS, WALLET_SOURCE_ORIGIN } from '__mocks__';
import { DataTestIdsEnum } from 'localConstants/dataTestIds.enum';
import {
  changeInputText,
  expectElementToContainText,
  expectInputToHaveValue,
  expectToBeChecked,
  getByDataTestId,
  loginWithPem,
  sleep
} from 'utils/testUtils/puppeteer';

describe('Validate and send EGLD tests', () => {
  it('should validate form and send EGLD successfully', async () => {
    await page.goto(`${WALLET_SOURCE_ORIGIN}/unlock`, {
      waitUntil: 'domcontentloaded'
    });

    await loginWithPem();
    await page.waitForSelector(getByDataTestId(DataTestIdsEnum.sendBtn));
    await page.click(getByDataTestId(DataTestIdsEnum.sendBtn));
    expect(page.url()).toMatch(`${WALLET_SOURCE_ORIGIN}/send`);
    await sleep(DEFAULT_PAGE_LOAD_DELAY_MS);
    await page.click(getByDataTestId(DataTestIdsEnum.sendBtn));

    await expectToBeChecked({
      dataTestId: DataTestIdsEnum.sendEsdtTypeInput,
      isChecked: true
    });

    await expectElementToContainText({
      dataTestId: DataTestIdsEnum.receiverError,
      text: 'Receiver is required'
    });

    await changeInputText({
      dataTestId: DataTestIdsEnum.amountInput,
      shouldOverride: true,
      text: '-1'
    });

    await expectInputToHaveValue({
      dataTestId: DataTestIdsEnum.amountInput,
      value: '-1'
    });

    await expectElementToContainText({
      dataTestId: DataTestIdsEnum.amountError,
      text: 'Amount must be greater than or equal to 0'
    });

    await changeInputText({
      dataTestId: DataTestIdsEnum.amountInput,
      shouldOverride: true,
      text: '99999'
    });

    await expectInputToHaveValue({
      dataTestId: DataTestIdsEnum.amountInput,
      value: '99999'
    });

    await expectElementToContainText({
      dataTestId: DataTestIdsEnum.amountError,
      text: 'Insufficient balance'
    });

    await changeInputText({
      dataTestId: DataTestIdsEnum.amountInput,
      shouldOverride: true,
      text: '0'
    });

    await changeInputText({
      dataTestId: DataTestIdsEnum.dataInput,
      text: 'Sending empty transaction'
    });

    await changeInputText({
      dataTestId: DataTestIdsEnum.receiverInput,
      text: 'erd1wh9c0sjr2xn8hzf02lwwcr4jk2s84tat9ud2kaq6zr7xzpvl9l5q8awmex'
    });

    await expectInputToHaveValue({
      dataTestId: DataTestIdsEnum.gasLimitInput,
      value: '87500'
    });

    await page.click(getByDataTestId(DataTestIdsEnum.sendBtn));

    await expectElementToContainText({
      dataTestId: DataTestIdsEnum.transactionToastTitle,
      text: 'Processing transaction'
    });

    await page.click(getByDataTestId(DataTestIdsEnum.logoutBtn));
  });
});
