# Risu Antigravity

This plugin integrates **Google Antigravity** as a chat completion provider within RisuAI. It provides access to the models available through Antigravity directly in your chats.

## Disclaimer

This is an unofficial, community-developed plugin. It is not affiliated with, endorsed by, or supported by Google or the RisuAI project.

Use this plugin at your own risk. It is provided "as is", without warranties or guarantees of availability, compatibility, or continued access to Antigravity services. Changes to third-party services may cause the plugin to stop working.

You are responsible for complying with the applicable terms of service and usage policies of Google Antigravity and any other services you access through this plugin. Use of an unofficial integration may result in account restrictions or suspension. The maintainers are not responsible for account actions, service interruptions, data loss, or other consequences arising from use of this plugin.

## Features

### Google Antigravity Provider

-   **Seamless Integration**: Registers each Antigravity model directly in RisuAI’s model list.

### Authentication & Security

-   **Secure Login**: Handles authentication securely using access tokens.
-   **Token Management**: Automatically manages access token expiration and refreshing.

### Model Management

-   **Model Selection**: Select Antigravity models in RisuAI; configure reasoning and parameters per model in the Antigravity settings page.
-   **Gemini 4 Argon**: Low, Medium, and High reasoning.
-   **Configuration**: Customize model parameters to suit your needs.

### User Interface

-   **Easy Setup**: Simple UI for logging in and configuring the provider.
-   **Status Indicators**: Visual indicators for login status and service tier.

---

## API v3 migration (2.0.0 beta)

Requires a RisuAI release with Plugin API 3.0; development is verified against `v2026.10.295`. Open **Settings → Antigravity** for the existing configuration UI. Select `[Antigravity] …` models in RisuAI for your main and auxiliary models.

API 2.1 is preserved on [`legacy-api-2.1`](https://github.com/kangjoseph90/Risu-Antigravity/tree/legacy-api-2.1), with the existing [v1.5.2 release](https://github.com/kangjoseph90/Risu-Antigravity/releases/tag/v1.5.2). Before installing a plugin update, export a file backup. To migrate, export a backup from v1.5.2, install the v3 plugin, and import the backup (file import or **Paste Backup JSON**). Old request-type profiles are converted to model profiles; if multiple profiles use the same model, the chat profile takes priority and the original profiles remain in the backup data. Re-select your main and auxiliary models in RisuAI.

The v3 plugin runs inside RisuAI’s sandbox. Network requests use `nativeFetch`; quick backups use plugin-scoped arguments rather than the host’s shared plugin storage. Streaming depends on the selected RisuAI network transport and upstream availability. The public web proxy and desktop/local transports can behave differently.

## Installation & Build

### 1. Install Dependencies

```sh
npm install
```

### 2. Build Plugin

```sh
npm run build
```

This will generate a `dist/risu-antigravity.js` file.

### 3. Import to RisuAI

Import the generated `dist/risu-antigravity.js` file into RisuAI as a plugin.

---

## License

This project is licensed under the **MIT License**.
