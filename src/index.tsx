import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastContext } from './contexts/ToastContext';
import ToastContainer, { InternalToastContext } from './components/ToastContainer';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const AppWrapper = () => {
    const [toasts, setToasts] = React.useState<any[]>([]);
    const timeoutIds = React.useRef<Set<number>>(new Set());

    const removeToast = React.useCallback((id: string) => {
        setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, []);

    const showToast = React.useCallback((message: string, type = 'info') => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts(currentToasts => [...currentToasts, { id, message, type }]);
        
        const timeoutId = window.setTimeout(() => {
            removeToast(id);
            timeoutIds.current.delete(timeoutId);
        }, 5000);
        timeoutIds.current.add(timeoutId);

    }, [removeToast]);

    React.useEffect(() => {
        return () => {
            timeoutIds.current.forEach(timeoutId => clearTimeout(timeoutId));
        };
    }, []);

    const contextValue = {
        showToast
    };
    
    const internalContextValue = {
        toasts,
        removeToast
    }

    return (
        <ToastContext.Provider value={contextValue}>
            <InternalToastContext.Provider value={internalContextValue}>
                <App />
                <SpeedInsights />
                <ToastContainer />
            </InternalToastContext.Provider>
        </ToastContext.Provider>
    );
};


root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);