import { MouseEvent } from 'react';
import { faArrowUp, faCoins } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TokenType } from '@multiversx/sdk-dapp/types/tokens.types';
import { useNavigate } from 'react-router-dom';
import { FormatAmount } from 'components';
import { RouteNamesEnum, SearchParamsEnum } from 'localConstants';

export const TokenRow = ({ token }: { token: TokenType }) => {
  const navigate = useNavigate();
  const logo = token.assets?.svgUrl;

  const handleSend = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    navigate(
      `${RouteNamesEnum.send}?${SearchParamsEnum.tokenId}=${token.identifier}`
    );
  };

  return (
    <div className='flex items-center justify-between p-4 rounded-lg'>
      <div className='flex items-center space-x-4'>
        {logo ? (
          <img src={logo} alt={token.ticker} className='w-8 h-8' />
        ) : (
          <FontAwesomeIcon icon={faCoins} className='token-item-logo-coins' />
        )}
        <div>{token.ticker}</div>
      </div>
      {token.balance && (
        <div className='text-right'>
          <FormatAmount value={token.balance} showLabel={false} />
        </div>
      )}
      <button
        className='text-white rounded bg-blue-500 px-2 py-1'
        onClick={handleSend}
      >
        <FontAwesomeIcon icon={faArrowUp} />
      </button>
    </div>
  );
};
