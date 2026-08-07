# DairyTech Authentication — Step 1

Replace the matching files in the `server` project with the files in this
bundle. Keep the existing config, jobs, controllers, schemas, and routes that
are not included.

Install the required packages:

```bash
npm install cookie-parser helmet express-rate-limit express-validator
```

Generate two different secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run that command twice and place the results in `ACCESS_TOKEN_SECRET` and
`REFRESH_TOKEN_SECRET`. Do not reuse the old `JWT_SECRET`.

The frontend must send cookies:

```js
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
```

Remove the Axios request interceptor that reads `localStorage.getItem("token")`.
Do not store authentication tokens in localStorage.

Authentication endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

For production, serve the frontend and API on the same parent site so the
`SameSite=Strict` cookie policy can remain enabled.
