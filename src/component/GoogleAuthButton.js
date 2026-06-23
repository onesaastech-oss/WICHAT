import React, { useRef, useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const clampWidth = (width) => Math.min(400, Math.max(200, Math.floor(width)));

const GoogleAuthButton = ({ onSuccess, onError, text = 'continue_with' }) => {
  const containerRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const nextWidth = clampWidth(container.offsetWidth);
      setButtonWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      {buttonWidth > 0 && (
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          shape="rectangular"
          size="large"
          width={buttonWidth}
          text={text}
          locale="en"
        />
      )}
    </div>
  );
};

export const isGoogleAuthEnabled = () => Boolean(GOOGLE_CLIENT_ID);

export default GoogleAuthButton;
