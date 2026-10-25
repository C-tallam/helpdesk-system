import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { errorText } from '../api/client.js';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const ran = useRef(false); // the link works once, so make sure we only call the API once
  const [state, setState] = useState(token ? 'working' : 'error');
  const [message, setMessage] = useState(token ? '' : 'This link is missing its token.');

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    verifyEmail(token)
      .then(() => { setState('ok'); setTimeout(() => navigate('/', { replace: true }), 1500); })
      .catch((e) => { setState('error'); setMessage(errorText(e)); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand"><LifeBuoy size={26} aria-hidden="true" /> HelpDesk</div>
        {state === 'working' && <p role="status">Confirming your email…</p>}
        {state === 'ok' && <><h1>Email confirmed</h1><p className="form-ok" role="status">Your account is active. Taking you to HelpDesk…</p></>}
        {state === 'error' && (
          <>
            <h1>Couldn’t confirm your email</h1>
            <div role="alert" className="form-error">{message}</div>
            <p className="switch"><Link to="/login">Go to sign in</Link> to request a new link.</p>
          </>
        )}
      </div>
    </div>
  );
}
