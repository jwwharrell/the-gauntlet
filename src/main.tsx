import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import '@aws-amplify/ui-react/styles.css';
import { components, formFields, theme } from './components/loginUtils.tsx';

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <Authenticator components={components} formFields={formFields} socialProviders={['google', 'apple']}>
        {({ signOut, user }) => (
          <>
            <h1>Hello {user?.username}</h1>
            <button onClick={signOut}>Sign out</button>
            <App />
          </>
        )}
      </Authenticator>
    </ThemeProvider>
  </React.StrictMode>
);
