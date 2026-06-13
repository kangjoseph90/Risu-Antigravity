# Risu Antigravity

This plugin integrates **Google Antigravity** as a chat completion provider within RisuAI. It provides access to the models available through Antigravity directly in your chats.

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
