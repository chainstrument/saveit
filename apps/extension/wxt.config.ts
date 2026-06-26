import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "SaveIt",
    description: "Sauvegarde de marque-pages pour la veille",
    version: "0.0.1",
    permissions: ["activeTab", "storage"],
    action: {
      default_popup: "popup.html",
      default_title: "SaveIt",
    },
  },
});
