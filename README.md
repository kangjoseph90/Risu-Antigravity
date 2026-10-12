# Risu Antigravity

This plugin integrates **Google Antigravity** as a chat completion provider within RisuAI. It provides access to the models available through Antigravity directly in your chats.

## Disclaimer

This is an unofficial, community-developed plugin. It is not affiliated with, endorsed by, or supported by Google or the RisuAI project.

Use this plugin at your own risk. It is provided "as is", without warranties or guarantees of availability, compatibility, or continued access to Antigravity services. Changes to third-party services may cause the plugin to stop working.

You are responsible for complying with the applicable terms of service and usage policies of Google Antigravity and any other services you access through this plugin. Use of an unofficial integration may result in account restrictions or suspension. The maintainers are not responsible for account actions, service interruptions, data loss, or other consequences arising from use of this plugin.

## Features

### Google Antigravity Provider

-   **Seamless Integration**: Adds "[Google] Antigravity" to the list of available providers in RisuAI.

### Authentication & Security

-   **Secure Login**: Handles authentication securely using access tokens.
-   **Token Management**: Automatically manages access token expiration and refreshing.

### Model Management

-   **Model Selection**: Choose from available Antigravity models.
-   **Configuration**: Customize model parameters to suit your needs.

### User Interface

-   **Easy Setup**: Simple UI for logging in and configuring the provider.
-   **Status Indicators**: Visual indicators for login status and service tier.

---

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
