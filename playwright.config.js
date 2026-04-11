const path = require("node:path");
const { defineConfig } = require("@playwright/test");

const rootDirectory = __dirname;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: [
    ["line"],
    ["html", { open: "never", outputFolder: path.join(rootDirectory, "output", "playwright", "report") }],
  ],
  outputDir: path.join(rootDirectory, "output", "playwright", "test-results"),
  use: {
    baseURL: "http://127.0.0.1:3000",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  webServer: {
    command: 'cmd /c "npm run build && npm run start -- --hostname 127.0.0.1 --port 3000"',
    url: "http://127.0.0.1:3000",
    timeout: 240000,
    reuseExistingServer: !process.env.CI,
  },
});
