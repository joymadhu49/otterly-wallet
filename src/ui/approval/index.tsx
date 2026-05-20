import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../shared/store';
import { AntdProvider } from '../shared/AntdProvider';
import { ApprovalApp } from './ApprovalApp';
import '../shared/theme/global.less';

const root = createRoot(document.getElementById('root')!);
root.render(
  <Provider store={store}>
    <AntdProvider>
      <ApprovalApp />
    </AntdProvider>
  </Provider>,
);
