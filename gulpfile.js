// Configuration
import  gulp  from "gulp";
import  browserSync  from "browser-sync";
import { path } from "./gulpSettings/config/path.js";
import { pluginSettings } from "./gulpSettings/config/app.js";

// global variable 
global.$ = {
   gulp: gulp,
   browserSync: browserSync.create(),
   path: path,
   pluginSettings: pluginSettings
}

// Tasks (add here new tasks if you created them in gulpSettings/tasks/)
import { clear } from "./gulpSettings/task/clear.js";
import { html } from "./gulpSettings/task/html.js";
import { css } from "./gulpSettings/task/css.js";
import { js } from "./gulpSettings/task/js.js";
import { img } from "./gulpSettings/task/img.js";
import { font } from "./gulpSettings/task/font.js";
import { server } from "./gulpSettings/task/server.js";

// Live Server Watcher (add here all files where do you need to watch changes)
const watch = () => {
   $.gulp.watch($.path.html.watch, html).on("all", $.browserSync.reload);
   $.gulp.watch($.path.css.watch, css).on("all", $.browserSync.reload);
   $.gulp.watch($.path.js.watch, js).on("all", $.browserSync.reload);
   $.gulp.watch($.path.img.watch, img).on("all", $.browserSync.reload);
   $.gulp.watch($.path.font.watch, font).on("all", $.browserSync.reload);
}

// Build (add your new task in stream)
const build = $.gulp.series(
   clear,
   $.gulp.parallel(html, css, js, img, font)
);

const dev = $.gulp.series(
   build,
   $.gulp.parallel(watch, server)
);

export { watch };
export default $.pluginSettings.isProd ? build : dev;