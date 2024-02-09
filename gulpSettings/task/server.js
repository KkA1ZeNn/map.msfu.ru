// Live Server
const server = () => {
   $.browserSync.init({
      server: {
         baseDir: $.path.root
      }
   });
}

export { server }