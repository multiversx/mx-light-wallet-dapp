import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthenticatedRoutesWrapper } from 'components';
import { routeNames, routes } from 'routes/routes';
import { Footer } from './Footer';
import { Header } from './Header';

export const Layout = ({ children }: PropsWithChildren) => {
  const { search } = useLocation();
  return (
    <div className='flex min-h-screen flex-col bg-slate-200'>
      <Header />
      <main className='flex flex-grow items-stretch justify-center py-6 px-3'>
        <AuthenticatedRoutesWrapper
          routes={routes}
          unlockRoute={`${routeNames.unlock}${search}`}
        >
          {children}
        </AuthenticatedRoutesWrapper>
      </main>
      <Footer />
    </div>
  );
};
