const pathSrc = "./src";
const pathDest = "./public";

// add here paths to your new or replaced files
const path = {
   root: pathDest,

   html: {
      src: pathSrc + "/**/*.html",
      watch: pathSrc + "/html/**/*.html",
      dest: pathDest
   },
   
   data: {
      src: pathSrc + "/data/*.json",
      watch: pathSrc + "/data/**/*.json",
      dest: pathDest + "/data"
   },

   css: {
      src: pathSrc + "/css/*.css",
      watch: pathSrc + "/css/**/*.css",
      dest: pathDest + "/css"
   },

   scss: {
      src: pathSrc + "/sass/*.{sass,scss}",
      watch: pathSrc + "/sass/**/*.{sass,scss}",
      dest: pathDest + "/css"
   },

   js: {
      src: pathSrc + "/js/*.js",
      watch: pathSrc + "/js/**/*.js",
      dest: pathDest + "/js"
   },

   img: {
      src: pathSrc + "/img/*.{png,jpg,jpeg,gif,svg}",
      watch: pathSrc + "/img/**/*.{png,jpg,jpeg,gif,svg}",
      dest: pathDest + "/img"
   },

   font: {
      src: pathSrc + "/font/*.{eot,ttf,otf,otc,ttc,woff,woff2,svg}",
      watch: pathSrc + "/font/**/*.{eot,ttf,otf,otc,ttc,woff,woff2,svg}",
      dest: pathDest + "/font"
   }
};

export { path };
