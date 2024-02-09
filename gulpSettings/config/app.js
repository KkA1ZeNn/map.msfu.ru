// Variables for switching between production and development mode
const isProd = process.argv.includes("--production");
const isDev = !isProd;

// add here settings for your new npm modules
const pluginSettings = {
   isProd: isProd,
   isDev: isDev,

   htmlmin: {
      collapseWhitespace: isProd
   },

   webpack: {
      mode: isProd ? "production" : "development"
   },

   imagemin: {
      verbose: true
   },

   fonter: {
      formats: ["ttf", "woff", "eot", "svg"]
   }
}

export { pluginSettings };