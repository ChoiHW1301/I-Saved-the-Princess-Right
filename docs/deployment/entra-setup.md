# Microsoft Entra ID setup

This game uses the DEX workforce tenant. Players must sign in with a DEX employee account and receive the `CaravanGame.Player` app role. Keep tenant IDs, client IDs, and group object IDs in the organization's deployment records; never commit credentials, deployment tokens, or access tokens.

## 1. Register the API application

In the Microsoft Entra admin center, open **Identity → Applications → App registrations → New registration**. Choose **Accounts in this organizational directory only** and register `Caravan Escort API`.

Record the tenant ID and API application (client) ID. Under **Expose an API**, accept or set the Application ID URI to `api://<API_CLIENT_ID>`, then add the delegated scope `access_as_user`. Use the full scope `api://<API_CLIENT_ID>/access_as_user` in the web application.

Under **App roles**, create:

- Display name: `Caravan Game Player`
- Allowed member types: `Users/Groups`
- Value: `CaravanGame.Player`
- Enabled: yes

The API verifies the token issuer, tenant, audience, and this exact `roles` claim. A valid DEX token without the role receives HTTP 403; a missing or invalid token receives HTTP 401.

## 2. Register the web SPA

Create a second app registration named `Caravan Escort Web`, again limited to accounts in this organizational directory. Under **Authentication**, add a **Single-page application** platform with redirect URIs for:

- Local development: `http://localhost:5173/`
- The deployed Static Web App: `https://<STATIC_SITE_HOSTNAME>/`

Do not create a client secret for a browser SPA. Under **API permissions**, add delegated permission `access_as_user` from `Caravan Escort API` and grant tenant admin consent if required by DEX policy.

## 3. Assign the DEX employee group

In **Enterprise applications**, open the API service principal, choose **Users and groups → Add user/group**, select the DEX employee security group, and assign `Caravan Game Player`. Confirm the app role assignment is visible before testing. The role is emitted in the API access token; group membership alone is not sufficient.

Use a DEX test account that is a member of the assigned group, and a separate DEX account outside the group for the deny check. Do not use a real employee's identity for test data.

## 4. Configure application settings

Set the Function app values from the API registration:

| Setting | Value |
| --- | --- |
| `ENTRA_TENANT_ID` | DEX tenant ID (GUID) |
| `ENTRA_API_AUDIENCE` | API application (client) ID, matching the `aud` claim in v2 access tokens |

The Bicep deployment accepts `entraTenantId` and `entraApiAudience` and configures the Function app. The Static Web App build needs:

| Build variable | Value |
| --- | --- |
| `VITE_ENTRA_TENANT_ID` | DEX tenant ID |
| `VITE_ENTRA_WEB_CLIENT_ID` | Web SPA client ID |
| `VITE_ENTRA_API_SCOPE` | `api://<API_CLIENT_ID>/access_as_user` |
| `VITE_API_BASE_URL` | Optional Function API origin only; omit it when using the linked Static Web App backend |

The `VITE_` values are public browser configuration, not secrets. Avoid putting credentials or tokens in any Vite variable. For local development, copy the example values into a local environment file and replace them with the DEX registration values; do not commit that file.

## 5. Validate access

After deployment, complete the [release checklist](./release-checklist.md). Verify the DEX test account receives `CaravanGame.Player`, the non-member is rejected, and the browser requests an API token for the API scope. Never paste a token into a ticket, terminal transcript, or source file.
