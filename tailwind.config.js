/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,svelte}',
  ],
  important: "#risu-antigravity-container",
  corePlugins: {
    preflight: true,
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
