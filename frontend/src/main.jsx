// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { DataProvider } from "./Context/DataContext";
import { store, persistor } from './redux/store';
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <DataProvider>
          <HelmetProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </HelmetProvider>
        </DataProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);