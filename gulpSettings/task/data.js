// Plugins
import gulpPlumber from "gulp-plumber";

// processing JSON here you can add your new plugins in stream
const data = () => {
   return $.gulp.src($.path.data.src)
   .pipe(gulpPlumber())
   .pipe($.gulp.dest($.path.data.dest))
}

export { data };