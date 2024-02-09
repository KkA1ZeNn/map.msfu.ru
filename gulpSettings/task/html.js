// Plugins
import gulpPlumber from "gulp-plumber";
import fileInclude from "gulp-file-include";
import htmlmin from "gulp-htmlmin";
import size from "gulp-size";
import webpHtml from "gulp-webp-html";

// processing HTML here you can add your new plugins in stream
const html = () => {
   return $.gulp.src($.path.html.src)
   .pipe(gulpPlumber())
   .pipe(fileInclude())
   .pipe(webpHtml())
   .pipe(size())
   .pipe(htmlmin($.pluginSettings.htmlmin))
   .pipe(size())
   .pipe($.gulp.dest($.path.html.dest))
}

export { html };