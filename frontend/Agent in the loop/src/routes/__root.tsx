import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { TRPCReactProvider } from "~/trpc/react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const isFetching = useRouterState({ select: (s) => s.isLoading });

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <TRPCReactProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(13, 17, 23, 0.9)',
            backdropFilter: 'blur(12px)',
            color: '#E6F0FF',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#A3E635',
              secondary: 'rgba(13, 17, 23, 0.9)',
            },
          },
          error: {
            iconTheme: {
              primary: '#FB7185',
              secondary: 'rgba(13, 17, 23, 0.9)',
            },
          },
        }}
      />
      <Outlet />
    </TRPCReactProvider>
  );
}
