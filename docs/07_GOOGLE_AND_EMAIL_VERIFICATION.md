# Google and email verification

Existing Google Identity Services and server ID-token verification remain. Google accounts resolve through user_auth_identities and students in MySQL; email verification and provider subject checks must remain authoritative. The configured web Client ID is public; a client secret is unnecessary for this popup sign-in architecture. Revoke/rotate the historically exposed secret in Google Cloud after reviewing any other applications that may use it.

Owner configuration: Google Cloud → APIs & Services → Credentials → the intended Web client. Authorized origins should include https://study.ayurvedasidhi.com and http://localhost:3001; add the separate staging origin for staging checks. Do not change unrelated clients or publish OAuth changes on a guess. Do not paste secrets into chat.

MySQL normal password login, wrong-password denial, protected-route ownership and logout revocation passed over HTTP. Newly issued JWTs include unique session IDs and require a live hashed student_sessions record. Google token verification and OTP SQL paths were converted to asynchronous database operations; a real Google popup and delivered OTP on the hosted origin still require a normal user session. These are BLOCKED acceptance checks, not claimed passes.

SMTP TLS authentication against Hostinger succeeded using the MySQL-backed configuration; no email was sent. Hashed OTPs, expiration, retry/cooldown checks and password recovery code are retained. Real inbox delivery, spam-folder placement, DNS SPF/DKIM/DMARC and the final production sender/origin must be checked after staging setup. A connection probe is not proof of inbox delivery.

Direct /login and refresh work in the compiled staging preview. No admin session was fabricated and no normal admin login was bypassed. Signed-in superadmin browser acceptance remains an owner action.
